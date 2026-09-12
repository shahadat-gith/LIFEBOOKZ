import { Router } from "express";

import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as developer from "./controller.js";

const router = Router();

/* ---------- Authentication ---------- */

router.post("/login", developer.login);

router.post("/logout", developer.logout);

/* ---------- Session ---------- */

router.get("/me", authenticate, authorize("developer"), developer.getMe);

/* ---------- Logs ---------- */

router.get(
  "/logs/stats",
  authenticate,
  authorize("developer"),
  developer.getStats,
);

router.get("/logs", authenticate, authorize("developer"), developer.getLogs);

router.delete(
  "/logs",
  authenticate,
  authorize("developer"),
  developer.clearLogs,
);

export default router;
