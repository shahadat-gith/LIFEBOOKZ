# Notification Service

Owns in-app notifications, the recipient/actor read model, and **all** email
routing. Deployed independently, with its own MongoDB Atlas cluster.

```bash
cd services/notification
npm install
npm test
serverless deploy
```

## Responsibilities

1. **Store notifications** for readers, authors and experts (one collection, a
   polymorphic recipient, exactly as the existing backend).
2. **Serve the inbox API** — list, unread count, mark one/all read, delete one,
   clear all.
3. **Decide who should know** about a domain event, and **queue the email jobs**
   that follow from it.
4. **Never send an email.** It writes to `lifebookz-email-queue` and returns; the
   email worker owns SES.

```
business services → EventBridge → notification queue → this consumer
                                                          ├→ notifications (own cluster)
                                                          ├→ account projections (own cluster)
                                                          └→ lifebookz-email-queue → email worker → SES
```

## Collections

| Collection | Purpose |
| --- | --- |
| `notifications` | The inbox rows. Unique sparse `dedupeKey` makes event-driven creation idempotent. |
| `accountprojections` | Recipient/actor read model (`fullName`, `username`, `email`, `avatar`, `status`), written only by the Auth event stream. |
| `processedevent` | Consumer idempotency: unique `eventId` + 30-day TTL. |

## Routes

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/v1/notifications` | reader / author / expert |
| GET | `/api/v1/notifications/unread-count` | reader / author / expert |
| PATCH | `/api/v1/notifications/read-all` | reader / author / expert |
| PATCH | `/api/v1/notifications/{notificationId}/read` | reader / author / expert |
| DELETE | `/api/v1/notifications` | reader / author / expert |
| DELETE | `/api/v1/notifications/{notificationId}` | reader / author / expert |

The recipient is always derived from the token role (`user` → `User`,
`author` → `Author`, `expert` → `Expert`) plus the account id, so a token can
only ever address its own inbox. Another account's notification id is a 404, not
a 403 — the caller is not told that it exists.

## Consumed events → behaviour

| Event | In-app notification | Email job |
| --- | --- | --- |
| `AccountRegistered` | — | `welcome` |
| `AccountProfileUpdated` | — (refreshes the projection) | — |
| `AccountVerificationDecided` | — | `application-approved` / `application-rejected` |
| `OtpRequested` | — | `password-reset-otp` (carries the code) |
| `StoryLiked` (`liked: true`) | author, type `like`, link to the story | — |
| `CommentCreated` | author, type `comment`, with `commentId` | — |
| `FollowCreated` | author, type `follow` | — |
| `StoryPublished` (public only) | fan-out to `data.followers` | — |
| `ConsultationBooked` | expert, type `booking` | `booking-requested` to the expert |
| `ConsultationStatusChanged` | — | `booking-status` to the client |
| `ConsultationCancelled` | — (logged no-op, see below) | — |

Everything here mirrors the existing backend's `createNotification` call sites
and `mailer.js` sends; the mapping document lists them one by one.

Deliberate behaviour notes:

- **Reply notifications are not invented.** The monolith's `replyToComment`
  notified nobody; neither does this service. `CommentReplyCreated` is published
  for analytics only.
- **Status changes email only.** The monolith never created an in-app
  notification for a status change, so neither does this service.
- **Cancellations do nothing.** `cancelMyBooking` notified and emailed nobody.
  The handler exists to make that an explicit, logged no-op rather than a
  silently unhandled event.
- **A publish fan-out no longer depends on the request body.** The monolith only
  notified followers when the publish request explicitly carried
  `visibility: "public"`; here the story's actual visibility decides.

## Email jobs

A job is a small JSON payload with a deterministic id:

```json
{
  "jobId": "9f2c…",
  "type": "email",
  "jobVersion": 1,
  "template": "booking-requested",
  "to": "expert@lifebookz.com",
  "toName": "Expert One",
  "replyTo": "reader@lifebookz.com",
  "data": { "clientName": "Priya Reader", "sessionType": "video", "problem": "…" },
  "sourceEventId": "3f1a…",
  "queuedAt": "2026-09-25T10:00:00.000Z"
}
```

`jobId = sha256(template | recipient | sourceEventId)`. Determinism is what makes
the email worker's DynamoDB idempotency record work: a redelivered message
produces the same id, the conditional write fails, and the recipient does not get
the email twice.

Templates: `welcome`, `password-reset-otp`, `booking-requested`,
`booking-status`, `application-approved`, `application-rejected`. They match the
six sends the monolith actually performed (`modules/*/utils.js`,
`core/services/mailer.js`).

**PII stays out of analytics.** The job payload lives only on the queue; the
analytics event that accompanies it (`EmailQueued`) carries the template name and
the subject id — never the address, the name or the OTP.

## Idempotency

Two layers, because either alone is insufficient:

1. `processedevent` (unique `eventId`) stops the same event being handled twice,
   and is released when handling failed so an SQS redelivery actually retries.
2. Every notification has a deterministic `dedupeKey` (`eventId:type`, plus the
   recipient for a fan-out) and every email job a deterministic `jobId`. So even
   a partial failure that is retried cannot produce a second visible effect.

## Fan-out cap

`MAX_NOTIFICATION_FANOUT` (default 500) bounds a `StoryPublished` fan-out. The
list travels inside the event because Story owns the follow graph and this
service must not read Story's cluster, and an EventBridge event is capped at
256 KB — so the cap is a hard requirement, not a tuning knob. When it is hit the
consumer logs `Notification fan-out was capped`; the correct long-term fix is a
dedicated fan-out worker (documented in the root README's migration notes).

## Connection management

One cached Mongo connection per Lambda container, `maxPoolSize: 10`, and
`reservedConcurrency: 20` on the consumer → at most ~200 sockets on this
service's own cluster. Because each service has its own cluster, a Story fan-out
burst cannot exhaust Notification's connections.

## Configuration

See `.env.example`. Required: `EVENT_BUS_NAME`, `SQS_EMAIL_QUEUE_URL`, and either
`MONGODB_NOTIFICATION_URI` (local) or `MONGODB_NOTIFICATION_URI_SECRET_ID` (AWS).
