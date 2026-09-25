import test from "node:test";
import assert from "node:assert/strict";

import {
  createFakeAuditLogs,
  createFakeAuthClient,
  createFakePublisher,
  createFakeReviewQueue,
  createLogger,
} from "./fakes.js";

import { createAdminService } from "../src/services/admin.js";
import { createDeveloperService } from "../src/services/developer.js";
import { createSystemEventHandlers } from "../src/consumers/domain-events.js";

const setup = ({ authFail } = {}) => {
  const reviewQueue = createFakeReviewQueue();
  const auditLogs = createFakeAuditLogs();
  const publisher = createFakePublisher();
  const authClient = createFakeAuthClient({ fail: authFail });
  const logger = createLogger();

  const admin = createAdminService({ reviewQueue, auditLogs, publisher, authClient, logger });
  const developer = createDeveloperService({ auditLogs, cloudWatch: null, logger });

  const eventHandlers = createSystemEventHandlers({ reviewQueue, auditLogs, logger });

  return { reviewQueue, auditLogs, publisher, authClient, admin, developer, eventHandlers };
};

test("a submitted expert profile enters the pending review queue", async () => {
  const { eventHandlers, reviewQueue } = setup();

  await eventHandlers.ExpertProfileSubmitted({
    eventId: "evt-1",
    occurredAt: "2026-09-25T10:00:00.000Z",
    data: { accountId: "acc-1", fullName: "Dr. Expert", expertise: "Child psychology", categories: ["behaviour"] },
  });

  const pending = await reviewQueue.listByStatus("expert", "pending");
  assert.equal(pending.length, 1);
  assert.equal(pending[0].summary.expertise, "Child psychology");
});

test("admin approve calls Auth, records the decision, publishes the audit event", async () => {
  const t = setup();

  await t.eventHandlers.AuthorProfileSubmitted({
    eventId: "evt-2",
    occurredAt: "2026-09-25T10:00:00.000Z",
    data: { accountId: "acc-2", fullName: "Writer One", profession: "Novelist" },
  });

  const result = await t.admin.decideVerification({
    accountId: "acc-2",
    role: "author",
    decision: "approved",
    actor: { accountId: "admin-1", role: "admin" },
  });

  assert.equal(t.authClient.calls.length, 1);
  assert.equal(t.authClient.calls[0].decision, "approved");
  assert.equal(t.auditLogs.entries.length, 1);
  assert.equal(t.auditLogs.entries[0].outcome, "success");
  assert.equal(t.publisher.published.at(-1).type, "AdminActionRecorded");
  assert.deepEqual(result, { accountId: "acc-2", decision: "approved" });
});

test("admin reject without a reason is refused before anything else happens", async () => {
  const t = setup();

  await assert.rejects(
    () =>
      t.admin.decideVerification({
        accountId: "acc-3",
        role: "author",
        decision: "rejected",
        reason: "   ",
        actor: { accountId: "admin-1", role: "admin" },
      }),
    /Rejection reason is required/,
  );

  assert.equal(t.authClient.calls.length, 0);
  assert.equal(t.auditLogs.entries.length, 0);
});

test("a failed Auth call is audited as a failure and surfaces as upstream error", async () => {
  const t = setup({ authFail: true });

  await assert.rejects(
    () =>
      t.admin.decideVerification({
        accountId: "acc-4",
        role: "expert",
        decision: "approved",
        actor: { accountId: "admin-1", role: "admin" },
      }),
    /decision could not be recorded/,
  );

  assert.equal(t.auditLogs.entries[0].outcome, "failure");
});

test("verification decisions sync into the review queue read model", async () => {
  const { eventHandlers, reviewQueue } = setup();

  await eventHandlers.AccountRegistered({
    eventId: "evt-5",
    occurredAt: "2026-09-25T10:00:00.000Z",
    data: { accountId: "acc-5", role: "author", email: "a@x.com", username: "a", fullName: "A" },
  });

  await eventHandlers.AccountVerificationDecided({
    eventId: "evt-6",
    occurredAt: "2026-09-25T11:00:00.000Z",
    data: { accountId: "acc-5", role: "author", decision: "approved" },
  });

  const approved = await reviewQueue.listByStatus("author", "approved");
  assert.equal(approved.length, 1);
  assert.equal(approved[0].email, "a@x.com");
});

test("dashboard counts reflect the review queue state", async () => {
  const t = setup();

  await t.eventHandlers.AuthorProfileSubmitted({
    eventId: "evt-7",
    occurredAt: "2026-09-25T10:00:00.000Z",
    data: { accountId: "acc-7", fullName: "W", profession: "P" },
  });
  await t.eventHandlers.ExpertProfileSubmitted({
    eventId: "evt-8",
    occurredAt: "2026-09-25T10:00:00.000Z",
    data: { accountId: "acc-8", fullName: "E", expertise: "X", categories: [] },
  });
  await t.admin.decideVerification({
    accountId: "acc-8",
    role: "expert",
    decision: "approved",
    actor: { accountId: "admin-1", role: "admin" },
  });
  // Read model must also see the decision (Auth's event will confirm it too).
  await t.eventHandlers.AccountVerificationDecided({
    eventId: "evt-9",
    occurredAt: "2026-09-25T10:30:00.000Z",
    data: { accountId: "acc-8", role: "expert", decision: "approved" },
  });

  const counts = await t.admin.dashboard();
  assert.equal(counts.pendingAuthors, 1);
  assert.equal(counts.pendingExperts, 0);
  assert.equal(counts.approvedExperts, 1);
});

test("privileged logins land in the audit trail", async () => {
  const { eventHandlers, auditLogs } = setup();

  await eventHandlers.PrivilegedLoginRecorded({
    eventId: "evt-10",
    data: { role: "developer", email: "dev@lifebookz.com", outcome: "success", ip: "10.0.0.1" },
  });
  await eventHandlers.PrivilegedLoginRecorded({
    eventId: "evt-11",
    data: { role: "admin", email: "admin@lifebookz.com", outcome: "failed", ip: "10.0.0.2" },
  });

  assert.equal(auditLogs.entries.length, 2);
  assert.equal(auditLogs.entries[0].outcome, "success");
  assert.equal(auditLogs.entries[1].outcome, "failure");
});

test("developer service serves the audit log listing and stats", async () => {
  const t = setup();

  await t.eventHandlers.PrivilegedLoginRecorded({
    eventId: "evt-12",
    data: { role: "admin", email: "admin@lifebookz.com", outcome: "success" },
  });

  const listing = await t.developer.logs({ limit: 10 });
  assert.equal(listing.total, 1);

  const stats = await t.developer.logStats();
  assert.equal(stats.total, 1);
});
