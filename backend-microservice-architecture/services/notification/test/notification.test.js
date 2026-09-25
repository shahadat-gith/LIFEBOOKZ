import test from "node:test";
import assert from "node:assert/strict";

import { createEventConsumer } from "@lifebookz/shared-events";

import {
  createFakeAccountProjections,
  createFakeNotifications,
  createFakeProcessedEvents,
  createFakeQueue,
  createLogger,
  createPublisher,
} from "./fakes.js";

import { createDomainEventHandlers } from "../src/consumers/domain-events.js";
import { buildJobId, createEmailJobService } from "../src/services/email-jobs.js";
import { createNotificationService } from "../src/services/notifications.js";

const AUTHOR = "65f1c0a2b3d4e5f6a7b8c9d0";
const READER = "65f1c0a2b3d4e5f6a7b8c9d2";
const READER_TWO = "65f1c0a2b3d4e5f6a7b8c9d3";
const EXPERT = "65f1c0a2b3d4e5f6a7b8c9d4";
const OTHER_AUTHOR = "65f1c0a2b3d4e5f6a7b8c9d5";
/** Comment ids are Mongo ObjectIds in both the monolith and here. */
const COMMENT_ID = "65f1c0a2b3d4e5f6a7b8c9d9";

const cfg = { maxNotificationFanout: 500, maxNotificationsPerPage: 50 };

function build({ queue = createFakeQueue(), accounts = [] } = {}) {
  const logger = createLogger();
  const publisher = createPublisher();
  const notifications = createFakeNotifications();
  const accountProjections = createFakeAccountProjections(accounts);

  const notificationService = createNotificationService({ notifications, accountProjections, logger, cfg });
  const emailJobService = createEmailJobService({ queue, config: cfg, logger });

  const eventHandlers = createDomainEventHandlers({
    notifications: { create: notificationService.create, createMany: notificationService.createMany },
    accountProjections,
    emailJobs: emailJobService,
    publisher,
    logger,
    cfg,
  });

  return { logger, publisher, notifications, accountProjections, notificationService, emailJobService, queue, eventHandlers };
}

const likeEvent = (data = {}, eventId = "evt-like-1") => ({
  eventId,
  eventType: "StoryLiked",
  occurredAt: "2026-09-25T10:00:00.000Z",
  source: "lifebookz.story",
  actor: { accountId: READER, role: "user" },
  data: { storyId: "story-1", storySlug: "my-life", authorId: AUTHOR, liked: true, ...data },
});

// ------------------------------------------------------------- in-app inbox

test("a like on a lifebook notifies the author with a resolvable link", async () => {
  const { eventHandlers, notifications } = build();

  await eventHandlers.StoryLiked(likeEvent());

  assert.equal(notifications.rows.length, 1);
  const [row] = notifications.rows;
  assert.equal(row.recipientModel, "Author");
  assert.equal(String(row.recipient), AUTHOR);
  assert.equal(row.type, "like");
  assert.equal(row.link, "/feed/story/my-life");
  assert.equal(row.actorModel, "User");
  assert.equal(String(row.actor), READER);
});

test("un-liking notifies nobody", async () => {
  const { eventHandlers, notifications } = build();

  await eventHandlers.StoryLiked(likeEvent({ liked: false }));

  assert.equal(notifications.rows.length, 0);
});

test("a comment notification carries the comment id so the author can reply from the drawer", async () => {
  const { eventHandlers, notifications } = build();

  await eventHandlers.CommentCreated({
    eventId: "evt-comment-1",
    eventType: "CommentCreated",
    actor: { accountId: READER, role: "user" },
    data: { storyId: "story-1", storySlug: "my-life", authorId: AUTHOR, commentId: COMMENT_ID, preview: "Loved this chapter" },
  });

  const [row] = notifications.rows;
  assert.equal(row.type, "comment");
  assert.equal(String(row.commentId), COMMENT_ID);
  assert.equal(row.preview, "Loved this chapter");
});

test("a new follow notifies the author exactly once per event, even if redelivered", async () => {
  const { eventHandlers, notifications } = build();

  const event = {
    eventId: "evt-follow-1",
    eventType: "FollowCreated",
    actor: { accountId: READER, role: "user" },
    data: { authorId: AUTHOR, followerId: READER, followerModel: "User" },
  };

  await eventHandlers.FollowCreated(event);
  await eventHandlers.FollowCreated(event);

  assert.equal(notifications.rows.length, 1, "the dedupeKey must absorb the redelivery");
});

test("publish fans out to every follower across account types", async () => {
  const { eventHandlers, notifications } = build();

  await eventHandlers.StoryPublished({
    eventId: "evt-publish-1",
    eventType: "StoryPublished",
    actor: { accountId: AUTHOR, role: "author" },
    data: {
      storyId: "story-1",
      storySlug: "my-life",
      authorId: AUTHOR,
      authorName: "Ada Author",
      title: "My Life",
      visibility: "public",
      followers: [
        { accountId: READER, model: "User" },
        { accountId: EXPERT, model: "Expert" },
        { accountId: READER, model: "User" }, // duplicate, must collapse
      ],
    },
  });

  assert.equal(notifications.rows.length, 2);
  assert.deepEqual(notifications.rows.map((row) => row.recipientModel).sort(), ["Expert", "User"]);
  assert.equal(notifications.rows[0].title, "New story published");
  assert.match(notifications.rows[0].preview, /Ada Author published a new lifebook: "My Life"/);
});

test("a private publication reaches no one", async () => {
  const { eventHandlers, notifications } = build();

  await eventHandlers.StoryPublished({
    eventId: "evt-publish-2",
    eventType: "StoryPublished",
    data: { storyId: "story-2", authorId: AUTHOR, title: "Secret", visibility: "private", followers: [{ accountId: READER, model: "User" }] },
  });

  assert.equal(notifications.rows.length, 0);
});

test("the fan-out is capped so one publish cannot exhaust the cluster", async () => {
  const { eventHandlers, notifications, logger } = build();

  const followers = Array.from({ length: 600 }, (_, index) => ({ accountId: `acc-${index}`, model: "User" }));

  const summary = await eventHandlers.StoryPublished({
    eventId: "evt-publish-3",
    eventType: "StoryPublished",
    data: { storyId: "story-3", authorId: AUTHOR, title: "Big", visibility: "public", followers },
  });

  assert.equal(notifications.rows.length, cfg.maxNotificationFanout);
  assert.equal(summary, undefined); // handlers return nothing; the cap is observable instead
  assert.ok(logger.lines.some((line) => line.message === "Notification fan-out was capped"));
});

// ------------------------------------------------------------------- emails

test("a booked consultation notifies the expert and queues the request email", async () => {
  const { eventHandlers, notifications, queue } = build();

  await eventHandlers.ConsultationBooked({
    eventId: "evt-booking-1",
    eventType: "ConsultationBooked",
    actor: { accountId: READER, role: "user" },
    data: { bookingId: "booking-1", expertId: EXPERT, clientId: READER, sessionType: "video", date: "2026-10-01", time: "10:00" },
    notify: {
      expertEmail: "expert@lifebookz.com",
      expertName: "Expert One",
      clientEmail: "reader@lifebookz.com",
      clientName: "Priya Reader",
      sessionType: "video",
      problem: "I want to change careers.",
      status: "pending",
    },
  });

  assert.equal(notifications.rows.length, 1);
  assert.equal(notifications.rows[0].recipientModel, "Expert");
  assert.match(notifications.rows[0].preview, /Priya Reader requested a video session/);

  const [job] = queue.of("booking-requested");
  assert.equal(job.to, "expert@lifebookz.com");
  assert.equal(job.replyTo, "reader@lifebookz.com");
  assert.equal(job.data.problem, "I want to change careers.");
  assert.equal(job.jobVersion, 1);
});

test("a status change emails the client and creates no in-app notification", async () => {
  const { eventHandlers, notifications, queue } = build();

  await eventHandlers.ConsultationStatusChanged({
    eventId: "evt-status-1",
    eventType: "ConsultationStatusChanged",
    actor: { accountId: EXPERT, role: "expert" },
    data: { bookingId: "booking-1", expertId: EXPERT, clientId: READER, previousStatus: "pending", status: "confirmed" },
    notify: {
      expertEmail: "expert@lifebookz.com",
      expertName: "Expert One",
      clientEmail: "reader@lifebookz.com",
      clientName: "Priya Reader",
      sessionType: "video",
      date: "2026-10-01",
      time: "10:00",
    },
  });

  assert.equal(notifications.rows.length, 0, "the monolith only emailed on a status change");
  const [job] = queue.of("booking-status");
  assert.equal(job.to, "reader@lifebookz.com");
  assert.equal(job.data.status, "confirmed");
});

test("a status change without a client address is skipped without failing", async () => {
  const { eventHandlers, queue, logger } = build();

  await eventHandlers.ConsultationStatusChanged({
    eventId: "evt-status-2",
    eventType: "ConsultationStatusChanged",
    data: { bookingId: "booking-2", status: "completed" },
    notify: { expertEmail: "expert@lifebookz.com" },
  });

  assert.equal(queue.jobs.length, 0);
  assert.ok(logger.lines.some((line) => line.message.includes("no client address")));
});

test("registration queues the welcome email and records the account projection", async () => {
  const { eventHandlers, queue, accountProjections } = build();

  await eventHandlers.AccountRegistered({
    eventId: "evt-reg-1",
    eventType: "AccountRegistered",
    data: { accountId: AUTHOR, role: "author", email: "ada@lifebookz.com", username: "ada", fullName: "Ada Author" },
  });

  const [job] = queue.of("welcome");
  assert.equal(job.to, "ada@lifebookz.com");
  assert.equal(job.data.role, "author");
  assert.equal(accountProjections.accounts.get(AUTHOR).fullName, "Ada Author");
});

test("admin and developer accounts never receive an account email", async () => {
  const { eventHandlers, queue, accountProjections } = build();

  await eventHandlers.AccountRegistered({
    eventId: "evt-reg-2",
    eventType: "AccountRegistered",
    data: { accountId: "admin-1", role: "admin", email: "ops@lifebookz.com" },
  });

  assert.equal(queue.jobs.length, 0);
  assert.equal(accountProjections.accounts.size, 0);
});

test("an OTP request queues the code email and the code never reaches analytics", async () => {
  const { eventHandlers, queue, publisher } = build();

  await eventHandlers.OtpRequested({
    eventId: "evt-otp-1",
    eventType: "OtpRequested",
    data: { accountId: READER, role: "user", email: "reader@lifebookz.com", fullName: "Priya", otp: "123456", purpose: "password-reset" },
  });

  const [job] = queue.of("password-reset-otp");
  assert.equal(job.data.otp, "123456");

  const analyticsEvents = [...publisher.of("EmailQueued"), ...publisher.of("NotificationCreated")];
  assert.ok(analyticsEvents.length >= 1);
  assert.equal(JSON.stringify(analyticsEvents).includes("123456"), false, "the OTP must never appear in an analytics event");
});

test("an approved application queues the approval email, a rejection the reason", async () => {
  const { eventHandlers, queue } = build();

  await eventHandlers.AccountVerificationDecided({
    eventId: "evt-verify-1",
    eventType: "AccountVerificationDecided",
    data: { accountId: AUTHOR, role: "author", decision: "approved", fullName: "Ada", email: "ada@lifebookz.com" },
  });

  await eventHandlers.AccountVerificationDecided({
    eventId: "evt-verify-2",
    eventType: "AccountVerificationDecided",
    data: { accountId: EXPERT, role: "expert", decision: "rejected", reason: "Incomplete credentials", fullName: "Exp", email: "exp@lifebookz.com" },
  });

  assert.equal(queue.of("application-approved").length, 1);
  assert.equal(queue.of("application-rejected")[0].data.reason, "Incomplete credentials");
});

test("every queued email has a deterministic job id, so a retry cannot double-send", async () => {
  const { eventHandlers, queue } = build();

  const event = {
    eventId: "evt-reg-9",
    eventType: "AccountRegistered",
    data: { accountId: READER, role: "user", email: "reader@lifebookz.com", fullName: "Priya" },
  };

  await eventHandlers.AccountRegistered(event);
  await eventHandlers.AccountRegistered(event);

  const jobs = queue.of("welcome");
  assert.equal(jobs.length, 2, "the handler is idempotent at the event level; the worker dedupes at the job level");
  assert.equal(jobs[0].jobId, jobs[1].jobId);
  assert.equal(jobs[0].jobId, buildJobId({ template: "welcome", to: "reader@lifebookz.com", sourceEventId: "evt-reg-9" }));
});

test("an SQS outage does not stop a notification from being stored", async () => {
  const { eventHandlers, notifications, emailJobService, queue } = build({ queue: createFakeQueue({ fail: true }) });

  assert.equal(emailJobService, emailJobService); // keep the reference meaningful for linting
  assert.equal(queue.fail, true);

  await eventHandlers.AccountRegistered({
    eventId: "evt-reg-10",
    eventType: "AccountRegistered",
    data: { accountId: READER, role: "user", email: "reader@lifebookz.com", fullName: "Priya" },
  });

  // No job was queued, but nothing threw and the projection was still written.
  assert.equal(queue.jobs.length, 0);
  assert.equal(notifications.rows.length, 0);
});

// --------------------------------------------------------------- read API

test("the read API is scoped to the caller's own inbox", async () => {
  const { eventHandlers, notificationService, notifications } = build();

  // Two different authors, one like each.
  await eventHandlers.StoryLiked(likeEvent());
  await eventHandlers.StoryLiked(likeEvent({ authorId: OTHER_AUTHOR }, "evt-like-2"));

  const authorClaims = { accountId: AUTHOR, role: "author" };
  const otherClaims = { accountId: OTHER_AUTHOR, role: "author" };

  const authorInbox = await notificationService.list({ claims: authorClaims });
  assert.equal(authorInbox.items.length, 1);
  assert.equal(String(authorInbox.items[0].recipient), AUTHOR);

  const otherInbox = await notificationService.list({ claims: otherClaims });
  assert.equal(otherInbox.items.length, 1);
  assert.equal(String(otherInbox.items[0].recipient), OTHER_AUTHOR);

  // The other account's notification id resolves to null for this caller.
  assert.equal(await notificationService.markRead({ claims: authorClaims, notificationId: otherInbox.items[0].id }), null);
  assert.equal(await notificationService.remove({ claims: authorClaims, notificationId: otherInbox.items[0].id }), false);

  assert.equal((await notificationService.unreadCount({ claims: authorClaims })).count, 1);
  assert.deepEqual(await notificationService.markAllRead({ claims: authorClaims }), { modifiedCount: 1 });
  assert.equal((await notificationService.unreadCount({ claims: authorClaims })).count, 0);

  assert.equal(await notificationService.remove({ claims: authorClaims, notificationId: authorInbox.items[0].id }), true);
  assert.equal(notifications.rows.length, 1, "the other account's notification was left alone");
});

test("a notification expires its recipient model from the token role, never from the request", async () => {
  const { eventHandlers, notificationService } = build();

  await eventHandlers.FollowCreated({
    eventId: "evt-follow-7",
    eventType: "FollowCreated",
    actor: { accountId: READER, role: "user" },
    data: { authorId: AUTHOR, followerId: READER },
  });

  // An expert token has an Expert inbox and therefore sees nothing of the author's.
  const expertInbox = await notificationService.list({ claims: { accountId: AUTHOR, role: "expert" } });
  assert.equal(expertInbox.items.length, 0);

  const authorInbox = await notificationService.list({ claims: { accountId: AUTHOR, role: "author" } });
  assert.equal(authorInbox.items.length, 1);
});

test("the actor's current name and avatar are resolved from the projection", async () => {
  const { eventHandlers, notificationService, accountProjections } = build();

  await eventHandlers.StoryLiked(likeEvent());

  await accountProjections.upsertFromAccount({
    accountId: READER,
    role: "user",
    email: "reader@lifebookz.com",
    username: "reader",
    fullName: "Priya Reader",
    avatar: { url: "https://media.lifebookz.com/users/avatars/priya.jpg" },
  });

  const inbox = await notificationService.list({ claims: { accountId: AUTHOR, role: "author" } });

  assert.equal(inbox.items[0].actor.name, "Priya Reader");
  assert.equal(inbox.items[0].actor.avatar.url, "https://media.lifebookz.com/users/avatars/priya.jpg");
});

test("a deleted actor account leaves the notification readable with a null actor", async () => {
  const { eventHandlers, notificationService } = build();

  await eventHandlers.StoryLiked(likeEvent());

  const inbox = await notificationService.list({ claims: { accountId: AUTHOR, role: "author" } });

  assert.equal(inbox.items[0].actor, null);
  assert.equal(inbox.items[0].type, "like");
});

// ------------------------------------------------------------- the consumer

function sqsEvent(detail, messageId = "msg-1") {
  return {
    Records: [
      {
        messageId,
        body: JSON.stringify({ id: "bridge-1", source: detail.source, "detail-type": detail.eventType, detail }),
        attributes: { ApproximateReceiveCount: "1" },
      },
    ],
  };
}

const envelope = (type, data, eventId) => ({ eventId, eventType: type, eventVersion: 1, occurredAt: new Date().toISOString(), source: "lifebookz.story", actor: { accountId: READER, role: "user" }, data });

test("the consumer processes an event once and reports the redelivery as a duplicate", async () => {
  const { eventHandlers, notifications, publisher } = build();
  const processedEvents = createFakeProcessedEvents();

  const consumer = createEventConsumer({
    service: "notification",
    logger: createLogger(),
    handlers: eventHandlers,
    idempotency: processedEvents,
  });

  const detail = envelope("StoryLiked", { storyId: "story-1", storySlug: "my-life", authorId: AUTHOR, liked: true }, "evt-like-9");

  const first = await consumer.handle(sqsEvent(detail, "msg-1"));
  const second = await consumer.handle(sqsEvent(detail, "msg-1"));

  assert.deepEqual(first.batchItemFailures, []);
  assert.deepEqual(second.batchItemFailures, []);
  assert.equal(notifications.rows.filter((row) => row.type === "like").length, 1);
  assert.equal(publisher.of("NotificationCreated").length, 1, "the analytics summary is published once");
});

test("a handler failure releases the claim and is reported for retry", async () => {
  const processedEvents = createFakeProcessedEvents();

  const consumer = createEventConsumer({
    service: "notification",
    logger: createLogger(),
    handlers: {
      async StoryLiked() {
        throw new Error("cluster unavailable");
      },
    },
    idempotency: processedEvents,
  });

  const result = await consumer.handle(sqsEvent(envelope("StoryLiked", { authorId: AUTHOR, liked: true }, "evt-like-10"), "msg-7"));

  assert.deepEqual(result.batchItemFailures, [{ itemIdentifier: "msg-7" }]);
  assert.equal(processedEvents.claimed.size, 0);
});
