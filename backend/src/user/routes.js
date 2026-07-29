import { Router } from "express";

import upload from "../shared/middlewares/multer.js";
import { authenticate } from "../shared/middlewares/auth.js";

import * as user from "./controllers.js";

const router = Router();

/* ---------- Authentication ---------- */

router.post("/register", upload.single("avatar"), user.register);

router.post("/login", user.login);

/* ---------- Profile ---------- */

router.get("/me", authenticate, user.getMe);

router.patch("/me", authenticate, upload.single("avatar"), user.updateMe);

router.delete("/me", authenticate, user.deleteMe);

/* ---------- Password Reset ---------- */

router.post("/forgot-password", user.forgotPassword);

router.post("/verify-reset-otp", user.verifyResetOTP);

router.post("/reset-password", user.resetPassword);

/* ---------- Logout ---------- */

router.post("/logout", user.logout);

/* ---------- Public ---------- */

router.get("/:userId", user.getProfile);

export default router;
