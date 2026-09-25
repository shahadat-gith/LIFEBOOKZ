import test from "node:test";
import assert from "node:assert/strict";

import {
  authenticationError,
  badRequestError,
  conflictError,
  normalizeError,
  notFoundError,
  toErrorResponse,
  tooManyRequestsError,
  validationError,
} from "../index.js";

test("app error factories carry status, code, fields and the isAppError flag", () => {
  const error = validationError("Validation failed", { fields: { email: "required" } });

  assert.equal(error.isAppError, true);
  assert.equal(error.statusCode, 422);
  assert.equal(error.code, "VALIDATION_ERROR");
  assert.deepEqual(error.fields, { email: "required" });
});

test("each factory maps to the documented HTTP status", () => {
  assert.equal(badRequestError().statusCode, 400);
  assert.equal(authenticationError().statusCode, 401);
  assert.equal(notFoundError().statusCode, 404);
  assert.equal(conflictError().statusCode, 409);
  assert.equal(validationError().statusCode, 422);
  assert.equal(tooManyRequestsError().statusCode, 429);
});

test("tooManyRequestsError exposes retryAfterSeconds for the client", () => {
  const error = tooManyRequestsError("Slow down", { retryAfterSeconds: 30 });
  assert.equal(error.details.retryAfterSeconds, 30);
});

test("normalizeError maps mongoose duplicate key errors to a 409 with fields", () => {
  const mongoError = Object.assign(new Error("E11000"), {
    name: "MongoServerError",
    code: 11000,
    keyValue: { email: "a@b.com" },
  });

  const normalized = normalizeError(mongoError);

  assert.equal(normalized.statusCode, 409);
  assert.equal(normalized.code, "DUPLICATE_FIELD");
  assert.ok(normalized.fields.email);
});

test("normalizeError maps mongoose validation errors field by field", () => {
  const mongoError = Object.assign(new Error("invalid"), {
    name: "ValidationError",
    errors: { fullName: { message: "fullName is required" } },
  });

  const normalized = normalizeError(mongoError);

  assert.equal(normalized.statusCode, 422);
  assert.deepEqual(normalized.fields, { fullName: "fullName is required" });
});

test("normalizeError never leaks an unknown error message to the client", () => {
  const normalized = normalizeError(new Error("connection string leaked here"));

  assert.equal(normalized.statusCode, 500);
  assert.equal(normalized.message, "An unexpected error occurred.");
});

test("toErrorResponse returns the API error envelope and logs 5xx with a stack", () => {
  const logged = [];
  const logger = {
    error: (message, meta) => logged.push({ level: "error", message, meta }),
    warn: (message, meta) => logged.push({ level: "warn", message, meta }),
  };

  const response = toErrorResponse(new Error("boom"), {
    requestId: "req-1",
    service: "story",
    logger,
    context: { operation: "createStory" },
  });

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.requestId, "req-1");
  assert.equal(response.body.error.message, "An unexpected error occurred.");
  assert.equal(logged.length, 1);
  assert.equal(logged[0].level, "error");
  assert.ok(logged[0].meta.stack);
});

test("toErrorResponse logs expected 4xx outcomes as warnings without a stack", () => {
  const logged = [];
  const logger = {
    error: (...args) => logged.push({ level: "error", args }),
    warn: (message, meta) => logged.push({ level: "warn", message, meta }),
  };

  const response = toErrorResponse(notFoundError("Story not found."), {
    requestId: "req-2",
    service: "story",
    logger,
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error.message, "Story not found.");
  assert.equal(logged.length, 1);
  assert.equal(logged[0].level, "warn");
  assert.equal(logged[0].meta.stack, undefined);
});
