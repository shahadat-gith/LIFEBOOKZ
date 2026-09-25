# Email Worker

Consumes `lifebookz-email-queue` and sends transactional email through SES.
**No HTTP API** — the worker is unreachable from the internet; the only door in
is its SQS event source mapping.

```bash
cd workers/email
npm install
npm test
serverless deploy
```

## Flow

```
Notification service (or any business service)
        │  deterministic jobId
        ▼
lifebookz-email-queue ──(maxReceiveCount 5)──► lifebookz-email-dlq
        │
        ▼
this Lambda  ──►  DynamoDB idempotency claim (jobId)
        │
        ▼
Amazon SES  ──►  EmailDelivered / EmailFailed events on the event bus
```

## Message contract

`src/schema.js` is the producer/consumer contract (zod). Every job carries:

| Field | Purpose |
| --- | --- |
| `jobId` | Deterministic id (sha256 of template+recipient+source event). The idempotency key. |
| `template` | One of the six templates the monolith actually sent. |
| `to` / `toName` / `replyTo` | Recipient. |
| `data` | Template variables (names, OTP, booking fields). |
| `sourceEventId` | Ties the send back to the domain event that caused it. |

An invalid payload is a **permanent** failure: it is logged with full context
and reported as a batch item failure so it eventually reaches the DLQ — it is
never silently deleted.

## Idempotency

`jobId → conditional PutItem` on this worker's own DynamoDB table
(`lifebookz-email-worker-idempotency-<stage>`). Two concurrent deliveries race
on the same key; exactly one wins and sends. Records TTL out after 7 days. If
the SES call fails the claim is **released**, so the SQS redelivery is a real
retry rather than being mistaken for a duplicate.

## Failure handling

| Failure | Behaviour |
| --- | --- |
| Invalid payload | Permanent — logged, reported to SQS, DLQ after 5 receives. |
| SES `MessageRejected` (bad address, suppressed) | Permanent — same routing. |
| SES throttling / 5xx / network | Transient — claim released, SQS retries with backoff via visibility timeout. |
| Worker crash mid-batch | SQS redelivers the whole batch; idempotency makes that safe. |

`maxReceiveCount: 5` lives on the queue's redrive policy (owned by the `system`
stack): five attempts is enough to ride out an SES hiccup without pinning a
poison message in the queue for hours.

## IAM (least privilege)

- `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes`,
  `sqs:GetQueueUrl` — on the email queue ARN only.
- `ses:SendEmail`, `ses:SendRawEmail` — on the SES identity/configuration set.
- `dynamodb:PutItem`, `dynamodb:DeleteItem` — on the worker's idempotency table.

No MongoDB, no EventBridge publish (delivery results go out via the shared bus
only if configured), no S3, no Athena.

## Local development

`npm test` runs the unit suite with a fake SES gateway and an in-memory
idempotency store — no AWS account required.
