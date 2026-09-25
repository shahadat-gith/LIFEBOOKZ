import test from "node:test";
import assert from "node:assert/strict";

import { createRouter } from "@lifebookz/shared-aws";

import { createFakeBookings, createFakeExpertProfiles, createFakeMediaStore, createLogger, createPublisher } from "./fakes.js";

import routes from "../src/routes.js";
import { createBookingService } from "../src/services/bookings.js";
import { createExpertProfileService } from "../src/services/expert-profile.js";
import { createMatchingService } from "../src/services/matching.js";

const EXPERT = "65f1c0a2b3d4e5f6a7b8c9d0";
const READER = "65f1c0a2b3d4e5f6a7b8c9d2";

function createDeps() {
  const logger = createLogger();
  const publisher = createPublisher();
  const expertProfiles = createFakeExpertProfiles([
    {
      _id: EXPERT,
      fullName: "Expert One",
      username: "expertone",
      email: "expert@lifebookz.com",
      accountStatus: "active",
      verification: { status: "approved" },
      categories: ["career"],
      expertise: "Career coaching",
      qualification: "MBA",
      bio: "Ten years.",
      price: 500,
      rating: 4,
      sessions: 3,
      isProfileCompleted: true,
    },
  ]);
  const bookings = createFakeBookings({ expertProfiles });

  return {
    publisher,
    expertProfiles,
    bookings,
    matchingService: createMatchingService({ expertProfiles, logger }),
    expertProfileService: createExpertProfileService({ expertProfiles, bookings, mediaStore: createFakeMediaStore(), publisher, logger }),
    bookingService: createBookingService({ bookings, expertProfiles, publisher, logger }),
    ready: async () => true,
  };
}

function buildRouter(deps) {
  return createRouter({ service: "consultation", routes, logger: createLogger(), createDeps: async () => deps });
}

function event({ method = "GET", path, body, claims } = {}) {
  return {
    rawPath: path,
    requestContext: {
      requestId: "req-consult-1",
      http: { method, path, sourceIp: "203.0.113.7" },
      ...(claims ? { authorizer: { jwt: { claims } } } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
}

const readerClaims = { sub: READER, role: "user", email: "reader@lifebookz.com", username: "reader", name: "Priya Reader" };
const expertClaims = { sub: EXPERT, role: "expert", email: "expert@lifebookz.com", name: "Expert One" };

test("anonymous callers cannot reach the consult or expert routes", async () => {
  const router = buildRouter(createDeps());

  for (const [method, path] of [
    ["POST", "/api/v1/consult/match"],
    ["POST", "/api/v1/consult/bookings"],
    ["GET", "/api/v1/consult/bookings"],
    ["GET", "/api/v1/experts/me"],
    ["GET", "/api/v1/experts/me/bookings"],
  ]) {
    const response = await router.handler(event({ method, path }));

    assert.equal(response.statusCode, 401, `${method} ${path} must require a token`);
    assert.equal(JSON.parse(response.body).error.code, "AUTHENTICATION_ERROR");
  }
});

test("an expert token cannot use the reader consult flow, and a reader token cannot use the expert flow", async () => {
  const router = buildRouter(createDeps());

  const asExpert = await router.handler(
    event({ method: "GET", path: "/api/v1/consult/bookings", claims: expertClaims }),
  );
  assert.equal(asExpert.statusCode, 403);
  assert.equal(JSON.parse(asExpert.body).error.code, "AUTHORIZATION_ERROR");

  const asReader = await router.handler(event({ method: "GET", path: "/api/v1/experts/me/bookings", claims: readerClaims }));
  assert.equal(asReader.statusCode, 403);
});

test("the consult flow works end to end over HTTP: match, book, cancel, rule", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const matched = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/consult/match",
      claims: readerClaims,
      body: { problem: "I want to move into product design.", category: "career" },
    }),
  );
  assert.equal(matched.statusCode, 200);
  assert.equal(JSON.parse(matched.body).data.experts[0].id, EXPERT);

  const created = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/consult/bookings",
      claims: readerClaims,
      body: { expertId: EXPERT, problem: "I want to move into product design.", sessionType: "video" },
    }),
  );
  assert.equal(created.statusCode, 201);
  const booking = JSON.parse(created.body).data;
  assert.equal(booking.status, "pending");

  const mine = await router.handler(event({ path: "/api/v1/consult/bookings", claims: readerClaims }));
  assert.equal(JSON.parse(mine.body).data.length, 1);

  const expertList = await router.handler(event({ path: "/api/v1/experts/me/bookings", claims: expertClaims }));
  assert.equal(JSON.parse(expertList.body).data.length, 1);

  const ruled = await router.handler(
    event({ method: "PATCH", path: `/api/v1/experts/me/bookings/${booking.id}`, claims: expertClaims, body: { status: "confirmed" } }),
  );
  assert.equal(ruled.statusCode, 200);
  assert.equal(JSON.parse(ruled.body).data.status, "confirmed");
  assert.equal(deps.expertProfiles.profiles.get(EXPERT).sessions, 3);

  const cancelled = await router.handler(
    event({ method: "PATCH", path: `/api/v1/consult/bookings/${booking.id}/cancel`, claims: readerClaims }),
  );

  // The expert confirmed it, so the reader may still cancel it.
  assert.equal(cancelled.statusCode, 200);
  assert.equal(JSON.parse(cancelled.body).data.status, "cancelled");
});

test("a booking for an unavailable expert is a 404 and a malformed body a 422", async () => {
  const router = buildRouter(createDeps());

  const missing = await router.handler(
    event({ method: "POST", path: "/api/v1/consult/bookings", claims: readerClaims, body: { expertId: "unknown", problem: "A long enough problem statement." } }),
  );
  assert.equal(missing.statusCode, 404);

  const invalid = await router.handler(
    event({ method: "POST", path: "/api/v1/consult/bookings", claims: readerClaims, body: { expertId: EXPERT, problem: "short" } }),
  );
  assert.equal(invalid.statusCode, 422);
  assert.equal(JSON.parse(invalid.body).error.code, "VALIDATION_ERROR");
});

test("the public expert profile is open and a pending expert is a 404", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const found = await router.handler(event({ path: `/api/v1/experts/${EXPERT}` }));
  assert.equal(found.statusCode, 200);
  assert.equal(JSON.parse(found.body).data.role, "expert");

  await deps.expertProfiles.syncVerification({ accountId: EXPERT, status: "pending" });

  const hidden = await router.handler(event({ path: `/api/v1/experts/${EXPERT}` }));
  assert.equal(hidden.statusCode, 404);
});

test("expert media presign is restricted to the expert media kinds", async () => {
  const router = buildRouter(createDeps());

  const allowed = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/experts/me/media/presign",
      claims: expertClaims,
      body: { kind: "expertCover", contentType: "image/jpeg", size: 200_000 },
    }),
  );
  assert.equal(allowed.statusCode, 201);
  assert.match(JSON.parse(allowed.body).data.key, /^expertCover\//);

  const rejected = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/experts/me/media/presign",
      claims: expertClaims,
      body: { kind: "storyImage", contentType: "image/jpeg", size: 200_000 },
    }),
  );
  assert.equal(rejected.statusCode, 422);
});

test("an unknown route is a 404 and an unsupported method on a known route is a 405", async () => {
  const router = buildRouter(createDeps());

  const notFound = await router.handler(event({ method: "GET", path: "/api/v1/consult/nope" }));
  assert.equal(notFound.statusCode, 404);

  const notAllowed = await router.handler(event({ method: "PUT", path: "/api/v1/consult/match", claims: readerClaims }));
  assert.equal(notAllowed.statusCode, 405);
});
