import { validationError } from "@lifebookz/shared-errors";

import { ACTOR_MODELS, MODEL_BY_ROLE, isValidId, recipientFromClaims } from "../repositories/notifications.js";

/**
 * In-app notifications.
 *
 * Same read API and the same response shape as the existing backend, including
 * the actor being resolved from the account's *current* name and avatar rather
 * than a copy taken when the notification was written.
 *
 * Only one writer creates notifications now: the event consumer. Business
 * services no longer insert rows in another service's database — Story and
 * Consultation publish domain events and this service decides what the
 * recipient should see.
 */
export function createNotificationService({ notifications, accountProjections, logger, cfg }) {
  function requireRecipient(claims) {
    const recipient = recipientFromClaims(claims);

    if (!recipient) throw validationError("This account type has no notification inbox.");

    return recipient;
  }

  return {
    /**
     * Create one notification. `dedupeKey` makes it idempotent.
     */
    async create({ recipient, type, actor, title = "", preview = "", link = "", commentId = null, dedupeKey = null }) {
      if (!recipient?.id || !ACTOR_MODELS.includes(recipient.model)) return null;

      return notifications.create({
        recipient: recipient.id,
        recipientModel: recipient.model,
        type,
        actor: actor?.id || null,
        actorModel: actor?.id && ACTOR_MODELS.includes(actor.model) ? actor.model : "System",
        title: String(title).slice(0, 120),
        preview: String(preview || "").slice(0, 300),
        link: String(link || ""),
        commentId: isValidId(commentId) ? commentId : null,
        dedupeKey,
      });
    },

    /**
     * Fan-out to many recipients of mixed account types.
     *
     * Returns a summary instead of throwing: one bad recipient must not stop
     * the rest, and the caller is an event handler whose failure would send a
     * good message to the DLQ.
     */
    async createMany({ recipients = [], ...payload }) {
      const unique = new Map();

      for (const recipient of recipients) {
        if (recipient?.id && ACTOR_MODELS.includes(recipient.model)) {
          unique.set(`${recipient.model}:${recipient.id}`, recipient);
        }
      }

      const capped = [...unique.values()].slice(0, cfg.maxNotificationFanout);
      const results = await Promise.allSettled(
        capped.map((recipient) =>
          this.create({
            ...payload,
            recipient,
            // A publish fan-out is keyed per recipient so a retry is idempotent.
            dedupeKey: payload.dedupeKey ? `${payload.dedupeKey}:${recipient.model}:${recipient.id}` : null,
          }),
        ),
      );

      const created = results.filter((result) => result.status === "fulfilled" && result.value).length;
      const skipped = results.length - created;

      if (recipients.length > capped.length) {
        logger?.warn?.("Notification fan-out was capped", {
          requested: recipients.length,
          processed: capped.length,
          cap: cfg.maxNotificationFanout,
        });
      }

      return { requested: recipients.length, created, skipped };
    },

    /** The caller's notifications, newest first, with the actor resolved. */
    async list({ claims, limit, before }) {
      const recipient = requireRecipient(claims);

      const page = await notifications.list({
        recipientId: recipient.id,
        recipientModel: recipient.model,
        limit,
        before,
      });

      const actorIds = page.items.map((item) => item.actor).filter(Boolean);
      const projections = await accountProjections.findManyByIds(actorIds);
      const byId = new Map(projections.map((account) => [String(account._id), account]));

      const items = page.items.map((item) => {
        const account = item.actor ? byId.get(String(item.actor)) : null;

        return {
          ...item,
          id: String(item._id),
          actor: account
            ? {
                id: String(account._id),
                name: account.fullName || account.username || "",
                avatar: account.avatar?.url ? { url: account.avatar.url } : null,
              }
            : null,
        };
      });

      return { items, nextBefore: page.nextBefore, hasMore: page.hasMore };
    },

    async unreadCount({ claims }) {
      const recipient = requireRecipient(claims);

      return { count: await notifications.unreadCount({ recipientId: recipient.id, recipientModel: recipient.model }) };
    },

    async markRead({ claims, notificationId }) {
      const recipient = requireRecipient(claims);

      const updated = await notifications.markRead({
        recipientId: recipient.id,
        recipientModel: recipient.model,
        notificationId,
      });

      return updated ? { ...updated, id: String(updated._id) } : null;
    },

    async markAllRead({ claims }) {
      const recipient = requireRecipient(claims);

      return notifications.markAllRead({ recipientId: recipient.id, recipientModel: recipient.model });
    },

    async remove({ claims, notificationId }) {
      const recipient = requireRecipient(claims);

      return notifications.remove({
        recipientId: recipient.id,
        recipientModel: recipient.model,
        notificationId,
      });
    },

    async clearAll({ claims }) {
      const recipient = requireRecipient(claims);

      return notifications.clear({ recipientId: recipient.id, recipientModel: recipient.model });
    },
  };
}

export { MODEL_BY_ROLE };
