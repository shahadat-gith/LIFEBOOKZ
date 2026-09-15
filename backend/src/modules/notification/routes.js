import { Router } from "express";

import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as notificationController from "./controller.js";

const router = Router();

// Every endpoint is per-account; user/author/expert each see only their own
// notifications. The recipient's model is derived from the token role, so a
// caller can never touch another account type's notifications.
router.use(authenticate);

router.get(
  "/",
  authorize("user", "author", "expert"),
  notificationController.list,
);

router.get(
  "/unread-count",
  authorize("user", "author", "expert"),
  notificationController.unreadCount,
);

router.patch(
  "/read-all",
  authorize("user", "author", "expert"),
  notificationController.markAllRead,
);

router.patch(
  "/:id/read",
  authorize("user", "author", "expert"),
  notificationController.markRead,
);

router.delete(
  "/",
  authorize("user", "author", "expert"),
  notificationController.clearAll,
);

router.delete(
  "/:id",
  authorize("user", "author", "expert"),
  notificationController.remove,
);

export default router;
