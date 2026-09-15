import { Router } from "express";

import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as testimony from "./controller.js";

const router = Router();

// Public — anyone (even guests) can read approved testimonials.
router.get("/", testimony.list);

router.post("/", authenticate, authorize("user", "author", "expert"), testimony.create);

// Signed-in — the caller's own testimonial.
router.get(
  "/me",
  authenticate,
  authorize("user", "author", "expert"),
  testimony.mine,
);

router.delete(
  "/:id",
  authenticate,
  authorize("user", "author", "expert", "admin"),
  testimony.remove,
);

// Admin moderation.
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  testimony.moderate,
);

export default router;
