import * as notificationService from "./service.js";
import { ValidationError } from "../../core/utils/errors.js";

/**
 * GET /notifications
 * The logged-in author's notifications with unread count.
 */
export async function list(req, res, next) {
  try {
    const data = await notificationService.listNotifications({
      authorId: req.user.id,
      page: req.query.page,
      limit: req.query.limit,
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
    const count = await notificationService.getUnreadCount({
      authorId: req.user.id,
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /notifications/:notificationId/read
 */
export async function markRead(req, res, next) {
  try {
    if (!req.params.notificationId) {
      throw new ValidationError("Notification id is required.");
    }

    await notificationService.markRead({
      authorId: req.user.id,
      notificationId: req.params.notificationId,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /notifications/read-all
 */
export async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead({ authorId: req.user.id });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
