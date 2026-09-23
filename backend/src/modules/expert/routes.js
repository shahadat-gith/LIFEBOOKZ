import { Router } from "express";

import upload from "../../core/middlewares/multer.js";
import { authenticate, authorize } from "../../core/middlewares/auth.js";

import * as expert from "./controller.js";

const router = Router();

router.post("/register", upload.single("avatar"), expert.register);

router.post("/login", expert.login);

router.get("/me", authenticate, authorize("expert"), expert.getMe);

router.patch(
  "/me",
  authenticate,
  authorize("expert"),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
    { name: "coverImageMobile", maxCount: 1 },
  ]),
  expert.updateMe,
);

router.get("/me/bookings", authenticate, authorize("expert"), expert.getMyBookings);

router.patch(
  "/me/bookings/:bookingId",
  authenticate,
  authorize("expert"),
  expert.updateBookingStatus,
);

router.post("/forgot-password", expert.forgotPassword);

router.post("/verify-reset-otp", expert.verifyResetOTP);

router.post("/reset-password", expert.resetPassword);

router.post("/logout", expert.logout);

router.get("/:expertId", expert.getProfile);

export default router;
