import { Router } from "express";

import upload from "../../core/middlewares/multer.js";
import { authenticate, authorize } from "../../core/middlewares/auth.js";

import * as expert from "./controller.js";

const router = Router();

/* ---------- Authentication ---------- */

router.post("/register", upload.single("avatar"), expert.register);

router.post("/login", expert.login);

/* ---------- Self-service (expert role — pending experts included) ---------- */

router.get("/me", authenticate, authorize("expert"), expert.getMe);

router.patch(
  "/me",
  authenticate,
  authorize("expert"),
  upload.single("avatar"),
  expert.updateMe,
);

/* ---------- Bookings ---------- */

router.get("/me/bookings", authenticate, authorize("expert"), expert.getMyBookings);

router.patch(
  "/me/bookings/:bookingId",
  authenticate,
  authorize("expert"),
  expert.updateBookingStatus,
);

/* ---------- Password Reset ---------- */

router.post("/forgot-password", expert.forgotPassword);

router.post("/verify-reset-otp", expert.verifyResetOTP);

router.post("/reset-password", expert.resetPassword);

/* ---------- Logout ---------- */

router.post("/logout", expert.logout);

/* ---------- Public ---------- */

router.get("/:expertId", expert.getProfile);

export default router;
