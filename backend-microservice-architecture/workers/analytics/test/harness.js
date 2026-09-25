// Sets the required env before config modules evaluate (see setup-env.js).
import "./setup-env.js";

import { createHandler } from "../src/handler.js";
import { createS3Sink } from "../src/s3.js";

/**
 * Test harness — the real handler wired to an in-memory S3 sink.
 * No AWS account needed.
 */
export function createAnalyticsHarness() {
  const objects = [];

  const s3Client = {
    async send(command) {
      objects.push({ key: command.input.Key, body: command.input.Body, contentType: command.input.ContentType });
      return { ETag: `"etag-${objects.length}"` };
    },
  };

  const sink = createS3Sink({ client: s3Client, bucket: "test-bucket", prefix: "events/", logger: silentLogger() });
  const handler = createHandler({ sink, logger: silentLogger() });

  return { objects, sink, handler };
}

function silentLogger() {
  const noop = () => {};
  return {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    failure: noop,
    child: () => silentLogger(),
  };
}

/** Build an SQS event whose bodies are EventBridge → SQS envelopes. */
export function sqsEvent(domainEvents) {
  return {
    Records: domainEvents.map((detail, index) => ({
      messageId: `msg-${index}`,
      body: JSON.stringify({
        id: `bridge-${index}`,
        "detail-type": detail.eventType,
        source: detail.source,
        time: detail.occurredAt,
        detail,
      }),
      attributes: { ApproximateReceiveCount: "1" },
    })),
  };
}

/** Build a valid LifeBookz domain event (envelope shape). */
export function domainEvent(overrides = {}) {
  return {
    eventId: `evt-${Math.random().toString(36).slice(2, 10)}`,
    eventType: "StoryPublished",
    eventVersion: 1,
    envelopeVersion: 1,
    occurredAt: "2026-09-25T10:00:00.000Z",
    source: "lifebookz.story",
    actor: { accountId: "acc-11111111", role: "author" },
    correlationId: "corr-11111111",
    data: { storyId: "story-11111111", visibility: "public" },
    ...overrides,
  };
}
