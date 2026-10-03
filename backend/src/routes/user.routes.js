import { Router } from "express";

import upload from "../middleware/multer.js";
import { authenticate, authorize } from "../middleware/auth.js";

import * as user from "../controllers/user.controller.js";

const router = Router();

router.post("/register", upload.single("avatar"), user.register);

router.post("/login", user.login);

router.get("/me", authenticate, authorize("user"), user.getMe);

router.patch(
  "/me",
  authenticate,
  authorize("user"),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  user.updateMe,
);

router.delete("/me", authenticate, authorize("user"), user.deleteMe);

router.post("/forgot-password", user.forgotPassword);

router.post("/verify-reset-otp", user.verifyResetOTP);

router.post("/reset-password", user.resetPassword);

router.post("/logout", user.logout);

router.get("/:userId", user.getProfile);

export default router;
