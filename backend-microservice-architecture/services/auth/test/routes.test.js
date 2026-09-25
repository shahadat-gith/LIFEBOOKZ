import test from "node:test";
import assert from "node:assert/strict";

import { createRouter } from "@lifebookz/shared-aws";

import {
  createFakeAccounts,
  createFakeKeyProvider,
  createFakeMediaStore,
  createFakeRateLimiter,
  createFakeRefreshTokens,
  createLogger,
  createPublisher,
} from "./fakes.js";

import routes from "../src/routes.js";
import { createLoginService } from "../src/services/login.js";
import { createPasswordResetService } from "../src/services/password-reset.js";
import { createProfileService } from "../src/services/profile.js";
import { createRegistrationService } from "../src/services/registration.js";
import { createSessionService } from "../src/services/session.js";
import { createVerificationService } from "../src/services/verification.js";

const cfg = { bcryptRounds: 10, otpTtlSeconds: 600, resetTokenTtlSeconds: 300, accessTokenTtlSeconds: 900, refreshTokenTtlDays: 30, loginAttemptLimitPerWindow: 10 };
const SERVICE_TOKEN = "local-dev-service-token";

function createDeps() {
  const accounts = createFakeAccounts();
  const refreshTokens = createFakeRefreshTokens();
  const publisher = createPublisher();
  const logger = createLogger();
  const keyProvider = createFakeKeyProvider();
  const rateLimiter = createFakeRateLimiter();
  const mediaStore = createFakeMediaStore();
  const sessions = createSessionService({ accounts, refreshTokens, keyProvider, publisher, logger, cfg });

  return {
    config: cfg,
    accounts,
    refreshTokens,
    publisher,
    logger,
    keyProvider,
    sessions,
    rateLimiter,
    mediaStore,
    registration: createRegistrationService({ accounts, sessions, publisher, logger, cfg }),
    login: createLoginService({
      accounts,
      sessions,
      privilegedCredentials: { async get(role) { return role === "admin" ? { email: "admin@lifebookz.com", password: "topsecret" } : {}; } },
      rateLimiter,
      publisher,
      logger,
      cfg,
    }),
    passwordReset: createPasswordResetService({ accounts, sessions, rateLimiter, publisher, logger, cfg }),
    profile: createProfileService({ accounts, sessions, mediaStore, publisher, logger }),
    verification: createVerificationService({ accounts, publisher, logger }),
    ready: async () => true,
    getServiceToken: async () => SERVICE_TOKEN,
  };
}

function buildRouter(deps) {
  return createRouter({
    service: "auth",
    routes,
    logger: createLogger(),
    createDeps: async () => deps,
  });
}

function event({ method = "GET", path, body, claims, headers = {} } = {}) {
  return {
    rawPath: path,
    requestContext: {
      requestId: "req-auth-1",
      http: { method, path, sourceIp: "10.0.0.1" },
      ...(claims ? { authorizer: { jwt: { claims } } } : {}),
    },
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
}

test("the discovery document and JWKS are public (API Gateway reads them)", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const discovery = await router.handler(event({ path: "/.well-known/openid-configuration" }));
  const jwks = await router.handler(event({ path: "/.well-known/jwks.json" }));

  const document = JSON.parse(discovery.body).data;
  assert.equal(discovery.statusCode, 200);
  assert.equal(document.issuer, process.env.JWT_ISSUER);
  assert.match(document.jwks_uri, /\.well-known\/jwks\.json$/);
  assert.equal(JSON.parse(jwks.body).data.keys[0].kty, "RSA");
});

test("register validates the body and returns the session for a valid one", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const invalid = await router.handler(
    event({ method: "POST", path: "/api/v1/auth/register", body: { role: "wizard", email: "bad", password: "x" } }),
  );

  assert.equal(invalid.statusCode, 422);
  const fields = JSON.parse(invalid.body).error.fields;
  assert.ok(fields.role);
  assert.ok(fields.email);
  assert.ok(fields.password);

  const created = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { role: "author", email: "route@example.com", password: "supersecret", fullName: "Route Author", username: "route.author" },
    }),
  );

  const payload = JSON.parse(created.body);
  assert.equal(created.statusCode, 201);
  assert.ok(payload.data.token);
  assert.ok(payload.data.refreshToken);
  assert.equal(payload.data.account.role, "author");
});

test("login honours the role and reports the specific failure", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  await router.handler(
    event({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { role: "user", email: "login@example.com", password: "supersecret", fullName: "Login Me" },
    }),
  );

  const wrongPortal = await router.handler(
    event({ method: "POST", path: "/api/v1/auth/login", body: { role: "expert", email: "login@example.com", password: "supersecret" } }),
  );

  assert.equal(wrongPortal.statusCode, 401);
  assert.match(JSON.parse(wrongPortal.body).error.message, /registered as a reader account/);

  const admin = await router.handler(
    event({ method: "POST", path: "/api/v1/auth/login", body: { role: "admin", email: "admin@lifebookz.com", password: "topsecret" } }),
  );

  assert.equal(admin.statusCode, 200);
  assert.equal(JSON.parse(admin.body).data.account.role, "admin");
});

test("protected routes require claims and the right role", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const anonymous = await router.handler(event({ path: "/api/v1/users/me" }));
  assert.equal(anonymous.statusCode, 401);

  const wrongRole = await router.handler(
    event({ path: "/api/v1/users/me", claims: { sub: "acc-1", role: "author" } }),
  );
  assert.equal(wrongRole.statusCode, 403);

  const created = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { role: "user", email: "me@example.com", password: "supersecret", fullName: "Me Reader" },
    }),
  );

  const { account } = JSON.parse(created.body).data;

  const allowed = await router.handler(
    event({ path: "/api/v1/users/me", claims: { sub: account.id, role: "user" } }),
  );
  assert.equal(allowed.statusCode, 200);
  assert.equal(JSON.parse(allowed.body).data.email, "me@example.com");
});

test("a reader can presign only reader media", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const claims = { sub: "acc-1", role: "user" };

  const ok = await router.handler(
    event({ method: "POST", path: "/api/v1/users/me/media/presign", claims, body: { kind: "userAvatar", contentType: "image/jpeg", size: 1024 } }),
  );
  assert.equal(ok.statusCode, 201);

  const rejected = await router.handler(
    event({ method: "POST", path: "/api/v1/users/me/media/presign", claims, body: { kind: "storyVideo", contentType: "video/mp4", size: 1024 } }),
  );
  assert.equal(rejected.statusCode, 422);
});

test("the public reader profile is readable and 404s for an unknown id", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  await router.handler(
    event({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { role: "user", email: "public@example.com", password: "supersecret", fullName: "Public Reader" },
    }),
  );

  const found = await router.handler(event({ path: `/api/v1/users/${deps.accounts.docs[0]._id}` }));
  assert.equal(found.statusCode, 200);
  assert.equal(JSON.parse(found.body).data.role, "user");

  const missing = await router.handler(event({ path: "/api/v1/users/does-not-exist" }));
  assert.equal(missing.statusCode, 404);
});

test("the internal verification route is closed without the service token", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const created = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { role: "expert", email: "expert@example.com", password: "supersecret", fullName: "Exp Expert", username: "exp.expert" },
    }),
  );

  const accountId = JSON.parse(created.body).data.account.id;

  const unauthenticated = await router.handler(
    event({ method: "PATCH", path: `/api/v1/internal/accounts/${accountId}/verification`, body: { decision: "approved" } }),
  );

  assert.equal(unauthenticated.statusCode, 401);

  const wrongToken = await router.handler(
    event({
      method: "PATCH",
      path: `/api/v1/internal/accounts/${accountId}/verification`,
      body: { decision: "approved" },
      headers: { "x-lifebookz-service-token": "not-the-token" },
    }),
  );

  assert.equal(wrongToken.statusCode, 401);

  const authorized = await router.handler(
    event({
      method: "PATCH",
      path: `/api/v1/internal/accounts/${accountId}/verification`,
      body: { decision: "rejected", reason: "Documents missing" },
      headers: { "x-lifebookz-service-token": SERVICE_TOKEN },
    }),
  );

  assert.equal(authorized.statusCode, 200);
  assert.equal(JSON.parse(authorized.body).data.verification.status, "rejected");
});

test("refresh and logout work through the router", async () => {
  const deps = createDeps();
  const router = buildRouter(deps);

  const created = await router.handler(
    event({
      method: "POST",
      path: "/api/v1/auth/register",
      body: { role: "user", email: "session@example.com", password: "supersecret", fullName: "Session Me" },
    }),
  );

  const { refreshToken, account } = JSON.parse(created.body).data;

  const refreshed = await router.handler(event({ method: "POST", path: "/api/v1/auth/refresh", body: { refreshToken } }));
  assert.equal(refreshed.statusCode, 200);
  assert.ok(JSON.parse(refreshed.body).data.token);

  const loggedOut = await router.handler(
    event({ method: "POST", path: "/api/v1/auth/logout", claims: { sub: account.id, role: "user" }, body: {} }),
  );

  assert.equal(loggedOut.statusCode, 200);
  // Default logout ends every session of the caller (the rotated one included).
  assert.equal(JSON.parse(loggedOut.body).data.revoked, 2);
  await assert.rejects(() => deps.sessions.refresh({ refreshToken }), /revoked|already refreshed/);
});
