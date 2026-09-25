import test from "node:test";
import assert from "node:assert/strict";

import { createDynamoIdempotencyStore } from "../src/idempotency-dynamo.js";

/** Minimal DynamoDB double: conditional puts, deletes, and failure injection. */
function createFakeDynamo({ failWith } = {}) {
  const items = new Map();
  const commands = [];

  return {
    items,
    commands,
    async send(command) {
      commands.push(command);

      if (failWith) throw failWith;

      const name = command.constructor.name;

      if (name === "PutItemCommand") {
        const pk = command.input.Item.pk.S;

        if (items.has(pk)) {
          const error = new Error("conditional request failed");
          error.name = "ConditionalCheckFailedException";
          throw error;
        }

        items.set(pk, command.input.Item);
        return {};
      }

      if (name === "DeleteItemCommand") {
        items.delete(command.input.Key.pk.S);
        return {};
      }

      throw new Error(`unexpected command ${name}`);
    },
  };
}

test("the first claim wins and a redelivery is reported as a duplicate", async () => {
  const client = createFakeDynamo();
  const store = createDynamoIdempotencyStore({ table: "lifebookz-email-idempotency", client, service: "email" });

  assert.equal(await store.claim("evt-1", { eventType: "OtpRequested" }), true);
  assert.equal(await store.claim("evt-1", { eventType: "OtpRequested" }), false);
  assert.equal(await store.claim("evt-2"), true);
  assert.equal(client.items.size, 2);
});

test("a released claim can be claimed again, so a retry is processed", async () => {
  const client = createFakeDynamo();
  const store = createDynamoIdempotencyStore({ table: "t", client, service: "email" });

  await store.claim("evt-1");
  await store.release("evt-1");

  assert.equal(await store.claim("evt-1"), true);
});

test("claims carry a TTL so the table cannot grow forever", async () => {
  const client = createFakeDynamo();
  const store = createDynamoIdempotencyStore({ table: "t", client, service: "email", ttlSeconds: 3600 });

  await store.claim("evt-1", { eventType: "EmailDelivered", sqsMessageId: "msg-1" });

  const item = client.items.get("email:evt-1");
  const ttl = Number(item.ttl.N);
  const expected = Math.floor(Date.now() / 1000) + 3600;

  assert.ok(Math.abs(ttl - expected) < 5, "ttl must be ~now + ttlSeconds");
  assert.equal(item.eventType.S, "EmailDelivered");
  assert.equal(item.sqsMessageId.S, "msg-1");
});

test("the key is namespaced per worker so two workers cannot collide", async () => {
  const client = createFakeDynamo();
  const email = createDynamoIdempotencyStore({ table: "t", client, service: "email" });
  const analytics = createDynamoIdempotencyStore({ table: "t", client, service: "analytics" });

  assert.equal(await email.claim("evt-1"), true);
  assert.equal(await analytics.claim("evt-1"), true);
});

test("a DynamoDB outage surfaces as an error instead of being treated as a duplicate", async () => {
  const failure = new Error("ResourceNotFoundException");
  failure.name = "ResourceNotFoundException";

  const store = createDynamoIdempotencyStore({ table: "t", client: createFakeDynamo({ failWith: failure }), service: "email" });

  await assert.rejects(() => store.claim("evt-1"), /ResourceNotFoundException/);
});

test("a table name is required", () => {
  assert.throws(() => createDynamoIdempotencyStore({}), /requires a DynamoDB table name/);
});
