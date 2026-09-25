// Required when the file is executed directly by `node --test` (it matches
// the default test glob); sets env before the config module is evaluated.
import "./setup-env.js";

import { createInMemoryIdempotencyStore } from "@lifebookz/shared-events";

import { createHandler } from "../src/handler.js";

/**
 * Test harness: the real handler factory wired to an in-memory SES fake and an
 * in-memory idempotency store — no AWS account needed.
 */
export function createEmailWorkerHarness() {
  const sends = [];
  const failures = [];

  const sesClient = {
    async send(job) {
      if (sesClient.failNext) {
        const error = new Error(sesClient.failNext.message);
        if (sesClient.failNext.permanent) error.permanent = true;
        sesClient.failNext = null;
        failures.push({ job, error });
        throw error;
      }

      sends.push(job);
      return { messageId: `ses-${sends.length}` };
    },
  };
  sesClient.failNext = null;

  const store = createInMemoryIdempotencyStore();
  const claims = [];
  const releases = [];

  const idempotency = {
    async claim(id, meta) {
      const claimed = await store.claim(id, meta);
      if (claimed) claims.push(id);
      return claimed;
    },
    async release(id) {
      releases.push(id);
      return store.release(id);
    },
  };

  const handler = createHandler({ sesGateway: sesClient, idempotencyStore: idempotency });

  return { sends, failures, sesClient, claims, releases, handler };
}

/** Build a valid SQS event from email jobs. */
export function sqsEvent(jobs) {
  return {
    Records: jobs.map((body, index) => ({
      messageId: `msg-${index}`,
      body: typeof body === "string" ? body : JSON.stringify(body),
      attributes: { ApproximateReceiveCount: "1" },
    })),
  };
}

export const baseJob = {
  jobId: "job-11111111",
  jobVersion: 1,
  type: "email",
  template: "welcome",
  to: "reader@example.com",
  toName: "Priya",
  data: { name: "Priya Reader" },
  sourceEventId: "evt-11111111",
  queuedAt: "2026-09-25T10:00:00.000Z",
};
