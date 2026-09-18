import { Router } from "express";

import upload from "../../core/middlewares/multer.js";
import { authenticate, authorize } from "../../core/middlewares/auth.js";

import * as user from "./controller.js";

const router = Router();

/* ---------- Authentication ---------- */

router.post("/register", upload.single("avatar"), user.register);

router.post("/login", user.login);

/* ---------- Profile ---------- */

router.get("/me", authenticate, authorize("user"), user.getMe);

router.patch(
  "/me",
  authenticate,
  authorize("user"),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
    { name: "coverImageMobile", maxCount: 1 },
  ]),
  user.updateMe,
);

router.delete("/me", authenticate, authorize("user"), user.deleteMe);

/* ---------- Password Reset ---------- */

router.post("/forgot-password", user.forgotPassword);

router.post("/verify-reset-otp", user.verifyResetOTP);

router.post("/reset-password", user.resetPassword);

/* ---------- Logout ---------- */

router.post("/logout", user.logout);

/* ---------- Public ---------- */

router.get("/:userId", user.getProfile);

export default router;
