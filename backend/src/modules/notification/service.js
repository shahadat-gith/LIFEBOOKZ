import Notification from "./model.js";
import mongoose from "mongoose";

const isValidId = (v) => mongoose.isValidObjectId(v);

function normalizeRecipient(recipient) {
  return {
    id: isValidId(recipient.id) ? recipient.id : null,
    model: ["User", "Author", "Expert"].includes(recipient.model)
      ? recipient.model
      : null,
  };
}

/**
 * Create one notification.
 * @param {Object} params
 * @param {Object} params.recipient   { id, model: "User"|"Author"|"Expert" }
 * @param {String} params.type        one of NOTIFICATION_TYPES
 * @param {Object} [params.actor]     { id, model, name, avatar } — optional for system
 * @param {String} [params.title]
 * @param {String} [params.preview]
 * @param {String} [params.link]      in-app route
 */
export async function createNotification({
  recipient,
  type,
  actor,
  title = "",
  preview = "",
  link = "",
}) {
  const rec = normalizeRecipient(recipient || {});
  if (!rec.id || !rec.model) return null;

  const actorModel =
    actor?.id && ["User", "Author", "Expert"].includes(actor?.model)
      ? actor.model
      : actor?.id
        ? "System"
        : "User"; // keep enum valid; actor stays null for system

  const doc = await Notification.create({
    recipient: rec.id,
    recipientModel: rec.model,
    type,
    actor: actor?.id && actor?.model ? actor.id : null,
    actorModel: actor?.id && actor?.model ? actorModel : "System",
    actorName: actor?.name?.trim() || "",
    actorAvatar: actor?.avatar || "",
    title: String(title).slice(0, 120),
    preview: String(preview || "").slice(0, 300),
    link: String(link || ""),
  });

  return doc;
}

/**
 * Fire the same notification to many recipients of mixed account types.
 * Best-effort: never throws (notification failure must not break the main flow).
 */
export async function createNotificationsForMany(recipients, payload) {
  if (!Array.isArray(recipients) || recipients.length === 0) return;
  try {
    await Promise.all(
      recipients.map((r) => createNotification({ ...payload, recipient: r })),
    );
  } catch (err) {
    console.error("notification batch failed:", err?.message || err);
  }
}

/** Wrap createNotification so emit failures never break the caller's flow. */
export async function emitNotification(params) {
  try {
    return await createNotification(params);
  } catch (err) {
    console.error("notification emit failed:", err?.message || err);
    return null;
  }
}

/**
 * List notifications for a recipient with a since-cursor for pagination.
 */
export async function listNotifications({
  recipientId,
  recipientModel,
  limit = 20,
  before,
}) {
  const rec = normalizeRecipient({ id: recipientId, model: recipientModel });
  if (!rec.id || !rec.model) {
    return { items: [], nextBefore: null };
  }

  const query = { recipient: rec.id, recipientModel: rec.model };
  if (before && isValidId(before)) {
    query.createdAt = {
      $lt: new mongoose.Types.ObjectId(before).getTimestamp(),
    };
  }

  const items = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 20, 50))
    .lean();

  const nextBefore =
    items.length === Math.min(Number(limit) || 20, 50)
      ? items[items.length - 1]._id.toString()
      : null;

  return {
    items: items.map((n) => ({
      ...n,
      id: n._id,
      actor: n.actor
        ? { id: n.actor, name: n.actorName, avatar: n.actorAvatar }
        : null,
    })),
    nextBefore,
  };
}

export async function getUnreadCount({ recipientId, recipientModel }) {
  const rec = normalizeRecipient({ id: recipientId, model: recipientModel });
  if (!rec.id || !rec.model) return 0;
  return Notification.countDocuments({
    recipient: rec.id,
    recipientModel: rec.model,
    read: false,
  });
}

export async function markRead({
  recipientId,
  recipientModel,
  notificationId,
}) {
  const rec = normalizeRecipient({ id: recipientId, model: recipientModel });
  if (!rec.id || !rec.model) return null;

  if (notificationId && isValidId(notificationId)) {
    return Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: rec.id,
        recipientModel: rec.model,
      },
      { read: true },
      { new: true },
    );
  }
  return null;
}

export async function markAllRead({ recipientId, recipientModel }) {
  const rec = normalizeRecipient({ id: recipientId, model: recipientModel });
  if (!rec.id || !rec.model) return { modifiedCount: 0 };
  const res = await Notification.updateMany(
    { recipient: rec.id, recipientModel: rec.model, read: false },
    { read: true },
  );
  return { modifiedCount: res.modifiedCount };
}

export async function deleteNotification({
  recipientId,
  recipientModel,
  notificationId,
}) {
  const rec = normalizeRecipient({ id: recipientId, model: recipientModel });
  if (!rec.id || !rec.model || !isValidId(notificationId)) return null;
  return Notification.findOneAndDelete({
    _id: notificationId,
    recipient: rec.id,
    recipientModel: rec.model,
  });
}

export async function clearAllNotifications({ recipientId, recipientModel }) {
  const rec = normalizeRecipient({ id: recipientId, model: recipientModel });
  if (!rec.id || !rec.model) return { deletedCount: 0 };
  const res = await Notification.deleteMany({
    recipient: rec.id,
    recipientModel: rec.model,
  });
  return { deletedCount: res.deletedCount };
}
