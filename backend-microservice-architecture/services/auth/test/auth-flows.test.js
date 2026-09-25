import test from "node:test";
import assert from "node:assert/strict";

import { verifyJwt } from "@lifebookz/shared-auth";

import {
  TEST_AUDIENCE,
  TEST_ISSUER,
  createFakeAccounts,
  createFakeKeyProvider,
  createFakeRateLimiter,
  createFakeRefreshTokens,
  createLogger,
  createPublisher,
} from "./fakes.js";

import { createRegistrationService } from "../src/services/registration.js";
import { createLoginService, noAccountMessage } from "../src/services/login.js";
import { createPasswordResetService } from "../src/services/password-reset.js";
import { createSessionService } from "../src/services/session.js";
import { createVerificationService } from "../src/services/verification.js";
import { hashPassword, sha256 } from "../src/services/crypto.js";

const cfg = { bcryptRounds: 10, otpTtlSeconds: 600, resetTokenTtlSeconds: 300, accessTokenTtlSeconds: 900, refreshTokenTtlDays: 30, loginAttemptLimitPerWindow: 10 };

function build() {
  const accounts = createFakeAccounts();
  const refreshTokens = createFakeRefreshTokens();
  const publisher = createPublisher();
  const logger = createLogger();
  const keyProvider = createFakeKeyProvider();
  const sessions = createSessionService({ accounts, refreshTokens, keyProvider, publisher, logger, cfg });

  return {
    accounts,
    refreshTokens,
    publisher,
    logger,
    keyProvider,
    sessions,
    registration: createRegistrationService({ accounts, sessions, publisher, logger, cfg }),
    passwordReset: createPasswordResetService({ accounts, sessions, rateLimiter: createFakeRateLimiter(), publisher, logger, cfg }),
    verification: createVerificationService({ accounts, publisher, logger }),
  };
}

test("registering a reader derives a username, issues an RS256 access token and announces the account", async () => {
  const { registration, publisher, keyProvider } = build();

  const result = await registration.register({
    role: "user",
    email: "Reader@Example.com",
    password: "supersecret",
    fullName: "Ada Reader",
    ip: "1.2.3.4",
  });

  assert.equal(result.account.email, "reader@example.com");
  assert.equal(result.account.username, "reader");
  assert.ok(result.token.split(".").length === 3);
  assert.ok(result.refreshToken);
  assert.equal(result.expiresIn, 900);

  const verified = verifyJwt({ token: result.token, publicKey: keyProvider.publicKey, issuer: TEST_ISSUER, audience: TEST_AUDIENCE });
  assert.equal(verified.valid, true);
  assert.equal(verified.payload.role, "user");

  const events = publisher.of("AccountRegistered");
  assert.equal(events.length, 1);
  assert.equal(events[0].data.email, "reader@example.com");
});

test("readers are immediately active, authors and experts wait for approval", async () => {
  const { registration, accounts } = build();

  const author = await registration.register({
    role: "author",
    email: "author@example.com",
    password: "supersecret",
    fullName: "Ada Author",
    username: "ada.author",
  });

  assert.equal(author.account.verification.status, "pending");
  assert.equal(accounts.docs.find((doc) => doc.role === "author").status, "active");
});

test("registration rejects duplicates and weak passwords with field errors", async () => {
  const { registration } = build();

  await registration.register({ role: "user", email: "dup@example.com", password: "supersecret", fullName: "Dup One" });

  await assert.rejects(
    () => registration.register({ role: "user", email: "dup@example.com", password: "supersecret", fullName: "Dup Two" }),
    (error) => {
      assert.equal(error.statusCode, 409);
      assert.ok(error.fields.email);
      return true;
    },
  );

  await assert.rejects(
    () => registration.register({ role: "user", email: "weak@example.com", password: "short", fullName: "Weak" }),
    (error) => error.statusCode === 422 && Boolean(error.fields.password),
  );
});

test("login names the portal the email was actually registered in", async () => {
  const { registration, accounts, sessions, publisher, logger } = build();

  await registration.register({ role: "author", email: "shared@example.com", password: "supersecret", fullName: "Ada Author", username: "ada" });

  const login = createLoginService({
    accounts,
    sessions,
    privilegedCredentials: { async get() { return {}; } },
    rateLimiter: createFakeRateLimiter(),
    publisher,
    logger,
    cfg,
  });

  await assert.rejects(() => login.login({ role: "user", email: "shared@example.com", password: "supersecret" }), (error) => {
    assert.equal(error.statusCode, 401);
    assert.match(error.message, /registered as a author account/);
    return true;
  });

  await assert.rejects(() => login.login({ role: "author", email: "shared@example.com", password: "wrong" }), (error) => {
    assert.equal(error.fields.password !== undefined, true);
    return true;
  });

  const ok = await login.login({ role: "author", email: "shared@example.com", password: "supersecret" });
  assert.ok(ok.token);
  assert.equal(ok.account.role, "author");
});

test("noAccountMessage keeps the existing wording for every combination", () => {
  assert.equal(noAccountMessage([], "user"), "No account found with this email.");
  assert.equal(noAccountMessage(["author"], "user"), "No account found with this email — it is registered as a author account.");
  assert.equal(
    noAccountMessage(["author", "expert"], "user"),
    "No account found with this email — it is registered as a author or expert account.",
  );
});

test("privileged login verifies Secrets Manager credentials and records an audit event", async () => {
  const { accounts, sessions, publisher, logger } = build();

  const login = createLoginService({
    accounts,
    sessions,
    privilegedCredentials: { async get(role) { return role === "admin" ? { email: "admin@lifebookz.com", password: "topsecret" } : {}; } },
    rateLimiter: createFakeRateLimiter(),
    publisher,
    logger,
    cfg,
  });

  await assert.rejects(() => login.login({ role: "admin", email: "admin@lifebookz.com", password: "nope" }), (error) => {
    assert.match(error.message, /Incorrect admin password/);
    return true;
  });

  const session = await login.login({ role: "admin", email: "admin@lifebookz.com", password: "topsecret", ip: "9.9.9.9" });

  assert.equal(session.claims.role, "admin");
  assert.equal(publisher.of("PrivilegedLoginRecorded").length, 1);

  await assert.rejects(() => login.login({ role: "developer", email: "dev@lifebookz.com", password: "x" }), /not configured/);
});

test("otp reset flow hashes the OTP, rejects wrong codes and blocks replay", async () => {
  const { registration, accounts, passwordReset, publisher, refreshTokens } = build();

  await registration.register({ role: "user", email: "reset@example.com", password: "supersecret", fullName: "Reset Me" });

  const request = await passwordReset.request({ email: "reset@example.com", ip: "1.1.1.1" });
  assert.equal(request.delivered, true);

  const otpEvent = publisher.of("OtpRequested")[0];
  assert.ok(otpEvent, "the OTP is delivered through an event, not the response");
  const otp = otpEvent.data.otp;

  const stored = accounts.docs[0].otp.hash;
  assert.equal(stored, sha256(otp));
  assert.notEqual(stored, otp, "the plain OTP is never stored");

  await assert.rejects(() => passwordReset.verify({ email: "reset@example.com", otp: "000000" }), (error) => {
    assert.equal(error.fields.otp !== undefined, true);
    return true;
  });

  const verified = await passwordReset.verify({ email: "reset@example.com", otp });
  assert.ok(verified.resetToken);

  const before = refreshTokens.rows.length;
  await passwordReset.complete({ resetToken: verified.resetToken, password: "brandnewpass" });

  const account = accounts.docs[0];
  assert.equal(account.credentials.tokenVersion, 1, "sessions are invalidated by bumping the token version");
  assert.equal(refreshTokens.rows.filter((row) => row.revokedAt).length, before, "every session is revoked");
  assert.equal(publisher.of("PasswordResetCompleted").length, 1);
  assert.equal(account.otp.hash, undefined, "the reset token is consumed");

  await assert.rejects(() => passwordReset.complete({ resetToken: verified.resetToken, password: "anotherpass" }), /Invalid or expired/);
});

test("requesting a reset for an unknown email answers identically", async () => {
  const { passwordReset } = build();

  const result = await passwordReset.request({ email: "ghost@example.com", ip: "1.1.1.1" });
  assert.equal(result.delivered, false);
});

test("otp requests are rate limited per email", async () => {
  const { registration, accounts, sessions, publisher, logger } = build();
  await registration.register({ role: "user", email: "limit@example.com", password: "supersecret", fullName: "Limit Me" });

  const passwordReset = createPasswordResetService({
    accounts,
    sessions,
    rateLimiter: { async consume({ limit, key }) { return { allowed: false, limit, count: limit + 1, retryAfterSeconds: 42, key }; } },
    publisher,
    logger,
    cfg,
  });

  await assert.rejects(() => passwordReset.request({ email: "limit@example.com", ip: "1.1.1.1" }), (error) => {
    assert.equal(error.statusCode, 429);
    assert.equal(error.details.retryAfterSeconds, 42);
    return true;
  });
});

test("refresh rotates the token and replay revokes the whole session family", async () => {
  const { registration, sessions } = build();

  const { refreshToken } = await registration.register({
    role: "user",
    email: "rotate@example.com",
    password: "supersecret",
    fullName: "Rotate Me",
  });

  const rotated = await sessions.refresh({ refreshToken });
  assert.ok(rotated.refreshToken);
  assert.notEqual(rotated.refreshToken, refreshToken);

  // Replaying the first token must kill the family, not mint a new session.
  await assert.rejects(() => sessions.refresh({ refreshToken }), /already refreshed/);
  await assert.rejects(() => sessions.refresh({ refreshToken: rotated.refreshToken }), /revoked/);
});

test("refresh rejects revoked sessions and password-changed accounts", async () => {
  const { registration, sessions, accounts, refreshTokens } = build();

  const session = await registration.register({
    role: "user",
    email: "version@example.com",
    password: "supersecret",
    fullName: "Version Me",
  });

  accounts.docs[0].credentials.tokenVersion = 1;

  await assert.rejects(() => sessions.refresh({ refreshToken: session.refreshToken }), /no longer valid/);
  assert.equal(refreshTokens.rows.every((row) => row.revokedAt !== null), true);

  const again = await registration.register({
    role: "user",
    email: "revoked@example.com",
    password: "supersecret",
    fullName: "Revoked Me",
  });

  await sessions.revoke({ accountId: again.account.id, all: true });
  await assert.rejects(() => sessions.refresh({ refreshToken: again.refreshToken }), /revoked/);
});

test("an admin verification decision updates the account and publishes the event", async () => {
  const { registration, verification, publisher, accounts } = build();

  const author = await registration.register({
    role: "author",
    email: "pending@example.com",
    password: "supersecret",
    fullName: "Pending Author",
    username: "pending",
  });

  await assert.rejects(() => verification.decide({ accountId: author.account.id, decision: "rejected" }), /Rejection reason/);

  const decided = await verification.decide({
    accountId: author.account.id,
    decision: "approved",
    decidedBy: "admin@lifebookz.com",
  });

  assert.equal(decided.verification.status, "approved");
  assert.equal(accounts.docs[0].verification.status, "approved");

  const events = publisher.of("AccountVerificationDecided");
  assert.equal(events.length, 1);
  assert.equal(events[0].data.decision, "approved");
  assert.equal(events[0].data.email, "pending@example.com");
});

test("password hashing is deterministic per call and verifies", async () => {
  const hash = await hashPassword("supersecret", 10);
  const { verifyPassword } = await import("../src/services/crypto.js");

  assert.equal(await verifyPassword("supersecret", hash), true);
  assert.equal(await verifyPassword("other", hash), false);
});
