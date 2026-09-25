import test from "node:test";
import assert from "node:assert/strict";

import { ConfigurationError, listEnv, loadConfig, numberEnv, optionalEnv, requireEnv } from "../src/config.js";
import { loadSecretJson, loadSecretString, resolveSecretWithEnvFallback } from "../src/secrets.js";
import { MONGO_LAMBDA_DEFAULTS } from "../src/mongo.js";

test("requireEnv throws with the service name and variable name", () => {
  assert.throws(() => requireEnv("DEFINITELY_MISSING_VAR", { service: "story" }), (error) => {
    assert.ok(error instanceof ConfigurationError);
    assert.match(error.message, /\[story\]/);
    assert.match(error.message, /DEFINITELY_MISSING_VAR/);
    return true;
  });
});

test("loadConfig reports every missing variable at once", () => {
  assert.throws(
    () =>
      loadConfig({
        service: "auth",
        required: { mongoUri: "MONGODB_AUTH_URI", bus: "EVENT_BUS_NAME" },
      }),
    /MONGODB_AUTH_URI, EVENT_BUS_NAME/,
  );
});

test("loadConfig coerces numbers, lists and optional fallbacks", () => {
  process.env.TEST_PORT = "8080";
  process.env.TEST_ORIGINS = "http://localhost:5173, http://localhost:5174";

  const config = loadConfig({
    service: "story",
    optional: { bus: ["EVENT_BUS_NAME", "lifebookz-events"] },
    numbers: { port: { variable: "TEST_PORT", min: 1, max: 65535 } },
    lists: { origins: { variable: "TEST_ORIGINS" } },
  });

  assert.equal(config.bus, "lifebookz-events");
  assert.equal(config.port, 8080);
  assert.deepEqual(config.origins, ["http://localhost:5173", "http://localhost:5174"]);
  assert.equal(Object.isFrozen(config), true);

  delete process.env.TEST_PORT;
  delete process.env.TEST_ORIGINS;
});

test("numberEnv validates bounds and integrality", () => {
  process.env.TEST_N = "2.5";
  assert.throws(() => numberEnv("TEST_N"), /whole number/);
  assert.equal(numberEnv("TEST_N", { integer: false, max: 3 }), 2.5);
  assert.throws(() => numberEnv("TEST_N", { integer: false, max: 1 }), /<= 1/);
  delete process.env.TEST_N;
});

test("optionalEnv and listEnv fall back predictably", () => {
  assert.equal(optionalEnv("MISSING_VAR_XYZ", "fallback"), "fallback");
  assert.deepEqual(listEnv("MISSING_ORIGINS_VAR", { fallback: ["a"] }), ["a"]);
});

test("secrets are read once and cached per container", async () => {
  const { resetSecretCache } = await import("../src/secrets.js");
  resetSecretCache();

  let calls = 0;
  const client = {
    send: async () => {
      calls += 1;
      return { SecretString: JSON.stringify({ uri: "mongodb://example" }) };
    },
  };

  const first = await loadSecretJson("lifebookz/story/mongodb-uri", { client });
  const second = await loadSecretJson("lifebookz/story/mongodb-uri", { client });

  assert.equal(first.uri, "mongodb://example");
  assert.deepEqual(second, first);
  // The injected client bypasses the shared cache used in the Lambda.
  assert.equal(calls, 2);
});

test("a secret with no value is reported clearly", async () => {
  await assert.rejects(
    () => loadSecretString("empty-secret", { client: { send: async () => ({}) } }),
    /has no value/,
  );
});

test("resolveSecretWithEnvFallback prefers the secret and falls back locally", async () => {
  process.env.NODE_ENV = "dev";
  process.env.TEST_MONGO_URI = "mongodb://localhost:27017";

  const value = await resolveSecretWithEnvFallback({
    secretIdEnvVar: "MISSING_SECRET_ID_VAR",
    valueEnvVar: "TEST_MONGO_URI",
  });

  assert.equal(value, "mongodb://localhost:27017");

  const fromSecret = await resolveSecretWithEnvFallback({
    secretId: "some-secret-id",
    valueEnvVar: "TEST_MONGO_URI",
    client: { send: async () => ({ SecretString: "mongodb+srv://real" }) },
  });

  assert.equal(fromSecret, "mongodb+srv://real");
  delete process.env.TEST_MONGO_URI;
  process.env.NODE_ENV = "test";
});

test("the Lambda Mongo defaults are deliberately small and bounded", () => {
  assert.ok(MONGO_LAMBDA_DEFAULTS.maxPoolSize <= 10, "pool must stay small: containers multiply it");
  assert.equal(MONGO_LAMBDA_DEFAULTS.minPoolSize, 0);
  assert.ok(MONGO_LAMBDA_DEFAULTS.serverSelectionTimeoutMS <= 5000);
  assert.equal(MONGO_LAMBDA_DEFAULTS.retryWrites, true);
});
