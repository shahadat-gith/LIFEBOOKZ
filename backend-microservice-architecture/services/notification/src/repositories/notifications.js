import mongoose from "mongoose";

import { AccountProjection } from "../models/account-projection.js";
import { Notification } from "../models/notification.js";
import { ProcessedEvent } from "../models/processed-event.js";

const isValidId = (value) => mongoose.isValidObjectId(value);

const RECIPIENT_MODELS = ["User", "Author", "Expert"];
const ACTOR_MODELS = [...RECIPIENT_MODELS, "System"];

/** Map a JWT role onto the account model the API exposes. */
export const MODEL_BY_ROLE = { user: "User", author: "Author", expert: "Expert" };

export function recipientFromClaims(claims) {
  const model = MODEL_BY_ROLE[claims?.role];

  if (!model || !claims?.accountId) return null;

  return { id: claims.accountId, model };
}

/** Idempotency store for the event consumer. */
export function createProcessedEventStore() {
  return {
    async claim(eventId, meta = {}) {
      try {
        await ProcessedEvent.create({
          eventId,
          eventType: meta.eventType || "unknown",
          source: meta.source || "",
          sqsMessageId: meta.sqsMessageId || "",
        });

        return true;
      } catch (error) {
        if (error?.code === 11000) return false;
        throw error;
      }
    },

    async release(eventId) {
      await ProcessedEvent.deleteOne({ eventId });
    },
  };
}

export function createAccountProjectionRepository() {
  return {
    async upsertFromAccount({ accountId, role, email, username, fullName }) {
      return AccountProjection.findOneAndUpdate(
        { _id: accountId },
        { $set: { role, email, username, fullName } },
        { new: true, upsert: true },
      ).lean();
    },

    async syncIdentity({ accountId, fullName, username, email, avatar, role }) {
      const patch = {};

      if (fullName !== undefined) patch.fullName = fullName;
      if (username !== undefined) patch.username = username;
      if (email !== undefined) patch.email = email;
      if (avatar !== undefined && avatar && (avatar.key || avatar.url)) patch.avatar = avatar;
      if (role !== undefined) patch.role = role;

      if (Object.keys(patch).length === 0) return null;

      return AccountProjection.findOneAndUpdate({ _id: accountId }, { $set: patch }, { new: true }).lean();
    },

    async findById(accountId) {
      if (!isValidId(accountId)) return null;
      return AccountProjection.findById(accountId).lean();
    },

    async findManyByIds(ids = []) {
      const valid = ids.filter(isValidId);
      if (valid.length === 0) return [];

      return AccountProjection.find({ _id: { $in: valid } }).lean();
    },
  };
}

export function createNotificationRepository({ maxPerPage = 50 } = {}) {
  return {
    /**
     * Insert, ignoring a duplicate `dedupeKey`.
     *
     * @returns {Promise<object|null>} the created row, or null when this exact
     *          notification already existed (event redelivery).
     */
    async create(doc) {
      try {
        const created = await Notification.create(doc);
        return created.toObject();
      } catch (error) {
        if (error?.code === 11000 && doc.dedupeKey) return null;
        throw error;
      }
    },

    async list({ recipientId, recipientModel, limit = 20, before }) {
      const safeLimit = Math.min(Number(limit) || 20, maxPerPage);
      const query = { recipient: recipientId, recipientModel };

      // Cursor pagination on the (sortable) ObjectId, exactly like the
      // existing backend: `before` is the id of the last row already seen.
      if (before && isValidId(before)) {
        query._id = { $lt: new mongoose.Types.ObjectId(before) };
      }

      const items = await Notification.find(query).sort({ createdAt: -1 }).limit(safeLimit).lean();

      return {
        items,
        hasMore: items.length === safeLimit,
        nextBefore: items.length === safeLimit ? String(items[items.length - 1]._id) : null,
      };
    },

    async unreadCount({ recipientId, recipientModel }) {
      return Notification.countDocuments({ recipient: recipientId, recipientModel, read: false });
    },

    async markRead({ recipientId, recipientModel, notificationId }) {
      if (!isValidId(notificationId)) return null;

      return Notification.findOneAndUpdate(
        { _id: notificationId, recipient: recipientId, recipientModel },
        { $set: { read: true } },
        { new: true },
      ).lean();
    },

    async markAllRead({ recipientId, recipientModel }) {
      const result = await Notification.updateMany(
        { recipient: recipientId, recipientModel, read: false },
        { $set: { read: true } },
      );

      return { modifiedCount: result.modifiedCount };
    },

    async remove({ recipientId, recipientModel, notificationId }) {
      if (!isValidId(notificationId)) return false;

      const result = await Notification.deleteOne({ _id: notificationId, recipient: recipientId, recipientModel });

      return result.deletedCount === 1;
    },

    async clear({ recipientId, recipientModel }) {
      const result = await Notification.deleteMany({ recipient: recipientId, recipientModel });

      return { deletedCount: result.deletedCount };
    },
  };
}

export { ACTOR_MODELS, RECIPIENT_MODELS, isValidId };
