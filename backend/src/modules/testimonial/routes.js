import { Router } from "express";

import { authenticate, authorize } from "../../core/middlewares/auth.js";
import * as testimonial from "./controller.js";

const router = Router();

// Public — anyone (even guests) can read approved testimonials.
router.get("/", testimonial.list);

router.post("/", authenticate, authorize("user", "author", "expert"), testimonial.create);

// Signed-in — the caller's own testimonial.
router.get(
  "/me",
  authenticate,
  authorize("user", "author", "expert"),
  testimonial.mine,
);

router.delete(
  "/:id",
  authenticate,
  authorize("user", "author", "expert", "admin"),
  testimonial.remove,
);

// Admin moderation.
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  testimonial.moderate,
);

export default router;
