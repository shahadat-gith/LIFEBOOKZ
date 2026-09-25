import { MODEL_BY_ROLE } from "../repositories/notifications.js";

/** Roles that receive account emails. Admin/developer are env-credential accounts. */
const ACCOUNT_ROLES = ["user", "author", "expert"];

const actorFrom = (event) =>
  event.actor?.accountId ? { id: String(event.actor.accountId), model: MODEL_BY_ROLE[event.actor.role] || "User" } : null;

const link = (storyIdOrSlug) => (storyIdOrSlug ? `/feed/story/${storyIdOrSlug}` : "");

/**
 * Every notification and every email in LifeBookz is decided here.
 *
 * This is the whole point of the Notification service: the business services
 * publish *what happened*, and this consumer decides *who should know*, writes
 * the in-app row in its own database and queues the email job. Nothing else may
 * write a notification, and no service talks to SES from a request path.
 *
 * Two aggregate events (`NotificationCreated`, `EmailQueued`) go back to the bus
 * for analytics. They are per-handler-run summaries (with a `created` count and
 * the subject id) rather than one event per recipient: a publish fan-out to 500
 * followers must not become 500 EventBridge calls. Neither summary carries PII.
 */
export function createDomainEventHandlers({ notifications, accountProjections, emailJobs, publisher, logger, cfg }) {
  const recipient = (id, model) => (id ? { id: String(id), model } : null);

  /** Analytics summary for whatever this handler just did. */
  async function announce({ type, created = 0, subjectId, template, queued = false, sourceEventType }) {
    await publisher?.publishSafely({
      type: "NotificationCreated",
      data: { notificationType: type, created, subjectId: subjectId || null, sourceEventType },
    });

    if (template) {
      await publisher?.publishSafely({
        type: "EmailQueued",
        data: { template, queued, subjectId: subjectId || null, sourceEventType },
      });
    }
  }

  return {
    // ------------------------------------------------------------- accounts
    /**
     * Keeps the recipient/actor read model fresh and sends the welcome email.
     *
     * The monolith sent this synchronously inside the registration handler; here
     * it is a queued job, so a slow SES call cannot delay sign-up.
     */
    async AccountRegistered(event) {
      const { accountId, role, email, username, fullName } = event.data;

      if (!ACCOUNT_ROLES.includes(role)) return;

      await accountProjections.upsertFromAccount({ accountId, role, email, username, fullName });

      const queued = await emailJobs.queueEmail({
        template: "welcome",
        to: email,
        toName: fullName,
        data: { name: fullName, role },
        sourceEventId: event.eventId,
      });

      await announce({ type: "system", created: 0, subjectId: accountId, template: "welcome", queued: Boolean(queued), sourceEventType: event.eventType });

      logger?.info?.("Welcome email queued", { accountId, role, eventId: event.eventId, queued: Boolean(queued) });
    },

    async AccountProfileUpdated(event) {
      const { accountId, role, fullName, username, email, avatar } = event.data;

      if (!ACCOUNT_ROLES.includes(role)) return;

      await accountProjections.syncIdentity({ accountId, role, fullName, username, email, avatar: avatar || undefined });
    },

    /**
     * The admin decision on an author/expert application: email only, exactly
     * like the existing backend's `sendApplicationApproved` / `Rejected`.
     */
    async AccountVerificationDecided(event) {
      const { accountId, role, decision, reason, fullName, email } = event.data;

      if (!["author", "expert"].includes(role)) return;

      await accountProjections.syncIdentity({ accountId, fullName, email, role });

      const template = decision === "approved" ? "application-approved" : "application-rejected";

      const queued = await emailJobs.queueEmail({
        template,
        to: email,
        toName: fullName,
        data: { name: fullName, role, reason: reason || "" },
        sourceEventId: event.eventId,
      });

      await announce({ type: "system", created: 0, subjectId: accountId, template, queued: Boolean(queued), sourceEventType: event.eventType });

      logger?.info?.("Application decision email queued", { accountId, decision, role, eventId: event.eventId });
    },

    /** A password-reset OTP: the only event that carries a one-time code. */
    async OtpRequested(event) {
      const { accountId, role, email, fullName, otp, purpose } = event.data;

      if (purpose !== "password-reset") return;

      const queued = await emailJobs.queueEmail({
        template: "password-reset-otp",
        to: email,
        toName: fullName,
        data: { otp, role, name: fullName },
        sourceEventId: event.eventId,
      });

      // The code itself never leaves the job payload; the analytics event only
      // records that an OTP email was queued.
      await announce({ type: "system", created: 0, subjectId: accountId, template: "password-reset-otp", queued: Boolean(queued), sourceEventType: event.eventType });

      logger?.info?.("OTP email queued", { accountId, role, purpose, eventId: event.eventId });
    },

    // ---------------------------------------------------------------- story
    async StoryLiked(event) {
      const { authorId, storyId, storySlug, liked } = event.data;

      // Un-liking notifies nobody; the monolith behaved the same way.
      if (!liked || !authorId) return;

      await notifications.create({
        recipient: recipient(authorId, "Author"),
        type: "like",
        actor: actorFrom(event),
        preview: "liked your lifebook",
        link: link(storySlug || storyId),
        dedupeKey: `${event.eventId}:like`,
      });

      await announce({ type: "like", created: 1, subjectId: storyId, sourceEventType: event.eventType });
    },

    async CommentCreated(event) {
      const { authorId, commentId, storyId, storySlug, preview } = event.data;

      if (!authorId) return;

      await notifications.create({
        recipient: recipient(authorId, "Author"),
        type: "comment",
        actor: actorFrom(event),
        preview: preview || "commented on your lifebook",
        link: link(storySlug || storyId),
        // Lets the author reply to this comment from the drawer.
        commentId,
        dedupeKey: `${event.eventId}:comment`,
      });

      await announce({ type: "comment", created: 1, subjectId: storyId, sourceEventType: event.eventType });
    },

    async FollowCreated(event) {
      const { authorId, followerId } = event.data;

      if (!authorId || String(authorId) === String(followerId)) return;

      await notifications.create({
        recipient: recipient(authorId, "Author"),
        type: "follow",
        actor: actorFrom(event),
        preview: "started following you",
        dedupeKey: `${event.eventId}:follow`,
      });

      await announce({ type: "follow", created: 1, subjectId: authorId, sourceEventType: event.eventType });
    },

    /**
     * Publish fan-out to the author's followers.
     *
     * Story owns the follow graph, so it resolves the recipient list from its own
     * data and puts it in the event — "the information consumers need" instead of
     * a cross-service lookup. The monolith did this in-process, which cannot work
     * across services; `cfg.maxNotificationFanout` exists because an EventBridge
     * event is capped at 256 KB.
     */
    async StoryPublished(event) {
      const { storyId, storySlug, authorId, authorName, title, visibility, followers } = event.data;

      if (visibility && visibility !== "public") return;

      const summary = await notifications.createMany({
        recipients: (followers || []).map((follower) => recipient(follower.accountId, follower.model)),
        type: "publish",
        actor: recipient(authorId, "Author"),
        title: "New story published",
        preview: `${authorName || "An author"} published a new lifebook: "${title}"`,
        link: link(storySlug || storyId),
        dedupeKey: event.eventId,
      });

      await announce({ type: "publish", created: summary.created, subjectId: storyId, sourceEventType: event.eventType });

      logger?.info?.("Publish fan-out complete", { storyId, ...summary, eventId: event.eventId });
    },

    // --------------------------------------------------------- consultation
    async ConsultationBooked(event) {
      const { bookingId, expertId, sessionType, date, time, category } = event.data;
      const notify = event.notify || {};

      await notifications.create({
        recipient: recipient(expertId, "Expert"),
        type: "booking",
        actor: actorFrom(event),
        title: "New consultation request",
        preview: `${notify.clientName || "A client"} requested a ${sessionType || "video"} session.`,
        dedupeKey: `${event.eventId}:booking`,
      });

      const queued = await emailJobs.queueEmail({
        template: "booking-requested",
        to: notify.expertEmail,
        toName: notify.expertName,
        // The expert can reply straight to the client.
        replyTo: notify.clientEmail || undefined,
        data: {
          expertName: notify.expertName,
          clientName: notify.clientName,
          clientEmail: notify.clientEmail,
          sessionType,
          date,
          time,
          category: category || null,
          problem: notify.problem,
        },
        sourceEventId: event.eventId,
      });

      await announce({ type: "booking", created: 1, subjectId: bookingId, template: "booking-requested", queued: Boolean(queued), sourceEventType: event.eventType });

      logger?.info?.("Booking notification handled", { bookingId, expertId, eventId: event.eventId, emailQueued: Boolean(queued) });
    },

    /**
     * The expert changed the booking status: email the client.
     *
     * No in-app notification — the existing backend only emailed on a status
     * change, and this architecture does not invent recipient behaviour the
     * product never had.
     */
    async ConsultationStatusChanged(event) {
      const { bookingId, status, sessionType, date, time } = event.data;
      const notify = event.notify || {};

      if (!notify.clientEmail) {
        logger?.warn?.("Status email skipped — the booking has no client address", { bookingId, status });
        return;
      }

      const queued = await emailJobs.queueEmail({
        template: "booking-status",
        to: notify.clientEmail,
        toName: notify.clientName,
        data: {
          clientName: notify.clientName,
          expertName: notify.expertName,
          status,
          sessionType,
          date,
          time,
        },
        sourceEventId: event.eventId,
      });

      await announce({ type: "booking", created: 0, subjectId: bookingId, template: "booking-status", queued: Boolean(queued), sourceEventType: event.eventType });
    },

    /**
     * A cancellation summary.
     *
     * The monolith's `cancelMyBooking` notified nobody and emailed nobody, so
     * nothing is sent here either. The handler makes that deliberate no-op
     * explicit and logged instead of leaving the event silently unhandled.
     */
    async ConsultationCancelled(event) {
      logger?.info?.("Consultation cancellation acknowledged (no recipient action by design)", {
        bookingId: event.data?.bookingId,
        eventId: event.eventId,
      });
    },
  };
}
