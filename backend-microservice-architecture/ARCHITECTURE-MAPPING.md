# Existing Backend → New Architecture Mapping

Every row below was verified by reading the monolith's source
(`backend/src/modules/*`, `backend/src/core/*`). The monolith is **not
modified**; this document is the provenance record for the new code.

## Monolith layout (observed)

```
backend/src/
├── core/
│   ├── config/index.js           single config source (database, jwt, aws, r2, admin, developer, frontend urls)
│   ├── services/                 accounts.js · email.js (SES) · mailer.js (templates) · logger.js · upload.js (R2)
│   ├── middlewares/              auth.js (HS256 authenticate/authorize) · errorHandler.js · multer.js
│   ├── models/                   image.schema.js {url,key} · auth.schema.js (passwordHash, OTP fields)
│   ├── utils/                    errors.js (isAppError factories) · helpers.js (generateToken, hashPassword, …)
│   └── email-templates/          layout.js · welcome.js · otp.js · application.js · booking.js
└── modules/
    ├── user/        User model + register/login/me/forgot-otp-reset + GET /users/:userId
    ├── author/      Author model + register/login/me/stories/stats + approved list + public profile
    ├── expert/      Expert model + register/login/me/bookings + public profile
    ├── admin/       env-credential login + review queues + dashboard + users/stories lists
    ├── developer/   env-credential login + application logs (Log model) + stats + clear
    ├── story/       Story/Lifebook: chapters hold story entries; per-entry visibility; likes/comments
    ├── consult/     Booking model: match → book → expert status transitions → cancel
    ├── notification/ polymorphic recipient notifications + unread count + mark read
    ├── following/   Follow rows + follower/following lists
    ├── testimony/   Testimonials + admin moderation
    └── search/      plain text searchStories
```

## Service mapping

| Monolith | New service | Notes |
| --- | --- | --- |
| `modules/user` (User model, register/login/me, forgot/verify/reset, logout) | **auth** | One `Account` collection for all three roles (identity identical); role-specific profile split out (below). HS256 → RS256 + refresh tokens + `tokenVersion` revocation. OTP flow kept: hash stored, not plaintext (improvement noted). |
| `modules/author` — *identity* fields (fullName, email, username, avatar, auth, status, verification) | **auth** | `Account.role = "author"` |
| `modules/author` — *professional* fields (profession, bio, phone, dob, gender, address, socialLinks, covers, `isProfileCompleted`) | **story** | `AuthorProfile` model; `PATCH /authors/me` is the "complete your profile" step that unlocks publishing (`AuthorProfileSubmitted` → admin review) |
| `modules/expert` — identity fields | **auth** | `Account.role = "expert"` |
| `modules/expert` — professional fields (phone, expertise, qualification, categories, bio, languages, experience, price, rating, sessions, covers, `isProfileCompleted`) | **consultation** | `ExpertProfile`; rating/sessions now derived from bookings (consultation-owned), not stored on identity |
| `modules/story` (lifebooks, chapters, entries, visibility, media refs, stats) | **story** | Same domain model: parent title+bannerImage; chapters without title/media; entries with title+media; visibility per entry |
| `modules/story` likes/comments/replies | **story** | `engagement` collections; reply notifications intentionally *not* invented (monolith's replyToComment notifies nobody — `CommentReplyCreated` is analytics-only) |
| `modules/following` | **story** | Follow graph feeds fan-out + author stats |
| `modules/testimony` | **story** | Same moderation statuses |
| `modules/search` (`searchStories`) | **story** | `/api/v1/search` kept; no semantic/embedding search (none exists) |
| `modules/consult` (Booking, match, status transitions) | **consultation** | Same `BOOKING_STATUSES`; match by category+rating (monolith logic) |
| `modules/notification` | **notification** | Same polymorphic recipient; same routes; now also queues email jobs |
| `modules/admin` (login, dashboard, review queues, approve/reject, users/stories lists) | **system** + **auth** | Lists from System's event-fed read model; approve/reject *executed by Auth* (owns verification) via internal service-token endpoint; audit logged |
| `modules/developer` (login, logs, stats, clear) | **system** | Privileged-action audit in Mongo; operational logs via CloudWatch Insights; `DELETE logs` intentionally dropped (audit trails are append-only) |
| `core/services/accounts.js` (`findAccountRolesByEmail`, `noAccountMessage`) | **auth** | Same cross-portal "registered as X" login errors |
| `core/services/email.js` + `mailer.js` + `email-templates/` | **notification** (job production) + **workers/email** (SES send) | Six sends observed: welcome, otp, application-approved, application-rejected, booking-request, booking-status — same six job types |
| `core/services/upload.js` (R2 presign, role folders, cover variants) | `shared/aws` mediaStore + per-service presign routes | R2 unchanged; kind allow-lists per service (reader/authors/experts folders) |
| `core/middlewares/auth.js` (HS256) | API Gateway JWT authorizer + `shared/auth.readClaims` + router access rules | Who vs may-they split (spec §5–6) |
| `core/middlewares/errorHandler.js` + `core/utils/errors.js` | `shared/errors` + router envelope | Same `isAppError` factories, same specific per-portal login errors |
| `core/services/logger.js` | `shared/logger` | Structured JSON, redaction of otp/token/password keys added |
| `core/models/image.schema.js` | Per-service `{url,key}` subschemas | Unchanged shape |
| `scripts/` (audit-required-fields, backfill-usernames) | Not carried (monolith-local maintenance) | Username backfill logic lives in auth's `resolveUsername` |

## Route mapping (monolith path → new path)

| Monolith | New | Service |
| --- | --- | --- |
| `POST /users/register` | `POST /api/v1/auth/register` (role=user) | auth |
| `POST /users/login` | `POST /api/v1/auth/login` (role=user) | auth |
| `GET/PATCH/DELETE /users/me` | `GET/PATCH/DELETE /api/v1/users/me` | auth |
| `POST /users/forgot-password` / `verify-reset-otp` / `reset-password` | `POST /api/v1/auth/…` (same names) | auth |
| `GET /users/:userId` | `GET /api/v1/users/{userId}` | auth |
| `POST /authors/register` | `POST /api/v1/auth/register` (role=author) | auth |
| `GET/PATCH /authors/me` | `GET/PATCH /api/v1/authors/me` | story (profile) |
| `GET /authors/me/stories[/newsId]`, `/me/stats` | same under `/api/v1/authors/me/…` | story |
| `GET /authors/approved`, `GET /authors/:authorId` | `/api/v1/authors/approved`, `/api/v1/authors/{authorId}` | story |
| `POST /experts/register` | `POST /api/v1/auth/register` (role=expert) | auth |
| `GET/PATCH /experts/me` | `GET/PATCH /api/v1/experts/me` | consultation |
| `GET /experts/me/bookings`, `PATCH /experts/me/bookings/:id` | `/api/v1/experts/me/bookings…` | consultation |
| `GET /experts/:expertId` | `GET /api/v1/experts/{expertId}` | consultation |
| `POST /consult/match`, `GET/POST /consult/bookings`, `POST /consult/bookings/:id/cancel` | `/api/v1/consult/…` (same) | consultation |
| `GET/PATCH /notifications/…`, `unread-count` | `/api/v1/notifications/…` | notification |
| `POST /:authorId/follow` (+ list/check routes) | `/api/v1/following/{authorId}/follow` etc. | story |
| `GET /search`, professions | `/api/v1/search`, `/api/v1/search/professions` | story |
| `POST/GET /testimonials`, `PATCH status` | `/api/v1/testimonials/…` | story |
| `POST /admin/login`, `GET /admin/*`, approve/reject | `/api/v1/system/…`; login via `POST /api/v1/auth/login` (role=admin) | system (+auth) |
| `POST /developer/login`, `GET /developer/logs…` | `/api/v1/developer/…`; login via auth (role=developer) | system (+auth) |

## Model → database mapping

| Monolith model | New model | New cluster |
| --- | --- | --- |
| `user/model.js` User | `auth/src/models/account.js` Account | Auth |
| `author/model.js` Author (identity half) | Account | Auth |
| `author/model.js` Author (professional half) | `story/src/models/author-profile.js` AuthorProfile | Story |
| `expert/model.js` Expert (identity half) | Account | Auth |
| `expert/model.js` Expert (professional half) | `consultation/src/models/expert-profile.js` ExpertProfile | Consultation |
| `story/models/Story` (+chapter/entry shapes) | `story/src/models/lifebook.js` | Story |
| engagement rows (likes/comments/follows) | `story/src/models/engagement.js` | Story |
| `testimony` model | `story/src/models/testimonial.js` | Story |
| `consult/model.js` Booking | `consultation/src/models/booking.js` | Consultation |
| `notification/model.js` Notification | `notification/src/models/notification.js` | Notification |
| `core/models/log.model.js` Log | `system/src/models/audit-log.js` AuditLog (+ CloudWatch) | System |

## Integration mapping

| Monolith | New |
| --- | --- |
| SES direct from request handlers (`sendEmail`/`sendEmailSafely`) | Notification → SQS email queue → email worker → SES |
| R2 presign in `core/services/upload.js` | `shared/aws` mediaStore; presign routes per owning service |
| `console`-based logger + Log collection | `shared/logger` JSON → CloudWatch; audit rows in System |
| No Razorpay anywhere (verified: zero references) | `RAZORPAY_API_KEY` documented, unused |
| HS256 `JWT_SECRET` env | RS256 keypair in Secrets Manager + JWKS endpoint |

## Deliberate behaviour changes (documented, not regressions)

1. **One register endpoint with `role`** replaces three portal-specific ones.
2. **OTP stored hashed**, attempt counters in DynamoDB (abuse protection).
3. **Refresh tokens + token version** replace 7-day HS256 tokens.
4. **Publish fan-out capped** (500) — follower list rides in the event; monolith only notified followers when the request body said `visibility: "public"`, new code uses the story's actual visibility.
5. **Admin decisions execute in Auth** (single writer for verification), System coordinates + audits.
6. **Developer "clear logs" removed** — append-only audit.
7. **Status-change emails to clients** (booking status) kept exactly; in-app notifications for them were never in the monolith and are not invented.
