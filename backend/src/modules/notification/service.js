import Notification from "./model.js";

/**
 * Creates a notification. Best-effort: never throws to the caller so a
 * notification failure can't break the primary action (like/comment/follow).
 */
export async function createNotification({
  recipient,
  type,
  actor = null,
  actorModel = "User",
  actorName = "",
  actorAvatar = "",
  story = null,
  storySlug = "",
  preview = "",
}) {
  try {
    if (!recipient || !type) return null;

    // Don't notify yourself
    if (
      actor &&
      actorModel === "Author" &&
      actor.toString() === recipient.toString()
    ) {
      return null;
    }

    return Notification.create({
      recipient,
      type,
      actor,
      actorModel,
      actorName,
      actorAvatar,
      story,
      storySlug,
      preview,
    });
  } catch {
    return null;
  }
}

export async function listNotifications({ authorId, page = 1, limit = 20 }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Number(limit) || 20, 50);

  const [notifications, total, unread] = await Promise.all([
    Notification.find({ recipient: authorId })
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),

    Notification.countDocuments({ recipient: authorId }),

    Notification.countDocuments({ recipient: authorId, read: false }),
  ]);

  return {
    notifications,
    unread,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

export async function getUnreadCount({ authorId }) {
  return Notification.countDocuments({ recipient: authorId, read: false });
}

export async function markRead({ authorId, notificationId }) {
  await Notification.updateOne(
    { _id: notificationId, recipient: authorId },
    { $set: { read: true } },
  );
}

export async function markAllRead({ authorId }) {
  await Notification.updateMany(
    { recipient: authorId, read: false },
    { $set: { read: true } },
  );
}
