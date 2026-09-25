# Story service

Owns the LifeBookz content domain that already exists in the monolith:

- **lifebooks** (title, banner, language, visibility, draft/published, stats)
- **chapters** inside a lifebook, and **story entries** inside a chapter
  (text, media, per-entry visibility — the current upstream design)
- **likes**, **comments** (with author replies and comment likes), **follows**
- **author profiles** (profession, bio, address, social links, covers,
  `isProfileCompleted`) plus the identity projection the feed renders
- **testimonials** and **search** (title + entry title/content, professions)

MongoDB: **Story cluster** (`MONGODB_STORY_URI`). No other service reads it.

## Data ownership

| Data | Owner | Notes |
| --- | --- | --- |
| Lifebook, chapters, entries, media refs | Story | full CRUD + publish |
| Like, Comment, Follow | Story | engagement counters |
| AuthorProfile (profession, bio, …) | Story | feed filter keys live here |
| Account identity (email, username, password, fullName, avatar, status, verification) | **Auth** | projected into Story through events |
| Expert profile, bookings | **Consultation** | not reachable from Story |

`AuthorProfile._id` **is** the Auth account id, so a story references its author
without a mapping table, and `author` on a lifebook is that same id.

## Events published

`StoryCreated`, `StoryUpdated`, `StoryDeleted`, `StoryPublished`,
`StoryUnpublished`, `StoryLiked`, `StoryUnliked`, `CommentCreated`,
`CommentUpdated`, `CommentDeleted`, `CommentLiked`, `CommentReplyCreated`,
`FollowCreated`, `FollowRemoved`, `AuthorProfileSubmitted`,
`AuthorProfileUpdated`, `TestimonialCreated`, `TestimonialModerated`,
`TestimonialDeleted`.

Events never carry actor display names: Notification resolves the actor from
its own `AccountProjection`, so a renamed account shows correctly on old
notifications.

## Events consumed

`AccountRegistered` (create the author projection), `AccountProfileUpdated`
(sync name/username/avatar), `AccountVerificationDecided` (sync verification),
`AccountStatusChanged` (sync status/deletion). Delivered through
`lifebookz-story-events-queue` with a DLQ (`maxReceiveCount: 5`) and made
idempotent by the service's own `processed_events` collection (unique index on
`eventId` + 30-day TTL).

## Authorization

API Gateway answers *who* the caller is; the service decides *what* they may
do:

- lifebook writes → the owning author only (`author` claim + document owner check)
- publishing → additionally requires `isProfileCompleted` (because the profile
  data lives here, not in the JWT)
- like/comment → any signed-in role (`user`, `author`, `expert`)
- comment edit → its author; delete → its author, the story's author or an admin
- comment reply → the story's author only
- testimonial moderation → `admin` only
- media presign/delete → author folders only for authors, `stories/*` for story media

## Lambda ↔ Mongo

`maxPoolSize: 15`, `reservedConcurrency: 60` → at most ~900 sockets (Atlas M10
≈ 1500). This is the read-heavy service, so the pool is the largest in the
fleet while the concurrency cap keeps the cluster safe.

## Local development

```bash
cp .env.example .env      # set MONGODB_STORY_URI (or the secret id) and R2 keys
npm install               # from backend-microservice-architecture
npm test -w @lifebookz/story
npx serverless package -w @lifebookz/story
```

## Verification performed

`npm test -w @lifebookz/story` covers: media sanitising, the visibility matrix
(public/followers/private per lifebook and per entry), the author-profile
requirement on create, chapter/entry add-update-delete with cross-author
ownership rejection, the publish gate and the `StoryPublished` payload (entry
counts, followers notified downstream), like/unlike counter + event symmetry,
comment creation/reply/edit authorization, follow/unfollow counter symmetry
and self-follow rejection, profile-completion → `AuthorProfileSubmitted`,
profession propagation to the feed's denormalised field, admin-only testimonial
moderation, and the router-level role gates for every route group.
