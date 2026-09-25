# System Service

Admin and developer portals — review queues, verification coordination, the
privileged audit trail and the platform's **shared infrastructure** (the one
HTTP API, the event bus, the queues, the analytics bucket).

```bash
cd services/system
npm install
npm test
serverless deploy   # deploy this stack FIRST: it owns the shared API/bus/queues
```

## Why this stack also owns the platform infrastructure

Every Serverless service is independently deployable, but they must share a
single API Gateway (spec §7). The clean Serverless pattern: one stack creates
the HTTP API + authorizer + bus + queues and **exports** them via CloudFormation
Outputs; every other stack attaches with `httpApi.id: !ImportValue …`. System —
the least business-critical service — is that owning stack. Business services
can be redeployed or torn down without recreating the shared API.

## Responsibilities

| Area | Behaviour |
| --- | --- |
| Admin review queues | Read model of author/expert applications, fed by `AuthorProfileSubmitted` / `ExpertProfileSubmitted` / `AccountRegistered` / `AccountProfileUpdated` events. |
| Verification decisions | Admin approve/reject is **executed by Auth** (it owns verification state) over an internal service-token endpoint; System coordinates, audits, publishes `AdminActionRecorded`. |
| Audit trail | Append-only `AuditLog` collection: every admin decision and privileged login. The monolith's "clear logs" endpoint is deliberately dropped — audit trails are not cleared from inside the product. |
| Developer logs | Privileged actions from the audit collection; operational logs from CloudWatch Logs Insights. |

## Routes

| Method | Path | Role |
| --- | --- | --- |
| GET | `/api/v1/system/me` | admin |
| GET | `/api/v1/system/dashboard` | admin |
| GET | `/api/v1/system/authors/pending` | admin |
| GET | `/api/v1/system/authors/approved` | admin |
| GET | `/api/v1/system/experts/pending` | admin |
| GET | `/api/v1/system/experts/approved` | admin |
| PATCH | `/api/v1/system/{role}/{accountId}/verification` | admin |
| GET | `/api/v1/developer/me` | developer |
| GET | `/api/v1/developer/logs` | developer |
| GET | `/api/v1/developer/logs/stats` | developer |
| GET | `/api/v1/developer/application-logs` | developer |

The router re-checks the role claim on every route — a reader/author/expert
token is 403 before any handler runs.

## Collections (System's own cluster)

| Collection | Purpose |
| --- | --- |
| `reviewqueues` | Admin review cards (event-fed projection). |
| `auditlogs` | Append-only privileged action history. |
| `processedevents` | Consumer idempotency (unique `eventId`, 30-day TTL). |

## What System deliberately does NOT do

- **No direct reads of other services' clusters.** The dashboard's pending
  counts come from the event-fed review queue, not from a cross-cluster
  `countDocuments` like the monolith did.
- **No verification writes.** Auth owns verification; System only calls and
  audits.
- **No log clearing.** Retention is CloudWatch `logRetentionInDays` +
  lifecycle policy, configured in infrastructure.

## Cross-service call

```
System (admin decides) ──PATCH /api/v1/internal/accounts/{id}/verification──► Auth
                            x-lifebookz-service-token header                    │
                                                                                ├─ updates Account.verification
                                                                                └─ publishes AccountVerificationDecided
                                                                                     → Notification (email job)
                                                                                     → Story/Consultation (projection sync)
```

The service token is the shared `INTERNAL_SERVICE_TOKEN` secret; Auth
constant-time-compares it.

## Event sources

`SystemEventsQueue` (DLQ-backed, `maxReceiveCount: 5`) feeds the consumer that
maintains the read models above. Idempotent via `processed_events`.

## IAM highlights

- `events:PutEvents` on the bus this stack creates.
- `logs:StartQuery/GetQueryResults/DescribeLogGroups` for the developer
  portal's Insights queries.
- `secretsmanager:GetSecretValue` on `lifebookz/system/*` and
  `lifebookz/internal/*` only.
- No SES, no SQS receive on the business queues, no MongoDB-but-its-own.
