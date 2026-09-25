import test from "node:test";
import assert from "node:assert/strict";

import { v, validate, parseJsonField, paginationSchema, searchSchema } from "../index.js";

function captureError(run) {
  try {
    run();
    return null;
  } catch (error) {
    return error;
  }
}

test("validate returns sanitised values and drops unknown keys", () => {
  const value = validate(
    { email: v.email(), fullName: v.string({ min: 2, max: 100 }) },
    { email: " Reader@Example.COM ", fullName: "  Ada  ", role: "admin" },
  );

  assert.deepEqual(value, { email: "reader@example.com", fullName: "Ada" });
  assert.equal("role" in value, false);
});

test("validate reports every invalid field at once with its path", () => {
  const error = captureError(() =>
    validate(
      { email: v.email(), password: v.string({ min: 8 }) },
      { email: "not-an-email", password: "short" },
    ),
  );

  assert.ok(error);
  assert.equal(error.statusCode, 422);
  assert.equal(error.code, "VALIDATION_ERROR");
  assert.ok(error.fields.email);
  assert.ok(error.fields.password);
});

test("required fields are reported when missing", () => {
  const error = captureError(() => validate({ title: v.string({ min: 1 }) }, {}));

  assert.equal(error.fields.title, "title is required.");
});

test("optional and defaulted fields are handled", () => {
  const value = validate(
    {
      page: v.number({ min: 1, integer: true }).default(1),
      profession: v.string({ max: 50 }).optional(),
      visibility: v.enumOf(["public", "followers", "private"]).default("public"),
    },
    {},
  );

  assert.deepEqual(value, { page: 1, visibility: "public" });
  assert.equal("profession" in value, false);
});

test("enum, number and boolean coercion behave like the API contract", () => {
  const value = validate(
    { role: v.enumOf(["user", "author", "expert"]), experience: v.number({ min: 0, max: 60 }), verified: v.boolean() },
    { role: "expert", experience: "12", verified: "true" },
  );

  assert.deepEqual(value, { role: "expert", experience: 12, verified: true });

  const badEnum = captureError(() => validate({ role: v.enumOf(["user"]) }, { role: "wizard" }));
  assert.match(badEnum.fields.role, /must be one of: user/);

  const badNumber = captureError(() => validate({ n: v.number({ integer: true }) }, { n: 1.5 }));
  assert.match(badNumber.fields.n, /whole number/);
});

test("objectId and nested objects/arrays are validated recursively", () => {
  const shape = {
    storyId: v.objectId(),
    chapters: v.arrayOf({ title: v.string({ min: 1, max: 200 }), order: v.number({ min: 0, integer: true }) }, { min: 1 }),
  };

  const value = validate(shape, {
    storyId: "65f1c0a2b3d4e5f6a7b8c9d0",
    chapters: [{ title: "Childhood", order: 0 }],
  });

  assert.equal(value.chapters.length, 1);
  assert.equal(value.chapters[0].title, "Childhood");

  assert.throws(
    () => validate(shape, { storyId: "nope", chapters: [{ title: "", order: -1 }] }),
    /Validation failed/,
  );
});

test("pagination and search primitives are usable as-is", () => {
  const page = validate(paginationSchema, { limit: "25" });
  assert.equal(page.page, 1);
  assert.equal(page.limit, 25);

  const tooBig = captureError(() => validate(paginationSchema, { limit: "500" }));
  assert.match(tooBig.fields.limit, /at most 50/);

  const emptyQuery = captureError(() => validate(searchSchema, { q: "" }));
  assert.ok(emptyQuery.fields.q);
});

test("parseJsonField decodes multipart text payloads defensively", () => {
  assert.deepEqual(parseJsonField('{"country":"IN"}'), { country: "IN" });
  assert.deepEqual(parseJsonField({ country: "IN" }), { country: "IN" });
  assert.equal(parseJsonField("not json", { fallback: null }), null);
  assert.equal(parseJsonField(undefined, { fallback: {} }) == null, false);
});
