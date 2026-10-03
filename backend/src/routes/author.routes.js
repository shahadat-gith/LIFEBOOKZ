import { Router } from "express";

import upload from "../middleware/multer.js";
import { authenticate, authorize, optionalAuthenticate } from "../middleware/auth.js";

import * as author from "../controllers/author.controller.js";

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

// Public profile, readable by anonymous visitors too.
router.get("/:authorId", optionalAuthenticate, author.getProfile);

export default router;
