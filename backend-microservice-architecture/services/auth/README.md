# Auth service

Identity for the whole platform: registration, sign-in, RS256 token issuance,
refresh/rotation/revocation, OTP password reset, JWKS publication and the
account identity document (name, avatar, status, application verification).

MongoDB: **Auth cluster** (`MONGODB_AUTH_URI` / `lifebookz/auth/mongodb-uri`).
Only this service may read or write it.

It is the **only** component that holds signing material. Business services
receive identity from API Gateway claims and never verify a token themselves.

## Routes

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/.well-known/openid-configuration` | public | API Gateway fetches this to discover `jwks_uri` |
| GET | `/.well-known/jwks.json` | public | public keys only (`kid`-tagged) |
| POST | `/api/v1/auth/register` | public | `role` ∈ user/author/expert |
| POST | `/api/v1/auth/login` | public | role-scoped, includes admin/developer |
| POST | `/api/v1/auth/refresh` | public | rotates the refresh token |
| POST | `/api/v1/auth/logout` | JWT | ends every session by default |
| GET | `/api/v1/auth/me` | JWT | account identity |
| PATCH | `/api/v1/auth/me` | JWT | fullName / avatar / covers |
| POST | `/api/v1/auth/forgot-password` | public | OTP to the account email |
| POST | `/api/v1/auth/verify-reset-otp` | public | OTP → single-use reset token |
| POST | `/api/v1/auth/reset-password` | public | atomic write, revokes all sessions |
| GET/PATCH/DELETE | `/api/v1/users/me` | JWT (user) | reader identity + deletion |
| POST | `/api/v1/users/me/media/presign` | JWT (user) | R2 presigned PUT for reader media |
| GET | `/api/v1/users/{userId}` | public | public reader profile |
| PATCH | `/api/v1/internal/accounts/{accountId}/verification` | service token | admin decision, called by `system` |

## JWT design

| Property | Value |
| --- | --- |
| Algorithm | RS256 (asymmetric) |
| Issuer (`iss`) | `https://api.lifebookz.com` |
| Audience (`aud`) | `lifebookz-api` |
| Key id (`kid`) | `JWT_KID` (e.g. `lifebookz-auth-2026-09`) |
| Private key | Secrets Manager `lifebookz/auth/jwt-signing-key` |
| Public key | `/.well-known/jwks.json` → consumed by the API Gateway authorizer |
| Access token lifetime | 15 minutes (`ACCESS_TOKEN_TTL_SECONDS`) |
| Refresh token | opaque 256-bit string, hashed at rest, 30 days |
| Revocation | refresh-time: token version + per-family reuse detection |

Access tokens carry `sub`, `role`, `email`, `username`, `tokenVersion`, `jti`,
`iat`, `exp`, `iss`, `aud`. Nothing else — resource ownership is decided by the
owning service, because it can change without re-issuing tokens.

**Key rotation**: add the new key pair to Secrets Manager, set `JWT_KID` to the
new id and set `JWT_PREVIOUS_PUBLIC_KEY` to the old public key, then deploy —
the JWKS publishes both keys. Drop the previous key once the access-token TTL
plus the refresh window has passed.

**Why not HS256 (what the monolith used)**: a shared secret cannot be validated
by API Gateway, so every Lambda would have to verify tokens itself and every
service would need the same secret. RS256 lets the gateway validate before the
Lambda is invoked and keeps signing material in exactly one place.

## Abuse protection

API Gateway throttling is per-route and global; it cannot express per-identity
rules, so the service enforces them on a DynamoDB table with TTL
(`lifebookz-auth-otp-limits-<stage>`):

| Rule | Limit | Window |
| --- | --- | --- |
| OTP requests per email | 3 | 1 hour |
| OTP requests per IP | 10 | 1 hour |
| OTP verification attempts per email | 5 | 1 hour |
| Login attempts per email + role | 10 | 15 minutes |

The OTP itself is stored as a SHA-256 hash and travels to the recipient only
through the `OtpRequested` event → Notification → SQS email queue → email
worker. It is explicitly excluded from the analytics allow-list, so it can
never land in S3/Athena.

## Lambda ↔ Mongo

`maxPoolSize: 10`, `minPoolSize: 0`, `serverSelectionTimeoutMS: 5000`,
`waitQueueTimeoutMS: 10000`, function `reservedConcurrency: 100`. Worst case is
1000 sockets against the Auth cluster (Atlas M10 ceiling ≈ 1500), and the
short server-selection timeout turns a failing cluster into a fast 503 instead
of burning the API Gateway 29s budget.

## Local development

```bash
cp .env.example .env          # fill in MONGODB_AUTH_URI, JWT_PRIVATE_KEY …
npm install                    # from backend-microservice-architecture
npm test -w @lifebookz/auth    # unit tests, no AWS or database needed
npx serverless package -w @lifebookz/auth
```

Generate a local key pair with:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwt.pem
```

## Verification performed

`npm test -w @lifebookz/auth` covers registration (including username
derivation and duplicate handling), role-scoped login messages, privileged
login, session rotation/reuse detection/token-version revocation, the full OTP
reset flow (hash at rest, wrong code, replay), media presign scoping and the
router-level authorization of every route (public, JWT, role, service token).
