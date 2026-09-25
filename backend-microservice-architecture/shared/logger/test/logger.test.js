import test from "node:test";
import assert from "node:assert/strict";

import { createLogger, redact, REDACTED } from "../index.js";

function captureSink() {
  const lines = [];

  return {
    lines,
    sink: {
      log: (line) => lines.push(JSON.parse(line)),
      warn: (line) => lines.push(JSON.parse(line)),
      error: (line) => lines.push(JSON.parse(line)),
    },
  };
}

test("logger emits one parseable JSON line per call with service/function metadata", () => {
  const { lines, sink } = captureSink();
  const logger = createLogger({ service: "story", functionName: "lifebookz-story-dev-api", sink });

  logger.info("Story published", { operation: "publishStory", status: 200, duration: 42 });

  assert.equal(lines.length, 1);
  assert.equal(lines[0].level, "info");
  assert.equal(lines[0].service, "story");
  assert.equal(lines[0].function, "lifebookz-story-dev-api");
  assert.equal(lines[0].operation, "publishStory");
  assert.equal(lines[0].duration, 42);
  assert.ok(lines[0].time);
});

test("logger never emits OTP values, passwords, tokens or credentials", () => {
  const { lines, sink } = captureSink();
  const logger = createLogger({ service: "auth", sink });

  logger.info("OTP issued", {
    email: "reader@example.com",
    otp: "123456",
    password: "hunter2",
    passwordHash: "$2a$12$abcdef",
    authorization: "Bearer abc.def.ghi",
    nested: { refreshToken: "raw-token", privateKey: "-----BEGIN RSA PRIVATE KEY-----" },
  });

  const line = JSON.stringify(lines[0]);

  assert.equal(line.includes("123456"), false);
  assert.equal(line.includes("hunter2"), false);
  assert.equal(line.includes("abcdef"), false);
  assert.equal(line.includes("raw-token"), false);
  assert.equal(line.includes("PRIVATE KEY"), false);
  assert.equal(lines[0].otp, REDACTED);
  assert.equal(lines[0].nested.refreshToken, REDACTED);
  assert.equal(lines[0].email, "reader@example.com");
});

test("logger masks JWT-looking strings even when the key is harmless", () => {
  const { lines, sink } = captureSink();
  const logger = createLogger({ service: "auth", sink });

  logger.warn("token rejected", {
    note: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijklmnop",
  });

  assert.equal(JSON.stringify(lines[0]).includes("eyJhbGciOiJSUzI1NiJ9"), false);
});

test("logger honours the level threshold", () => {
  const { lines, sink } = captureSink();
  const logger = createLogger({ service: "story", sink, level: "warn" });

  logger.debug("nope");
  logger.info("nope");
  logger.warn("yes");

  assert.equal(lines.length, 1);
  assert.equal(lines[0].message, "yes");
});

test("logger.child binds request scoped fields", () => {
  const { lines, sink } = captureSink();
  const logger = createLogger({ service: "story", sink });

  logger.child({ requestId: "req-1", userId: "u-1" }).info("started", { operation: "listStories" });

  assert.equal(lines[0].requestId, "req-1");
  assert.equal(lines[0].userId, "u-1");
});

test("redact bounds depth, key counts and string length", () => {
  const deep = { a: { b: { c: { d: { e: { f: { g: "too deep" } } } } } } };
  const redacted = redact(deep);

  assert.equal(redacted.a.b.c.d.e.f, "[max-depth]");

  const long = redact({ message: "x".repeat(5000) });
  assert.ok(long.message.endsWith("[truncated]"));
});

test("redact describes circular structures instead of throwing", () => {
  const circular = { name: "loop" };
  circular.self = circular;

  const redacted = redact(circular);

  assert.equal(redacted.name, "loop");
  assert.ok(redacted.self);
});
