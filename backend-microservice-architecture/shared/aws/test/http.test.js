import test from "node:test";
import assert from "node:assert/strict";

import { createRouter, matchPath, parseJsonBody } from "../src/http.js";

function event({ method = "GET", path = "/api/v1/stories", body, claims, query } = {}) {
  return {
    rawPath: path,
    requestContext: {
      requestId: "req-1",
      http: { method, path },
      ...(claims ? { authorizer: { jwt: { claims } } } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(query ? { queryStringParameters: query } : {}),
  };
}

const claims = { sub: "acc-1", role: "author", email: "a@lifebookz.com", username: "ada" };

function quietLogger() {
  return { debug() {}, info() {}, warn() {}, error() {}, failure() {}, child() { return this; } };
}

function buildRouter(overrides = {}) {
  return createRouter({
    service: "story",
    logger: quietLogger(),
    routes: [
      {
        method: "GET",
        path: "/api/v1/stories",
        access: "public",
        operation: "listStories",
        handler: async (ctx) => ({ data: [{ id: "s-1" }], ok: Boolean(ctx.query.page) }),
      },
      {
        method: "POST",
        path: "/api/v1/stories",
        access: ["author"],
        operation: "createStory",
        handler: async (ctx) => ({ status: 201, data: { id: "s-2", title: ctx.body.title }, actor: ctx.actor }),
      },
      {
        method: "GET",
        path: "/api/v1/stories/{storyId}",
        access: "public",
        handler: async (ctx) => ({ data: { id: ctx.params.storyId } }),
      },
      {
        method: "GET",
        path: "/api/v1/me",
        access: "authenticated",
        handler: async (ctx) => ({ data: { accountId: ctx.claims.accountId } }),
      },
    ],
    createDeps: async () => ({ db: "fake" }),
    ...overrides,
  });
}

test("matchPath extracts params and rejects different shapes", () => {
  assert.deepEqual(matchPath("/api/v1/stories/{id}", "/api/v1/stories/abc"), { id: "abc" });
  assert.equal(matchPath("/api/v1/stories/{id}", "/api/v1/stories"), null);
  assert.equal(matchPath("/api/v1/stories", "/api/v1/author"), null);
});

test("a public route returns the success envelope", async () => {
  const response = await buildRouter().handler(event({ query: { page: "2" } }));
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(body, { success: true, data: [{ id: "s-1" }] });
});

test("handler results may set a status, a message and extra data", async () => {
  const response = await buildRouter().handler(
    event({ method: "POST", body: { title: "My lifebook" }, claims }),
  );
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 201);
  assert.equal(body.data.title, "My lifebook");
});

test("path parameters are available to the handler", async () => {
  const response = await buildRouter().handler(event({ path: "/api/v1/stories/s-42" }));
  assert.equal(JSON.parse(response.body).data.id, "s-42");
});

test("unknown routes and wrong methods answer 404/405 without touching the handler", async () => {
  const notFound = await buildRouter().handler(event({ path: "/api/v1/nope" }));
  const wrongMethod = await buildRouter().handler(event({ method: "DELETE", path: "/api/v1/stories" }));

  assert.equal(notFound.statusCode, 404);
  assert.equal(JSON.parse(notFound.body).error.code, "NOT_FOUND");
  assert.equal(wrongMethod.statusCode, 405);
  assert.equal(JSON.parse(wrongMethod.body).error.code, "METHOD_NOT_ALLOWED");
});

test("an authenticated route without claims is rejected defensively (401)", async () => {
  const response = await buildRouter().handler(event({ path: "/api/v1/me" }));

  assert.equal(response.statusCode, 401);
  assert.equal(JSON.parse(response.body).error.code, "AUTHENTICATION_ERROR");
});

test("a role-gated route rejects the wrong role with 403 and allows the right one", async () => {
  const denied = await buildRouter().handler(
    event({ method: "POST", body: { title: "x" }, claims: { sub: "u-1", role: "user" } }),
  );
  const allowed = await buildRouter().handler(event({ method: "POST", body: { title: "x" }, claims }));

  assert.equal(denied.statusCode, 403);
  assert.equal(JSON.parse(denied.body).error.code, "AUTHORIZATION_ERROR");
  assert.equal(allowed.statusCode, 201);
});

test("authenticated routes expose claims and actor to the handler", async () => {
  const response = await buildRouter().handler(event({ path: "/api/v1/me", claims }));
  assert.equal(JSON.parse(response.body).data.accountId, "acc-1");
});

test("thrown app errors become the documented error envelope and never leak internals", async () => {
  const { validationError } = await import("@lifebookz/shared-errors");

  const router = buildRouter({
    routes: [
      {
        method: "POST",
        path: "/api/v1/boom",
        access: "public",
        handler: async () => {
          throw validationError("Validation failed. Check the fields for details.", {
            fields: { title: "title is required." },
          });
        },
      },
      {
        method: "POST",
        path: "/api/v1/crash",
        access: "public",
        handler: async () => {
          throw new Error("mongodb://user:pass@cluster — internal detail");
        },
      },
    ],
  });

  const validation = await router.handler(event({ method: "POST", path: "/api/v1/boom" }));
  assert.equal(validation.statusCode, 422);
  assert.deepEqual(JSON.parse(validation.body).error.fields, { title: "title is required." });

  const crash = await router.handler(event({ method: "POST", path: "/api/v1/crash" }));
  assert.equal(crash.statusCode, 500);
  assert.equal(JSON.parse(crash.body).error.message, "An unexpected error occurred.");
  assert.equal(crash.body.includes("cluster"), false);
});

test("failures are published as RequestFailed events for the developer log store", async () => {
  const published = [];
  const router = buildRouter({
    failurePublisher: { publishSafely: async (input) => published.push(input) },
    routes: [
      {
        method: "GET",
        path: "/api/v1/oops",
        access: "public",
        operation: "oops",
        handler: async () => {
          throw new Error("kaput");
        },
      },
    ],
  });

  await router.handler(event({ path: "/api/v1/oops" }));

  assert.equal(published.length, 1);
  assert.equal(published[0].type, "RequestFailed");
  assert.equal(published[0].data.statusCode, 500);
  assert.equal(published[0].data.route, "/api/v1/oops");
  assert.ok(published[0].data.stack);
});

test("publishing a failure event can never break the response", async () => {
  const router = buildRouter({
    failurePublisher: {
      publishSafely: async () => {
        throw new Error("eventbridge down");
      },
    },
    routes: [
      {
        method: "GET",
        path: "/api/v1/agg",
        access: "public",
        handler: async () => {
          throw new Error("kaput");
        },
      },
    ],
  });

  const response = await router.handler(event({ path: "/api/v1/agg" }));
  assert.equal(response.statusCode, 500);
});

test("parseJsonBody enforces JSON and the size limit", () => {
  assert.deepEqual(parseJsonBody(event({ body: { a: 1 } })), { a: 1 });
  assert.deepEqual(parseJsonBody(event()), {});

  assert.throws(() => parseJsonBody({ body: "{oops" }), /valid JSON/);
  assert.throws(() => parseJsonBody({ body: JSON.stringify([1, 2]) }), /JSON object/);
  assert.throws(
    () => parseJsonBody({ body: JSON.stringify({ big: "x".repeat(200) }) }, { maxBytes: 10 }),
    /KB or smaller/,
  );
});

test("the router applies an optional service level authorization hook", async () => {
  const router = buildRouter({ authorize: async (ctx) => ctx.claims?.role === "admin" });

  const denied = await router.handler(event({ path: "/api/v1/me", claims }));
  const allowed = await router.handler(event({ path: "/api/v1/me", claims: { sub: "adm", role: "admin" } }));

  assert.equal(denied.statusCode, 403);
  assert.equal(allowed.statusCode, 200);
});
