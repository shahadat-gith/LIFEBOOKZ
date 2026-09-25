# Consultation Service

Owns the expert domain: expert profiles, expert matching and consultation
bookings. Deployed independently, with its own MongoDB Atlas cluster, its own
`serverless.yml` and its own deploy command.

```bash
cd services/consultation
npm install
npm test
serverless deploy            # or: npm run deploy from the repo root
```

## What it owns

| Concern | Collection | Notes |
| --- | --- | --- |
| Expert professional profile | `expertprofiles` | expert-owned fields (`phone`, `expertise`, `qualification`, `bio`, `categories`, `languages`, `experience`, `price`) plus `rating`, `sessions` and a **projection** of the Auth account |
| Consultation bookings | `bookings` | `problem`, `category`, `sessionType`, `date`, `time`, `notes`, `preferredContact`, `status` (`pending`/`confirmed`/`completed`/`cancelled`), `completedAt`, client contact snapshot |
| Consumer idempotency | `processedevent` | unique `eventId` + 30-day TTL |

It does **not** own accounts, stories, notifications or analytics data, and it
never reads another service's cluster.

## Routes

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/consult/match` | reader | Rank approved experts for a described problem |
| POST | `/api/v1/consult/bookings` | reader | Create a booking |
| GET | `/api/v1/consult/bookings` | reader | The caller's own bookings |
| PATCH | `/api/v1/consult/bookings/{bookingId}/cancel` | reader | Cancel an own pending/confirmed booking |
| GET | `/api/v1/experts/me` | expert | Own expert profile |
| PATCH | `/api/v1/experts/me` | expert | Update professional fields |
| POST | `/api/v1/experts/me/media/presign` | expert | Presigned R2 upload |
| DELETE | `/api/v1/experts/me/media` | expert | Delete own media |
| GET | `/api/v1/experts/me/bookings` | expert | Every request addressed to this expert |
| PATCH | `/api/v1/experts/me/bookings/{bookingId}` | expert | Confirm / complete / cancel |
| GET | `/api/v1/experts/{expertId}` | public | Public expert profile |

`access` is enforced twice: by API Gateway's JWT authorizer and again in the
router. The *resource* decision (is this booking yours? is this request
addressed to you?) is made in the domain services.

## Events

Published (through `shared/events`, never by calling EventBridge directly):

- `ConsultationBooked` — carries a transport-only `notify` block with the expert
  and client contact details the email worker needs.
- `ConsultationStatusChanged` — emitted only when the status actually changes.
- `ConsultationCancelled`
- `ExpertProfileSubmitted` — the handoff to System's admin review queue.
- `ExpertProfileUpdated`

Consumed (EventBridge rule → `lifebookz-consultation-events-queue-<stage>` →
`events` Lambda):

- `AccountRegistered` → creates the expert projection row
- `AccountProfileUpdated` → syncs name/avatar/username
- `AccountVerificationDecided` → syncs `verification.status`
- `AccountStatusChanged` → syncs `accountStatus`

Every message is idempotent through `processedevent`, and failures are reported
per message (`ReportBatchItemFailures`) so only genuinely poisonous messages
reach the DLQ after 5 receives.

### `notify` — the one PII carrier

`notify` is the only block in an event envelope that may contain PII
(`expertEmail`, `clientEmail`, `clientPhone`, `problem`). It exists because the
Notification service must build an email job without a cross-service lookup.
The Analytics Worker drops `notify` before writing to S3, and no PII appears in
`data`, so nothing personal is ever queryable in Athena.

## Why booking never sends email

The existing backend called `sendBookingRequestMail` / `sendBookingStatusMail`
inline and swallowed the failure. Here the booking transaction publishes an
event and returns; Notification turns it into a queued job and the email worker
talks to SES. A mail outage therefore cannot fail or delay a booking, and a
failed send is retried instead of silently lost.

Compared with the monolith, `ConsultationCancelled` deliberately triggers **no**
notification: the old `cancelMyBooking` neither emailed nor notified anyone, and
this architecture does not invent behaviour.

## Concurrency and correctness

- **A completed consultation counts once.** `books → transitionStatus` uses
  `status: { $ne: to }` in a single `updateOne`, so of two concurrent
  "completed" clicks exactly one modifies the document; only that one increments
  `expertprofiles.sessions`.
- **Cancellation is owner-scoped** (`findOne({_id, client})`), so a guessable id
  is a 404, not someone else's booking.
- **Matching is deterministic**: rating, then completed sessions, then name.
- **No match score is fabricated** — `matchScore` stays `null` and `matched`
  stays `false`, exactly like the current backend after semantic matching was
  removed.

## Connection management

`src/db.js` creates one Mongo connection per Lambda container and caches it, so
a warm invocation reuses the pool instead of opening a socket per request.
`maxPoolSize: 10` with `reservedConcurrency: 40` bounds this service at ~400
connections to its own cluster, well inside an Atlas M10 limit — and because
each service has its own cluster, Story's larger pool cannot exhaust
Consultation's.

## Configuration

See `.env.example`. Required at runtime: `EVENT_BUS_NAME`, plus either
`MONGODB_CONSULTATION_URI` (local) or `MONGODB_CONSULTATION_URI_SECRET_ID`
(AWS). The cluster URI, R2 keys and all other secrets come from Secrets Manager
in AWS — never from the Lambda environment.
