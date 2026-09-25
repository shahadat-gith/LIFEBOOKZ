import test from "node:test";
import assert from "node:assert/strict";

import { MEDIA_KINDS, assertUploadAllowed, createMediaStore } from "../src/r2.js";
import { createInMemoryRateLimiter, createRateLimiter } from "../src/rate-limit.js";

function buildStore({ presign } = {}) {
  return createMediaStore({
    endpoint: "https://example.r2.cloudflarestorage.com",
    accessKeyId: "key",
    secretAccessKey: "secret",
    bucket: "lifebookz",
    publicBaseUrl: "https://pub-example.r2.dev",
    presign: presign || (async () => "https://presigned.example/put"),
    client: { send: async () => ({}) },
  });
}

test("presigned uploads build a role-scoped key and a public URL", async () => {
  const store = buildStore();
  const upload = await store.presignUpload({
    kind: "authorCover",
    contentType: "image/jpeg",
    size: 1024,
    filename: "cover.JPG",
    accountId: "acc-1",
  });

  assert.ok(upload.key.startsWith("authors/covers/acc-1-"));
  assert.ok(upload.key.endsWith(".jpg"));
  assert.equal(upload.url, `https://pub-example.r2.dev/${upload.key}`);
  assert.equal(upload.expiresIn, 600);
  assert.equal(upload.uploadUrl, "https://presigned.example/put");
});

test("every media kind maps to its own folder", () => {
  assert.equal(MEDIA_KINDS.storyVideo, "stories/media/videos");
  assert.equal(MEDIA_KINDS.expertAvatar, "experts/avatars");
  assert.equal(MEDIA_KINDS.userCoverMobile, "users/covers-mobile");
});

test("upload validation rejects unknown kinds, foreign types and oversized files", () => {
  assert.throws(() => assertUploadAllowed({ kind: "nope", contentType: "image/jpeg", size: 1 }), /Unsupported media kind/);
  assert.throws(
    () => assertUploadAllowed({ kind: "storyImage", contentType: "application/zip", size: 1 }),
    /Unsupported media type/,
  );
  assert.throws(
    () => assertUploadAllowed({ kind: "storyImage", contentType: "image/png", size: 16 * 1024 * 1024 }),
    /15 MB or smaller/,
  );
  assert.throws(
    () => assertUploadAllowed({ kind: "storyVideo", contentType: "video/mp4", size: 501 * 1024 * 1024 }),
    /500 MB or smaller/,
  );
  assert.doesNotThrow(() => assertUploadAllowed({ kind: "storyVideo", contentType: "video/mp4", size: 400 * 1024 * 1024 }));
});

test("object keys can be recovered from a stored public URL", () => {
  const store = buildStore();

  assert.equal(store.objectKeyFromUrl("https://pub-example.r2.dev/authors/covers/x.jpg"), "authors/covers/x.jpg");
  assert.equal(store.objectKeyFromUrl("authors/covers/x.jpg"), "authors/covers/x.jpg");
  assert.equal(store.objectKeyFromUrl("https://other.example/nothing"), null);
});

test("deleting media never throws when storage fails", async () => {
  const store = createMediaStore({
    bucket: "lifebookz",
    publicBaseUrl: "https://pub-example.r2.dev",
    client: {
      send: async () => {
        throw new Error("AccessDenied");
      },
    },
  });

  const warnings = [];
  const deleted = await store.deleteMedia({ key: "authors/covers/x.jpg", logger: { warn: (m, meta) => warnings.push(meta) } });

  assert.equal(deleted, false);
  assert.equal(warnings.length, 1);
});

test("the DynamoDB limiter allows up to the limit and then reports a retry window", async () => {
  const scripted = [
    { Attributes: { count: { N: "1" }, ttl: { N: "1000" } } },
    { Attributes: { count: { N: "3" }, ttl: { N: "1900" } } },
    { Attributes: { count: { N: "4" }, ttl: { N: "1900" } } },
  ];
  const client = { send: async () => scripted.shift() };
  const limiter = createRateLimiter({ table: "lifebookz-auth-otp-limits", client, service: "auth" });

  const first = await limiter.consume({ key: "otp:email:a@b.com", limit: 3, windowSeconds: 900, now: 1000 * 1000 });
  const third = await limiter.consume({ key: "otp:email:a@b.com", limit: 3, windowSeconds: 900, now: 1000 * 1000 });
  const fourth = await limiter.consume({ key: "otp:email:a@b.com", limit: 3, windowSeconds: 900, now: 1000 * 1000 });

  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 2);
  assert.equal(third.allowed, true);
  assert.equal(fourth.allowed, false);
  assert.ok(fourth.retryAfterSeconds > 0);
});

test("the limiter requires a table so a misconfigured deploy fails fast", () => {
  assert.throws(() => createRateLimiter({}), /DynamoDB table/);
});

test("the in-memory limiter mirrors the DynamoDB behaviour within its window", async () => {
  let clock = 0;
  const limiter = createInMemoryRateLimiter({ now: () => clock });

  assert.equal((await limiter.consume({ key: "k", limit: 2, windowSeconds: 60 })).allowed, true);
  assert.equal((await limiter.consume({ key: "k", limit: 2, windowSeconds: 60 })).allowed, true);
  const blocked = await limiter.consume({ key: "k", limit: 2, windowSeconds: 60 });
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);

  clock += 61_000;
  assert.equal((await limiter.consume({ key: "k", limit: 2, windowSeconds: 60 })).allowed, true);
});
