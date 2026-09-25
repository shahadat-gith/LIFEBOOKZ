import test from "node:test";
import assert from "node:assert/strict";

import { createEventConsumer } from "@lifebookz/shared-events";

import { createFakeBookings, createFakeExpertProfiles, createFakeProcessedEvents, createLogger, createPublisher } from "./fakes.js";

import { createAccountEventHandlers } from "../src/consumers/account-events.js";
import { createBookingService } from "../src/services/bookings.js";
import { createExpertProfileService } from "../src/services/expert-profile.js";
import { createMatchingService } from "../src/services/matching.js";

const EXPERT_A = "65f1c0a2b3d4e5f6a7b8c9d0";
const EXPERT_B = "65f1c0a2b3d4e5f6a7b8c9d1";
const READER = "65f1c0a2b3d4e5f6a7b8c9d2";

const approvedExpert = (id, overrides = {}) => ({
  _id: id,
  fullName: `Expert ${id.slice(-2)}`,
  username: `expert${id.slice(-2)}`,
  email: `${id}@lifebookz.com`,
  accountStatus: "active",
  verification: { status: "approved" },
  categories: ["career"],
  expertise: "Career coaching",
  qualification: "MBA",
  bio: "Ten years of practice.",
  phone: "9999999999",
  price: 500,
  rating: 4,
  sessions: 10,
  isProfileCompleted: true,
  ...overrides,
});

function build(seed = [approvedExpert(EXPERT_A), approvedExpert(EXPERT_B, { rating: 5, categories: ["health"] })]) {
  const logger = createLogger();
  const publisher = createPublisher();
  const expertProfiles = createFakeExpertProfiles(seed);
  const bookings = createFakeBookings({ expertProfiles });

  return {
    logger,
    publisher,
    expertProfiles,
    bookings,
    matchingService: createMatchingService({ expertProfiles, logger }),
    expertProfileService: createExpertProfileService({ expertProfiles, bookings, publisher, logger }),
    bookingService: createBookingService({ bookings, expertProfiles, publisher, logger }),
  };
}

// ------------------------------------------------------------------ matching

test("matching ranks approved experts by rating and never invents a match score", async () => {
  const { matchingService } = build();

  const result = await matchingService.match({ problem: "I need help choosing a career path." });

  assert.equal(result.matched, false);
  assert.equal(result.experts.length, 2);
  assert.equal(result.experts[0].id, EXPERT_B); // rating 5 first
  assert.deepEqual(result.experts.map((expert) => expert.matchScore), [null, null]);
  assert.deepEqual(result.experts.map((expert) => expert.matchRank), [1, 2]);
});

test("matching filters by category and rejects an unknown one", async () => {
  const { matchingService } = build();

  const result = await matchingService.match({ problem: "Career advice please, ten years in.", category: "career" });
  assert.deepEqual(result.experts.map((expert) => expert.id), [EXPERT_A]);
  assert.equal(result.category, "career");

  await assert.rejects(() => matchingService.match({ problem: "Career advice please.", category: "astrology" }), /Unknown consultancy category/);
});

test("matching rejects a problem description that is too short", async () => {
  const { matchingService } = build();

  await assert.rejects(() => matchingService.match({ problem: "help" }), /at least 10 characters/);
});

test("only approved and active experts are matchable", async () => {
  const { matchingService } = build([
    approvedExpert(EXPERT_A, { verification: { status: "pending" } }),
    approvedExpert(EXPERT_B, { accountStatus: "suspended" }),
  ]);

  const result = await matchingService.match({ problem: "I need to talk about my career." });

  assert.equal(result.experts.length, 0);
});

// ------------------------------------------------------------------ bookings

test("booking a consultation snapshots the client from the verified claims and publishes ConsultationBooked", async () => {
  const { bookingService, publisher, bookings, expertProfiles } = build();

  const booking = await bookingService.book({
    accountId: READER,
    claims: { accountId: READER, role: "user", email: "reader@lifebookz.com", username: "reader", name: "Priya Reader" },
    input: { expertId: EXPERT_A, problem: "I want to change careers into product design.", sessionType: "video" },
  });

  assert.equal(booking.client, READER);
  assert.equal(booking.clientName, "Priya Reader");
  assert.equal(booking.clientEmail, "reader@lifebookz.com");
  assert.equal(booking.status, "pending");
  assert.equal(booking.expert.id, EXPERT_A);
  assert.equal(bookings.rows.length, 1);

  const [event] = publisher.of("ConsultationBooked");
  assert.ok(event, "ConsultationBooked must be published");
  assert.equal(event.data.bookingId, booking.id);
  assert.equal(event.data.expertId, String(EXPERT_A));
  assert.equal(event.data.clientId, READER);
  // The email job needs the expert address; it lives in the transport-only
  // `notify` block, which the analytics worker strips before writing to S3.
  assert.equal(event.notify.expertEmail, `${EXPERT_A}@lifebookz.com`);
  assert.equal(event.notify.clientName, "Priya Reader");
  assert.equal(event.data.expertEmail, undefined, "email address must not leak into analytics data");

  // No synchronous email happened here: the service has no mailer dependency.
  assert.equal(expertProfiles.profiles.get(EXPERT_A).sessions, 10);
});

test("a reader cannot book an unapproved, suspended or unknown expert", async () => {
  const { bookingService } = build([
    approvedExpert(EXPERT_A, { verification: { status: "pending" } }),
    approvedExpert(EXPERT_B, { accountStatus: "suspended" }),
  ]);

  const claims = { accountId: READER, role: "user", email: "reader@lifebookz.com" };

  await assert.rejects(
    () => bookingService.book({ accountId: READER, claims, input: { expertId: EXPERT_A, problem: "A perfectly long problem description." } }),
    /not available/,
  );
  await assert.rejects(
    () => bookingService.book({ accountId: READER, claims, input: { expertId: EXPERT_B, problem: "A perfectly long problem description." } }),
    /not available/,
  );
  await assert.rejects(
    () => bookingService.book({ accountId: READER, claims, input: { expertId: "nope", problem: "A perfectly long problem description." } }),
    /not available/,
  );
});

test("a booking still succeeds when event publishing fails", async () => {
  const logger = createLogger();
  const expertProfiles = createFakeExpertProfiles([approvedExpert(EXPERT_A)]);
  const bookings = createFakeBookings({ expertProfiles });

  const failingPublisher = {
    async publishSafely() {
      return null; // mirrors `publishSafely` swallowing an EventBridge outage
    },
  };

  const service = createBookingService({ bookings, expertProfiles, publisher: failingPublisher, logger });

  const booking = await service.book({
    accountId: READER,
    claims: { accountId: READER, role: "user", email: "reader@lifebookz.com" },
    input: { expertId: EXPERT_A, problem: "A perfectly long problem description." },
  });

  assert.equal(booking.status, "pending");
});

test("only the booking's owner can cancel it, and only while pending or confirmed", async () => {
  const { bookingService, publisher, bookings } = build();
  const claims = { accountId: READER, role: "user", email: "reader@lifebookz.com" };

  const booking = await bookingService.book({
    accountId: READER,
    claims,
    input: { expertId: EXPERT_A, problem: "A perfectly long problem description." },
  });

  await assert.rejects(() => bookingService.cancel({ accountId: EXPERT_B, bookingId: booking.id }), /Booking not found/);

  const cancelled = await bookingService.cancel({ accountId: READER, bookingId: booking.id });
  assert.equal(cancelled.status, "cancelled");
  assert.equal(publisher.of("ConsultationCancelled").length, 1);

  // Cancelling twice is rejected, not silently accepted.
  await assert.rejects(() => bookingService.cancel({ accountId: READER, bookingId: booking.id }), /cannot be cancelled/);

  const completed = bookings.rows[0];
  completed.status = "completed";

  await assert.rejects(() => bookingService.cancel({ accountId: READER, bookingId: booking.id }), /cannot be cancelled/);
});

// ------------------------------------------------------- expert-side rulings

test("an expert can only rule on their own bookings", async () => {
  const { bookingService } = build();
  const claims = { accountId: READER, role: "user" };

  const booking = await bookingService.book({
    accountId: READER,
    claims,
    input: { expertId: EXPERT_A, problem: "A perfectly long problem description." },
  });

  await assert.rejects(
    () => bookingService.setStatus({ accountId: EXPERT_B, bookingId: booking.id, status: "confirmed" }),
    /Booking not found/,
  );

  const confirmed = await bookingService.setStatus({ accountId: EXPERT_A, bookingId: booking.id, status: "confirmed" });
  assert.equal(confirmed.status, "confirmed");
});

test("completing a consultation counts exactly once, even under a retried double click", async () => {
  const { bookingService, expertProfiles, publisher } = build();

  const booking = await bookingService.book({
    accountId: READER,
    claims: { accountId: READER, role: "user", email: "reader@lifebookz.com", name: "Priya Reader" },
    input: { expertId: EXPERT_A, problem: "A perfectly long problem description." },
  });

  await bookingService.setStatus({ accountId: EXPERT_A, bookingId: booking.id, status: "completed" });
  assert.equal(expertProfiles.profiles.get(EXPERT_A).sessions, 11);

  // Idempotent: the same request again must not increment `sessions`.
  await bookingService.setStatus({ accountId: EXPERT_A, bookingId: booking.id, status: "completed" });
  assert.equal(expertProfiles.profiles.get(EXPERT_A).sessions, 11);

  // The status email is queued once, and it carries the recipient in `notify`.
  const events = publisher.of("ConsultationStatusChanged");
  assert.equal(events.length, 1);
  assert.equal(events[0].data.status, "completed");
  assert.equal(events[0].notify.clientEmail, "reader@lifebookz.com");
  assert.equal(events[0].data.clientEmail, undefined);
});

test("no status event is published when the status does not actually change", async () => {
  const { bookingService, publisher } = build();

  const booking = await bookingService.book({
    accountId: READER,
    claims: { accountId: READER, role: "user" },
    input: { expertId: EXPERT_A, problem: "A perfectly long problem description." },
  });

  await bookingService.setStatus({ accountId: EXPERT_A, bookingId: booking.id, status: "confirmed" });
  await bookingService.setStatus({ accountId: EXPERT_A, bookingId: booking.id, status: "confirmed" });

  assert.equal(publisher.of("ConsultationStatusChanged").length, 1);
});

test("an unknown booking status is rejected before any lookup", async () => {
  const { bookingService } = build();

  await assert.rejects(
    () => bookingService.setStatus({ accountId: EXPERT_A, bookingId: "booking-1", status: "refunded" }),
    /Status must be one of/,
  );
});

// ------------------------------------------------------------------- profile

test("a completed expert profile enters admin review once and publishes ExpertProfileSubmitted", async () => {
  const { expertProfileService, publisher, expertProfiles } = build([
    approvedExpert(EXPERT_A, { phone: "", expertise: "", qualification: "", bio: "", categories: [], isProfileCompleted: false }),
  ]);

  const updated = await expertProfileService.update({
    accountId: EXPERT_A,
    claims: { accountId: EXPERT_A, role: "expert" },
    input: { phone: "9876543210", expertise: "Career coaching", qualification: "MBA", bio: "Ten years.", categories: ["career"] },
  });

  assert.equal(updated.isProfileCompleted, true);
  assert.equal(expertProfiles.profiles.get(EXPERT_A).isProfileCompleted, true);
  assert.equal(publisher.of("ExpertProfileSubmitted").length, 1);

  // A later edit is a plain update, not a second submission.
  await expertProfileService.update({ accountId: EXPERT_A, claims: { accountId: EXPERT_A, role: "expert" }, input: { price: 900 } });
  assert.equal(publisher.of("ExpertProfileSubmitted").length, 1);
  assert.equal(publisher.of("ExpertProfileUpdated").length, 1);
});

test("the expert profile rejects an unknown consultancy category", async () => {
  const { expertProfileService } = build();

  await assert.rejects(
    () =>
      expertProfileService.update({
        accountId: EXPERT_A,
        claims: { accountId: EXPERT_A, role: "expert" },
        input: { categories: ["career", "astrology"] },
      }),
    /Unknown consultancy category/,
  );
});

test("the public expert profile is invisible until approved and active", async () => {
  const { expertProfileService, expertProfiles } = build([approvedExpert(EXPERT_A, { verification: { status: "pending" } })]);

  await assert.rejects(() => expertProfileService.publicProfile({ expertId: EXPERT_A }), /Expert not found/);

  await expertProfiles.syncVerification({ accountId: EXPERT_A, status: "approved" });

  const profile = await expertProfileService.publicProfile({ expertId: EXPERT_A });
  assert.equal(profile.id, EXPERT_A);
  assert.equal(profile.role, "expert");
  assert.equal(profile.stats.totalRequests, 0);
});

// ------------------------------------------------------------ event consumer

function sqsEvent(detail, messageId = "msg-1") {
  return {
    Records: [
      {
        messageId,
        body: JSON.stringify({
          id: "bridge-1",
          source: detail.source,
          "detail-type": detail.eventType,
          detail,
        }),
        attributes: { ApproximateReceiveCount: "1" },
      },
    ],
  };
}

function buildEnvelope(type, source, data, eventId = "evt-1") {
  return { eventId, eventType: type, eventVersion: 1, occurredAt: new Date().toISOString(), source, actor: null, data };
}

test("expert account events build the local projection and reader events are ignored", async () => {
  const logger = createLogger();
  const expertProfiles = createFakeExpertProfiles();
  const processedEvents = createFakeProcessedEvents();

  const consumer = createEventConsumer({
    service: "consultation",
    logger,
    handlers: createAccountEventHandlers({ expertProfiles, logger }),
    idempotency: processedEvents,
  });

  const registered = await consumer.handle(
    sqsEvent(buildEnvelope("AccountRegistered", "lifebookz.auth", { accountId: EXPERT_A, role: "expert", email: "e@lifebookz.com", username: "expert", fullName: "Expert One" })),
  );
  assert.deepEqual(registered.batchItemFailures, []);
  assert.equal(expertProfiles.profiles.get(EXPERT_A).fullName, "Expert One");

  const readerEvent = buildEnvelope("AccountRegistered", "lifebookz.auth", { accountId: READER, role: "user", email: "r@lifebookz.com" }, "evt-2");
  await consumer.handle(sqsEvent(readerEvent, "msg-2"));
  assert.equal(expertProfiles.profiles.has(READER), false);

  await consumer.handle(sqsEvent(buildEnvelope("AccountVerificationDecided", "lifebookz.auth", { accountId: EXPERT_A, role: "expert", decision: "approved" }, "evt-3"), "msg-3"));
  assert.equal(expertProfiles.profiles.get(EXPERT_A).verification.status, "approved");
});

test("a redelivered event is skipped, so projections are not applied twice", async () => {
  const logger = createLogger();
  const expertProfiles = createFakeExpertProfiles();
  const processedEvents = createFakeProcessedEvents();

  const consumer = createEventConsumer({
    service: "consultation",
    logger,
    handlers: createAccountEventHandlers({ expertProfiles, logger }),
    idempotency: processedEvents,
  });

  const envelope = buildEnvelope("AccountRegistered", "lifebookz.auth", { accountId: EXPERT_A, role: "expert", email: "e@lifebookz.com", fullName: "First" });

  await consumer.handle(sqsEvent(envelope, "msg-1"));
  await consumer.handle(sqsEvent({ ...envelope, data: { ...envelope.data, fullName: "Second" } }, "msg-1"));

  assert.equal(expertProfiles.profiles.get(EXPERT_A).fullName, "First", "the duplicate delivery must be ignored");
  assert.equal(processedEvents.claimed.size, 1);
});

test("an unknown event type is acknowledged, never sent to the DLQ", async () => {
  const logger = createLogger();
  const expertProfiles = createFakeExpertProfiles();

  const consumer = createEventConsumer({
    service: "consultation",
    logger,
    handlers: createAccountEventHandlers({ expertProfiles, logger }),
    idempotency: createFakeProcessedEvents(),
  });

  const result = await consumer.handle(sqsEvent(buildEnvelope("StoryPublished", "lifebookz.story", {})));

  assert.deepEqual(result.batchItemFailures, []);
  assert.equal(expertProfiles.profiles.size, 0);
});

test("a handler failure is reported per message so SQS retries only that one", async () => {
  const logger = createLogger();
  const expertProfiles = createFakeExpertProfiles();
  const processedEvents = createFakeProcessedEvents();

  const consumer = createEventConsumer({
    service: "consultation",
    logger,
    handlers: {
      async AccountRegistered() {
        throw new Error("mongo unavailable");
      },
    },
    idempotency: processedEvents,
  });

  const result = await consumer.handle(sqsEvent(buildEnvelope("AccountRegistered", "lifebookz.auth", {}), "msg-9"));

  assert.deepEqual(result.batchItemFailures, [{ itemIdentifier: "msg-9" }]);
  // The claim was released, so the retry is actually processed.
  assert.equal(processedEvents.claimed.size, 0);
});
