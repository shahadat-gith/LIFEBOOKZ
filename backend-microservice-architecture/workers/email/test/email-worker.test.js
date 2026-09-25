import process from "node:process";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Must come before the harness import: it sets the required environment
// variables before src/config.js is evaluated (ESM evaluates imports in order).
import "./setup-env.js";

import { createEmailWorkerHarness, sqsEvent, baseJob } from "./harness.js";

describe("email worker", () => {
  const job = (overrides = {}) => ({ ...baseJob, ...overrides });

  it("sends a valid job through SES", async () => {
    const harness = createEmailWorkerHarness();
    const response = await harness.handler(sqsEvent([job()]));

    assert.equal(response.batchItemFailures.length, 0);
    assert.equal(harness.sends.length, 1);
    assert.equal(harness.sends[0].to, "reader@example.com");
    assert.equal(harness.sends[0].template, "welcome");
  });

  it("is idempotent — a duplicate jobId is skipped, not sent twice", async () => {
    const harness = createEmailWorkerHarness();
    await harness.handler(sqsEvent([job()]));
    const second = await harness.handler(sqsEvent([{ ...job(), jobId: baseJob.jobId }]));

    assert.equal(harness.sends.length, 1);
    assert.equal(second.batchItemFailures.length, 0);
  });

  it("reports unparseable messages as batch item failures", async () => {
    const harness = createEmailWorkerHarness();
    const response = await harness.handler(sqsEvent(["not-json"]));

    assert.equal(response.batchItemFailures[0].itemIdentifier, "msg-0");
    assert.equal(harness.sends.length, 0);
  });

  it("reports schema-invalid jobs as failures without sending", async () => {
    const harness = createEmailWorkerHarness();
    const response = await harness.handler(sqsEvent([job({ template: "not-a-template" })]));

    assert.equal(response.batchItemFailures[0].itemIdentifier, "msg-0");
    assert.equal(harness.sends.length, 0);
  });

  it("releases the claim when SES fails so a redelivery retries", async () => {
    const harness = createEmailWorkerHarness();
    harness.sesClient.failNext = { message: "SES throttling" };

    const first = await harness.handler(sqsEvent([job()]));
    assert.equal(first.batchItemFailures[0].itemIdentifier, "msg-0");
    assert.equal(harness.sends.length, 0);
    assert.deepEqual(harness.releases, [baseJob.jobId]);

    // Redelivery now succeeds because the claim was released.
    const second = await harness.handler(sqsEvent([job()]));
    assert.equal(second.batchItemFailures.length, 0);
    assert.equal(harness.sends.length, 1);
  });

  it("classifies SES MessageRejected as permanent", async () => {
    const harness = createEmailWorkerHarness();
    harness.sesClient.failNext = { message: "Invalid address", permanent: true };
    // Syntactically valid address (the schema requires it) that SES itself
    // would reject — the fake surfaces it as a permanent error.
    await harness.handler(sqsEvent([job({ to: "suppressed@example.com" })]));

    assert.equal(harness.failures[0]?.error?.permanent, true);
  });

  it("processes a full batch and only fails the broken messages", async () => {
    const harness = createEmailWorkerHarness();
    const response = await harness.handler(
      sqsEvent([job(), "not-json", job({ jobId: "job-22222222", to: "other@example.com" })]),
    );

    assert.equal(harness.sends.length, 2);
    assert.equal(response.batchItemFailures.length, 1);
    assert.equal(response.batchItemFailures[0].itemIdentifier, "msg-1");
  });
});
