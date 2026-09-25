import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ANALYTICS_EVENT_TYPES,
  EVENT_TYPES,
  buildEvent,
  createEventConsumer,
  createInMemoryIdempotencyStore,
  createPublisher,
  eventDefinition,
  isKnownEventType,
  parseSqsBatch,
  unwrapSqsRecord,
} from "../index.js";

test("every registered event declares an owner source and a version", () => {
  for (const [type, definition] of Object.entries(EVENT_TYPES)) {
    assert.ok(definition.source, `${type} needs a source`);
    assert.equal(typeof definition.version, "number", `${type} needs a numeric version`);
    assert.ok(definition.description, `${type} needs a description`);
  }
});

test("buildEvent produces the documented versioned envelope", () => {
  const event = buildEvent({
    type: "StoryPublished",
    data: { storyId: "s-1", authorId: "a-1" },
    actor: { accountId: "a-1", role: "author" },
    correlationId: "corr-1",
  });

  assert.equal(event.eventType, "StoryPublished");
  assert.equal(event.eventVersion, eventDefinition("StoryPublished").version);
  assert.equal(event.source, "lifebookz.story");
  assert.ok(event.eventId);
  assert.ok(event.occurredAt);
  assert.deepEqual(event.actor, { accountId: "a-1", role: "author" });
  assert.equal(event.correlationId, "corr-1");
});

test("buildEvent refuses undeclared event types", () => {
  assert.equal(isKnownEventType("NotebookCreated"), false);
  assert.throws(() => buildEvent({ type: "NotebookCreated", data: {} }), /Unknown event type/);
});

test("dynamic-source events resolve the publisher's own source", () => {
  const event = buildEvent({ type: "RequestFailed", service: "story", data: { status: 500 } });
  assert.equal(event.source, "lifebookz.story");

  assert.throws(() => buildEvent({ type: "RequestFailed", data: {} }), /dynamic source/);
});

test("buildEvent rejects non-object payloads", () => {
  assert.throws(() => buildEvent({ type: "StoryCreated", data: [] }), /must be an object/);
});

test("publisher sends the envelope to the configured event bus", async () => {
  const sent = [];
  const client = { send: async (command) => (sent.push(command), { FailedEntryCount: 0, Entries: [{}] }) };

  const publisher = createPublisher({ busName: "lifebookz-events", client, service: "story" });
  const event = await publisher.publish({
    type: "StoryLiked",
    data: { storyId: "s-1" },
    actor: { accountId: "u-1", role: "user" },
  });

  assert.equal(sent.length, 1);
  const entry = sent[0].input.Entries[0];
  assert.equal(entry.EventBusName, "lifebookz-events");
  assert.equal(entry.Source, "lifebookz.story");
  assert.equal(entry.DetailType, "StoryLiked");
  assert.equal(JSON.parse(entry.Detail).eventId, event.eventId);
});

test("publisher throws on rejected entries and publishSafely swallows them", async () => {
  const client = {
    send: async () => ({ FailedEntryCount: 1, Entries: [{ ErrorCode: "ThrottlingException", ErrorMessage: "slow down" }] }),
  };
  const warnings = [];
  const logger = { warn: (message, meta) => warnings.push({ message, meta }), debug: () => {} };

  const publisher = createPublisher({ busName: "lifebookz-events", client, service: "story", logger });

  await assert.rejects(() => publisher.publish({ type: "StoryCreated", data: {} }), /ThrottlingException/);
  const result = await publisher.publishSafely({ type: "StoryCreated", data: {} });

  assert.equal(result, null);
  assert.equal(warnings.length, 1);
});

test("publisher fails loudly when the bus name is missing", async () => {
  const publisher = createPublisher({ busName: "", client: { send: async () => ({}) }, service: "story" });
  await assert.rejects(() => publisher.publish({ type: "StoryCreated", data: {} }), /EVENT_BUS_NAME/);
});

function sqsRecord(envelope, { messageId = "m-1", receiveCount = 1 } = {}) {
  return {
    messageId,
    body: JSON.stringify({
      id: "bridge-1",
      source: envelope.source,
      "detail-type": envelope.eventType,
      time: envelope.occurredAt,
      detail: envelope,
    }),
    attributes: { ApproximateReceiveCount: String(receiveCount) },
  };
}

test("unwrapSqsRecord restores the envelope from the EventBridge message", () => {
  const envelope = buildEvent({ type: "FollowCreated", data: { authorId: "a-1" } });
  const event = unwrapSqsRecord(sqsRecord(envelope, { receiveCount: 2 }));

  assert.equal(event.eventId, envelope.eventId);
  assert.equal(event.eventType, "FollowCreated");
  assert.equal(event.sqs.receiveCount, 2);
  assert.equal(event.bridge.id, "bridge-1");
});

test("parseSqsBatch separates unparseable messages instead of throwing", () => {
  const envelope = buildEvent({ type: "CommentCreated", data: { commentId: "c-1" } });
  const batch = parseSqsBatch({
    Records: [sqsRecord(envelope), { messageId: "broken", body: "not json", attributes: {} }],
  });

  assert.equal(batch.events.length, 1);
  assert.equal(batch.invalid.length, 1);
  assert.equal(batch.invalid[0].messageId, "broken");
});

test("a failing handler is reported as a batch item failure and retried exactly once", async () => {
  const envelope = buildEvent({ type: "StoryPublished", data: { storyId: "s-1" } });
  let attempts = 0;

  const consumer = createEventConsumer({
    handlers: {
      StoryPublished: async () => {
        attempts += 1;
        throw new Error("projection offline");
      },
    },
    idempotency: createInMemoryIdempotencyStore(),
  });

  const result = await consumer.handle({ Records: [sqsRecord(envelope)] });

  assert.equal(attempts, 1);
  assert.deepEqual(result.batchItemFailures, [{ itemIdentifier: "m-1" }]);

  // SQS redelivers the same event: the claim was released, so it is retried.
  const retry = await consumer.handle({ Records: [sqsRecord(envelope)] });
  assert.equal(attempts, 2);
  assert.deepEqual(retry.batchItemFailures, [{ itemIdentifier: "m-1" }]);
});

test("a duplicate delivery is skipped after a successful run", async () => {
  const envelope = buildEvent({ type: "CommentLiked", data: { commentId: "c-1" } });
  let calls = 0;

  const consumer = createEventConsumer({
    handlers: { CommentLiked: async () => { calls += 1; } },
    idempotency: createInMemoryIdempotencyStore(),
  });

  const first = await consumer.handle({ Records: [sqsRecord(envelope)] });
  const second = await consumer.handle({ Records: [sqsRecord(envelope)] });

  assert.equal(calls, 1);
  assert.deepEqual(first.batchItemFailures, []);
  assert.deepEqual(second.batchItemFailures, []);
});

test("unhandled event types never poison the queue", async () => {
  const envelope = buildEvent({ type: "EmailDelivered", data: { jobId: "j-1" } });
  const consumer = createEventConsumer({ handlers: {}, idempotency: createInMemoryIdempotencyStore() });

  const result = await consumer.handle({ Records: [sqsRecord(envelope)] });
  assert.deepEqual(result.batchItemFailures, []);
});

test("the analytics EventBridge pattern stays in sync with the registry allow-list", () => {
  const pattern = JSON.parse(
    readFileSync(new URL("../event-patterns/analytics.json", import.meta.url), "utf8"),
  );

  assert.deepEqual([...pattern["detail-type"]].sort(), [...ANALYTICS_EVENT_TYPES].sort());
  assert.equal(pattern.source[0].prefix, "lifebookz.");
  assert.equal(pattern["detail-type"].includes("OtpRequested"), false);
});
