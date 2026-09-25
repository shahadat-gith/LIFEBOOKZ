import test from "node:test";
import assert from "node:assert/strict";

import { createRouter } from "@lifebookz/shared-aws";

import {
  createFakeAuthorProfiles,
  createFakeEngagement,
  createFakeLifebooks,
  createFakeMediaStore,
  createFakeTestimonials,
  createLogger,
  createPublisher,
} from "./fakes.js";

import routes from "../src/routes.js";
import { createAuthorProfileService } from "../src/services/author-profile.js";
import { createEngagementService } from "../src/services/engagement.js";
import { createLifebookService } from "../src/services/lifebooks.js";
import { createTestimonialService } from "../src/services/testimonials.js";

const AUTHOR = "65f1c0a2b3d4e5f6a7b8c9d0";
const READER = "65f1c0a2b3d4e5f6a7b8c9d2";

function createDeps() {
  const logger = createLogger();
  const publisher = createPublisher();
  const lifebooks = createFakeLifebooks();
  const authorProfiles = createFakeAuthorProfiles([
    { _id: AUTHOR, fullName: "Ada Author", profession: "writer", isProfileCompleted: true, verification: { status: "approved" } },
    { _id: READER, fullName: "Reader", verification: { status: "approved" } },
  ]);
  const engagement = createFakeEngagement();
  const mediaStore = createFakeMediaStore();
  const testimonials = createFakeTestimonials();

  return {
    publisher,
    lifebooks,
    authorProfiles,
    engagement,
    mediaStore,
    lifebookService: createLifebookService({ lifebooks, authorProfiles, engagement, mediaStore, publisher, logger, cfg: { feedPageSize: 12, maxChapters: 50, maxPublishFanout: 500 } }),
    authorProfileService: createAuthorProfileService({ authorProfiles, lifebooks, engagement, mediaStore, publisher, logger }),
    engagementService: createEngagementService({ lifebooks, authorProfiles, engagement, publisher, logger }),
    testimonialService: createTestimonialService({ testimonials, publisher, logger }),
    ready: async () => true,
  };
}

function buildRouter(deps) {
  return createRouter({ service: "story", routes, logger: createLogger(), createDeps: async () => deps });
}

function event({ method = "GET", path, body, claims, query } = {}) {
  return {
    rawPath: path,
    requestContext: {
      requestId: "req-story-1",
      http: { method, path },
      ...(claims ? { authorizer: { jwt: { claims } } } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(query ? { queryStringParameters: query } : {}),
  };
}

const authorClaims = { sub: AUTHOR, role: "author" };
const readerClaims = { sub: READER, role: "user" };

/** Documents serialise with `id`; subdocuments keep `_id` as well. */
const idOf = (payload) => payload.data.id || payload.data._id;

test("the feed is public and validates its query", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const created = await router.handler(
    event({ method: "POST", path: "/api/v1/stories", claims: authorClaims, body: { title: "Public Life" } }),
  );
  const storyId = idOf(JSON.parse(created.body));

  await router.handler(event({ method: "POST", path: `/api/v1/stories/${storyId}/publish`, claims: authorClaims, body: {} }));

  const feed = await router.handler(event({ path: "/api/v1/stories" }));
  const body = JSON.parse(feed.body);

  assert.equal(feed.statusCode, 200);
  assert.equal(body.data.items.length, 1);
  assert.equal(body.data.items[0].likedByUser, false);

  const invalid = await router.handler(event({ path: "/api/v1/stories", query: { sort: "random" } }));
  assert.equal(invalid.statusCode, 422);
});

test("author-only writes reject readers and anonymous callers", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const anonymous = await router.handler(event({ method: "POST", path: "/api/v1/stories", body: { title: "x" } }));
  const reader = await router.handler(event({ method: "POST", path: "/api/v1/stories", claims: readerClaims, body: { title: "x" } }));

  assert.equal(anonymous.statusCode, 401);
  assert.equal(reader.statusCode, 403);

  const invalidBody = await router.handler(
    event({ method: "POST", path: "/api/v1/stories", claims: authorClaims, body: { title: "" } }),
  );
  assert.equal(invalidBody.statusCode, 422);
  assert.ok(JSON.parse(invalidBody.body).error.fields.title);
});

test("chapter and entry routes are nested and ownership-checked", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const created = await router.handler(
    event({ method: "POST", path: "/api/v1/stories", claims: authorClaims, body: { title: "Nested Life" } }),
  );
  const storyId = idOf(JSON.parse(created.body));

  const chapter = await router.handler(
    event({ method: "POST", path: `/api/v1/stories/${storyId}/chapters`, claims: authorClaims, body: { title: "Career" } }),
  );
  const chapterPayload = JSON.parse(chapter.body).data.chapters[0];
  const chapterId = chapterPayload._id || chapterPayload.id;

  const entry = await router.handler(
    event({
      method: "POST",
      path: `/api/v1/stories/${storyId}/chapters/${chapterId}/stories`,
      claims: authorClaims,
      body: { title: "First job", content: "…" },
    }),
  );

  assert.equal(entry.statusCode, 201);
  assert.equal(JSON.parse(entry.body).data.chapters[0].stories.length, 1);

  const foreign = await router.handler(
    event({ method: "POST", path: `/api/v1/stories/${storyId}/chapters`, claims: readerClaims, body: {} }),
  );
  assert.equal(foreign.statusCode, 403);
});

test("engagement routes accept every signed-in role but not guests", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const created = await router.handler(
    event({ method: "POST", path: "/api/v1/stories", claims: authorClaims, body: { title: "Likeable" } }),
  );
  const storyId = idOf(JSON.parse(created.body));
  await router.handler(event({ method: "POST", path: `/api/v1/stories/${storyId}/publish`, claims: authorClaims, body: {} }));

  const guest = await router.handler(event({ method: "POST", path: `/api/v1/stories/${storyId}/like` }));
  assert.equal(guest.statusCode, 401);

  const readerLike = await router.handler(event({ method: "POST", path: `/api/v1/stories/${storyId}/like`, claims: readerClaims }));
  assert.equal(readerLike.statusCode, 200);
  assert.equal(JSON.parse(readerLike.body).data.liked, true);

  const comment = await router.handler(
    event({ method: "POST", path: `/api/v1/stories/${storyId}/comments`, claims: readerClaims, body: { content: "Nice" } }),
  );
  assert.equal(comment.statusCode, 201);

  const comments = await router.handler(event({ path: `/api/v1/stories/${storyId}/comments` }));
  assert.equal(JSON.parse(comments.body).data.items.length, 1);
});

test("media presigning is scoped to the caller's own folders", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const storyMedia = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/stories/media/presign",
      claims: authorClaims,
      body: { kind: "storyImage", contentType: "image/png", size: 2048 },
    }),
  );
  assert.equal(storyMedia.statusCode, 201);
  assert.ok(JSON.parse(storyMedia.body).data.key.startsWith("storyImage/"));

  const wrongKind = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/authors/me/media/presign",
      claims: authorClaims,
      body: { kind: "storyVideo", contentType: "video/mp4" },
    }),
  );
  assert.equal(wrongKind.statusCode, 422);

  const readerBlocked = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/authors/me/media/presign",
      claims: readerClaims,
      body: { kind: "authorAvatar", contentType: "image/jpeg" },
    }),
  );
  assert.equal(readerBlocked.statusCode, 403);
});

test("testimonial moderation is admin-only while posting is open to accounts", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const posted = await router.handler(
    event({ method: "POST", path: "/api/v1/testimonials", claims: readerClaims, body: { message: "Great", rating: 5 } }),
  );
  assert.equal(posted.statusCode, 201);

  const id = idOf(JSON.parse(posted.body));

  const readerModeration = await router.handler(
    event({ method: "PATCH", path: `/api/v1/testimonials/${id}/status`, claims: readerClaims, body: { status: "hidden" } }),
  );
  assert.equal(readerModeration.statusCode, 403);

  const adminModeration = await router.handler(
    event({
      method: "PATCH",
      path: `/api/v1/testimonials/${id}/status`,
      claims: { sub: "adm", role: "admin" },
      body: { status: "hidden" },
    }),
  );
  assert.equal(adminModeration.statusCode, 200);

  const publicList = await router.handler(event({ path: "/api/v1/testimonials" }));
  assert.equal(publicList.statusCode, 200);
});

test("following routes keep the existing shapes", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const follow = await router.handler(event({ method: "POST", path: `/api/v1/following/${AUTHOR}/follow`, claims: readerClaims }));
  assert.equal(follow.statusCode, 201);

  const check = await router.handler(event({ path: `/api/v1/following/${AUTHOR}/check`, claims: readerClaims }));
  assert.equal(JSON.parse(check.body).data.following, true);

  const followers = await router.handler(event({ path: `/api/v1/following/${AUTHOR}/followers` }));
  assert.equal(JSON.parse(followers.body).data.length, 1);

  const unfollow = await router.handler(event({ method: "DELETE", path: `/api/v1/following/${AUTHOR}/follow`, claims: readerClaims }));
  assert.equal(JSON.parse(unfollow.body).data.following, false);
});
