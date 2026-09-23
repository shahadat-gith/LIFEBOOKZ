import { Router } from "express";

import upload from "../../core/middlewares/multer.js";
import { authenticate, authorize, optionalAuthenticate } from "../../core/middlewares/auth.js";

import * as author from "./controller.js";

const router = Router();

router.post("/register", upload.single("avatar"), author.register);

router.post("/login", author.login);

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

router.post("/forgot-password", author.forgotPassword);

router.post("/verify-reset-otp", author.verifyResetOTP);

router.post("/reset-password", author.resetPassword);

router.post("/logout", author.logout);

router.get("/approved", author.listApproved);

// Public profile. Optional auth personalises it for a signed-in reader or
// author (do I follow this author?) without blocking an anonymous visitor.
router.get("/:authorId", optionalAuthenticate, author.getProfile);

export default router;
