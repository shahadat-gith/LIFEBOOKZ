import { Router } from "express";

import upload from "../../core/middlewares/multer.js";
import { authenticate, authorize } from "../../core/middlewares/auth.js";

import * as author from "./controller.js";

const router = Router();

/* ---------- Authentication ---------- */

router.post("/register", upload.single("avatar"), author.register);

router.post("/login", author.login);

/* ---------- Self-service (author role — pending authors included) ---------- */

router.get("/me", authenticate, authorize("author"), author.getMe);

router.patch(
  "/me",
  authenticate,
  authorize("author"),
  upload.single("avatar"),
  author.updateMe,
);

router.get("/me/stories", authenticate, authorize("author"), author.getMyStories);

router.get(
  "/me/stories/:storyId/status",
  authenticate,
  authorize("author"),
  author.getMyStoryStatus,
);

router.get(
  "/me/stories/:storyId",
  authenticate,
  authorize("author"),
  author.getMyStory,
);

/* ---------- Password Reset ---------- */

router.post("/forgot-password", author.forgotPassword);

router.post("/verify-reset-otp", author.verifyResetOTP);

router.post("/reset-password", author.resetPassword);

/* ---------- Logout ---------- */

router.post("/logout", author.logout);

/* ---------- Public ---------- */

router.get("/approved", author.listApproved);

router.get("/:authorId", author.getProfile);

export default router;
