import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createAnalyticsHarness, sqsEvent, domainEvent } from "./harness.js";

describe("analytics worker", () => {
  it("writes a batch of events as JSONL under the Hive partition", async () => {
    const harness = createAnalyticsHarness();
    const response = await harness.handler(
      sqsEvent([domainEvent(), domainEvent({ eventType: "ConsultationBooked", source: "lifebookz.consultation" })]),
    );

    assert.equal(response.batchItemFailures.length, 0);
    assert.equal(harness.objects.length, 1);

    const object = harness.objects[0];
    assert.match(object.key, /^events\/year=2026\/month=09\/day=25\/.+\.jsonl$/);

    const lines = object.body.trim().split("\n");
    assert.equal(lines.length, 2);

    const first = JSON.parse(lines[0]);
    assert.equal(first.eventType, "StoryPublished");
    assert.equal(first.year, "2026");
    assert.equal(first.month, "09");
    assert.equal(first.day, "25");
    assert.equal(first.actorRole, "author");
  });

  it("preserves eventId so duplicates can be deduplicated at query time", async () => {
    const harness = createAnalyticsHarness();
    const event = domainEvent();
    await harness.handler(sqsEvent([event]));
    // Redelivery of the same message (SQS at-least-once).
    await harness.handler(sqsEvent([event]));

    assert.equal(harness.objects.length, 2);
    const ids = harness.objects.map((o) => JSON.parse(o.body.trim()).eventId);
    assert.equal(ids[0], ids[1]);
  });

  it("reports unparseable messages as batch item failures", async () => {
    const harness = createAnalyticsHarness();
    const response = await harness.handler({
      Records: [{ messageId: "msg-0", body: "not-json", attributes: { ApproximateReceiveCount: "1" } }],
    });

    assert.equal(response.batchItemFailures[0].itemIdentifier, "msg-0");
    assert.equal(harness.objects.length, 0);
  });

  it("reports events missing identity fields so they reach the DLQ", async () => {
    const harness = createAnalyticsHarness();
    const response = await harness.handler(sqsEvent([domainEvent({ eventId: undefined })]));

    assert.equal(response.batchItemFailures[0].itemIdentifier, "msg-0");
    assert.equal(harness.objects.length, 0);
  });

  it("scrubs secret-like keys from the payload", async () => {
    const harness = createAnalyticsHarness();
    await harness.handler(
      sqsEvent([domainEvent({ data: { storyId: "s1", otpCode: "123456", emailAddress: "x@y.com", visibility: "public" } })]),
    );

    const record = JSON.parse(harness.objects[0].body.trim());
    assert.equal(record.data.otpCode, undefined);
    assert.equal(record.data.emailAddress, undefined);
    assert.equal(record.data.storyId, "s1");
    assert.equal(record.data.visibility, "public");
  });

  it("reports an S3 write failure for the whole batch (retry path)", async () => {
    const harness = createAnalyticsHarness();
    // Break the sink so the write throws.
    harness.sink.put = async () => {
      throw new Error("S3 unavailable");
    };

    const response = await harness.handler(sqsEvent([domainEvent(), domainEvent()]));

    assert.equal(response.batchItemFailures.length, 2);
  });

  it("writes nothing for an empty batch", async () => {
    const harness = createAnalyticsHarness();
    const response = await harness.handler({ Records: [] });

    assert.equal(response.batchItemFailures.length, 0);
    assert.equal(harness.objects.length, 0);
  });
});
