import * as notificationService from "./service.js";

const MODEL_BY_ROLE = { user: "User", author: "Author", expert: "Expert" };

function recipientFromReq(req) {
  const model = MODEL_BY_ROLE[req.role];
  if (!model || !req.user?.id) return null;
  return { id: req.user.id, model };
}

/**
 * GET /notifications
 * List the caller's notifications (newest first, cursor paginated).
 */
export async function list(req, res, next) {
  try {
    const rec = recipientFromReq(req);
    if (!rec) {
      return res
        .status(401)
        .json({ success: false, message: "Sign in required." });
    }

    const data = await notificationService.listNotifications({
      recipientId: rec.id,
      recipientModel: rec.model,
      limit: req.query.limit,
      before: req.query.before,
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /notifications/unread-count
 */
export async function unreadCount(req, res, next) {
  try {
    const rec = recipientFromReq(req);
    if (!rec) {
      return res
        .status(401)
        .json({ success: false, message: "Sign in required." });
    }

    const count = await notificationService.getUnreadCount({
      recipientId: rec.id,
      recipientModel: rec.model,
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /notifications/:id/read
 */
export async function markRead(req, res, next) {
  try {
    const rec = recipientFromReq(req);
    if (!rec) {
      return res
        .status(401)
        .json({ success: false, message: "Sign in required." });
    }

    const updated = await notificationService.markRead({
      recipientId: rec.id,
      recipientModel: rec.model,
      notificationId: req.params.id,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /notifications/read-all
 */
export async function markAllRead(req, res, next) {
  try {
    const rec = recipientFromReq(req);
    if (!rec) {
      return res
        .status(401)
        .json({ success: false, message: "Sign in required." });
    }

    const result = await notificationService.markAllRead({
      recipientId: rec.id,
      recipientModel: rec.model,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /notifications/:id
 */
export async function remove(req, res, next) {
  try {
    const rec = recipientFromReq(req);
    if (!rec) {
      return res
        .status(401)
        .json({ success: false, message: "Sign in required." });
    }

    const deleted = await notificationService.deleteNotification({
      recipientId: rec.id,
      recipientModel: rec.model,
      notificationId: req.params.id,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });
    }

    res.json({ success: true, message: "Notification deleted." });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /notifications
 * Clear every notification for the caller.
 */
export async function clearAll(req, res, next) {
  try {
    const rec = recipientFromReq(req);
    if (!rec) {
      return res
        .status(401)
        .json({ success: false, message: "Sign in required." });
    }

    const result = await notificationService.clearAllNotifications({
      recipientId: rec.id,
      recipientModel: rec.model,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
