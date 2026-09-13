import { Router } from "express";

import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as notification from "./controller.js";

const router = Router();

const authorOnly = [authenticate, authorize("author")];

router.get("/", authorOnly, notification.list);

router.get("/unread-count", authorOnly, notification.unreadCount);

router.post("/read-all", authorOnly, notification.markAllRead);

router.patch("/:notificationId/read", authorOnly, notification.markRead);

export default router;
