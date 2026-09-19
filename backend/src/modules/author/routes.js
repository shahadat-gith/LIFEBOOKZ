import { Router } from "express";

import upload from "../../core/middlewares/multer.js";
import { authenticate, authorize } from "../../core/middlewares/auth.js";

import * as author from "./controller.js";
import * as settings from "./settings.controller.js";

const router = Router();

/* ---------- Authentication ---------- */

router.post("/register", upload.single("avatar"), author.register);

router.post("/login", author.login);

// Second step of a two-step sign-in (only when the author enabled it).
router.post("/login/verify", author.verifyLoginOtp);

/* ---------- Self-service (author role — pending authors included) ---------- */

router.get("/me", authenticate, authorize("author"), author.getMe);

router.patch(
  "/me",
  authenticate,
  authorize("author"),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
    { name: "coverImageMobile", maxCount: 1 },
  ]),
  author.updateMe,
);

router.get("/me/stories", authenticate, authorize("author"), author.getMyStories);

router.get("/me/stats", authenticate, authorize("author"), author.getMyStats);router.get("/me/stories/:storyId",
  authenticate,
  authorize("author"),
  author.getMyStory,
);

/* ---------- Preferences ---------- */

router.get("/me/settings", authenticate, authorize("author"), settings.getMe);

router.patch("/me/settings", authenticate, authorize("author"), settings.updateMe);

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
