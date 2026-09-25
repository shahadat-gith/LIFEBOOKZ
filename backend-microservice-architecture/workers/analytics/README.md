# Analytics Worker

Consumes `lifebookz-analytics-queue` and writes domain events to the private
`lifebookz-analytics` S3 bucket, Hive-partitioned for Athena. **No HTTP API**,
**no MongoDB** — the analytics store is S3, queried with Athena.

```bash
cd workers/analytics
npm install
npm test
serverless deploy
```

## Flow

```
Business services → EventBridge (analytics allow-list) → lifebookz-analytics-queue
        │
        ▼
this Lambda ──► s3://lifebookz-analytics/events/year=YYYY/month=MM/day=DD/<batch>.jsonl
        │
        ▼
Amazon Athena (database lifebookz_analytics, results in lifebookz-athena-results)
```

Only the event types flagged `analytics: true` in the shared event registry
are routed here — the EventBridge rule in the `system` stack enforces the
allow-list, and PII-bearing events (`OtpRequested`, `AccountProfileUpdated`,
`RequestFailed`) never enter the pipeline.

## Record shape

Each event is flattened to one JSONL row:

```json
{
  "eventId": "…", "eventType": "StoryPublished", "eventVersion": 1,
  "source": "lifebookz.story", "occurredAt": "…",
  "actorId": "…", "actorRole": "author", "correlationId": "…",
  "year": "2026", "month": "09", "day": "25",
  "data": { "storyId": "…", "visibility": "public" }
}
```

- `year/month/day` are also the Hive partition columns (Athena partition
  projection — no table rewrite as data ages).
- Payload keys matching `^(password|otp|token|secret|email|authorization)`
  are dropped in the mapper, so secrets never reach the lake even if a
  producer misbehaves.
- `data` stays a JSON object per row; query it with
  `json_extract_scalar(data, '$.storyId')`.

## Delivery semantics

SQS is at-least-once, so redeliveries can append duplicate rows. The accepted
trade-off (no operational database for analytics) is:

- deduplicate at **query time** with `ROW_NUMBER() OVER (PARTITION BY eventId ORDER BY occurredAt)`
  or `COUNT(DISTINCT eventId)`; `eventId` is preserved from the envelope.
- if exactly-once later matters, add a DynamoDB conditional-claim exactly like
  the email worker's — the handler is structured for it.

Failures:

| Failure | Behaviour |
| --- | --- |
| Unparseable message / missing identity fields | Reported as batch item failure → retried → DLQ after `maxReceiveCount`. |
| S3 write error (transient) | Whole batch reported as failed; SQS retries. |
| Worker crash mid-batch | SQS redelivers; worst case duplicate rows (deduped at query time). |

## S3 layout

```
events/
  year=2026/
    month=09/
      day=25/
        2026092510-14-8f3a2b.jsonl     # UTC hour + random suffix
```

The bucket is created by the `system` stack: Block Public Access on, ACLs
disabled (bucket-owner-enforced), AES256 SSE, no website hosting. The worker's
IAM is `s3:PutObject` on `events/*` only.

## Athena

The worker never calls Athena (spec §20). Create the external table once:

```sql
CREATE EXTERNAL TABLE lifebookz_analytics.events (
  eventId string, eventType string, eventVersion int, source string,
  occurredAt string, actorId string, actorRole string, correlationId string,
  data string
)
PARTITIONED BY (year string, month string, day string)
STORED AS TEXTFILE
LOCATION 's3://lifebookz-analytics/events/'
TBLPROPERTIES ('classification'='json');
```

Query results land in `s3://lifebookz-athena-results/query-results/`.

## Local development

`npm test` runs the unit suite with an in-memory S3 sink — no AWS account.
