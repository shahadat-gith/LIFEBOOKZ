import crypto from "crypto";

import User from "./model.js";
import { generateToken } from "../../core/utils/helpers.js";
import * as Errors from "../../core/utils/errors.js";
import { findAccountRolesByEmail } from "../../core/services/accounts.js";
import { sendEmail } from "../../core/services/email.js";
import { logger } from "../../core/services/logger.js";
import { uploadAvatar, deleteFile } from "../../core/services/upload.js";

const RESET_SELECT =
  "+auth.passwordResetOTP +auth.passwordResetOTPExpires +auth.passwordResetVerified";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 5 * 60 * 1000;

/**
 * Builds a unique username from an email local part.
 */
async function buildUniqueUsername(email) {
  let username = String(email || "")
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);

  if (username.length < 3) username = "user";

  let suffix = 0;
  let finalUsername = username;

  while (await User.exists({ username: finalUsername })) {
    suffix++;
    finalUsername = `${username}_${suffix}`.slice(0, 30);
  }

  return finalUsername;
}

function userToken(user) {
  return generateToken({ role: "user", userId: user.id });
}

/* ---------- Authentication ---------- */

export async function registerUser({ email, password, fullName, file }) {
  if (!email || !password || !fullName) {
    throw new Errors.ValidationError(
      "Email, password, and full name are required.",
    );
  }

  const existing = await User.findOne({ email });

  if (existing) {
    throw new Errors.ConflictError(
      "An account with this email already exists.",
    );
  }

  const username = await buildUniqueUsername(email);

  let avatar = { url: "", publicId: "" };

  if (file) {
    const uploaded = await uploadAvatar(file.buffer);
    avatar = { url: uploaded.url, publicId: uploaded.publicId };
  }

  const user = await User.create({
    email,
    username,
    auth: { passwordHash: password },
    fullName,
    avatar,
  });

  return { user, token: userToken(user) };
}

export async function loginUser({ email, password, ip }) {
  const user = await User.findOne({ email }).select("+auth.passwordHash");

  if (!user) {
    // Failed sign-ins are worth a record: this usually means the email belongs
    // to another portal (author/expert) rather than that the password was wrong.
    const accountRoles = await findAccountRolesByEmail(email);

    await logger.warn("Reader login failed — no reader account for this email", {
      email,
      accountRoles,
      ip,
    });

    throw new Errors.AuthenticationError("Invalid email or password.");
  }

  const isValid = await user.comparePassword(password);

  if (!isValid) {
    await logger.warn("Reader login failed — incorrect password", {
      userId: user.id,
      email,
      ip,
    });

    throw new Errors.AuthenticationError("Invalid email or password.");
  }

  return { user, token: userToken(user) };
}

/* ---------- Profile ---------- */

export async function getUserById(userId) {
  if (!userId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Errors.NotFoundError("User not found.");
  }

  return user;
}

export async function updateUser({ userId, fullName, file }) {
  const user = await getUserById(userId);

  if (fullName !== undefined) {
    user.fullName = fullName;
  }

  if (file) {
    const uploaded = await uploadAvatar(file.buffer);

    if (user.avatar?.publicId) {
      await deleteFile(user.avatar.publicId);
    }

    user.avatar = { url: uploaded.url, publicId: uploaded.publicId };
  }

  await user.save();

  return user;
}

export async function deleteUser({ userId }) {
  const user = await getUserById(userId);

  if (user.avatar?.publicId) {
    await deleteFile(user.avatar.publicId);
  }

  await user.deleteOne();
}

export async function getPublicProfile(userId) {
  const user = await User.findById(userId)
    .select("fullName avatar createdAt")
    .lean();

  if (!user) {
    throw new Errors.NotFoundError("User not found.");
  }

  // `lean()` skips schema virtuals, so the role is added explicitly.
  return { ...user, role: "user" };
}

/* ---------- Password Reset (OTP-based) ---------- */

export async function requestPasswordReset({ email }) {
  if (!email) {
    throw new Errors.ValidationError("Email is required.");
  }

  // Always resolve silently to avoid revealing whether the email exists
  const user = await User.findOne({ email }).select(RESET_SELECT);

  if (user) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.auth.passwordResetOTP = otp;
    user.auth.passwordResetOTPExpires = new Date(Date.now() + OTP_TTL_MS);
    user.auth.passwordResetVerified = false;

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "LifeBookz - Password Reset OTP",
      text: `You requested a password reset for your LifeBookz account.\n\nYour OTP is:\n\n${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest,\nThe LifeBookz Team`,
    }).catch(() => {});
  }
}

export async function verifyPasswordResetOTP({ email, otp }) {
  if (!email || !otp) {
    throw new Errors.ValidationError("Email and OTP are required.");
  }

  const user = await User.findOne({ email }).select(RESET_SELECT);

  if (
    !user ||
    user.auth.passwordResetOTP !== otp ||
    !user.auth.passwordResetOTPExpires ||
    user.auth.passwordResetOTPExpires < new Date()
  ) {
    throw new Errors.ValidationError("Invalid or expired OTP.");
  }

  // Mark OTP as verified and swap it for a short-lived reset token
  user.auth.passwordResetVerified = true;
  user.auth.passwordResetOTPExpires = undefined;

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.auth.passwordResetOTP = resetToken;
  user.auth.passwordResetOTPExpires = new Date(
    Date.now() + RESET_TOKEN_TTL_MS,
  );

  await user.save();

  return resetToken;
}

export async function resetPassword({ resetToken, password }) {
  if (!resetToken || !password) {
    throw new Errors.ValidationError(
      "Reset token and new password are required.",
    );
  }

  if (password.length < 8) {
    throw new Errors.ValidationError(
      "Password must be at least 8 characters.",
    );
  }

  const user = await User.findOne({
    "auth.passwordResetOTP": resetToken,
    "auth.passwordResetOTPExpires": { $gt: new Date() },
    "auth.passwordResetVerified": true,
  }).select(`+auth.passwordHash ${RESET_SELECT}`);

  if (!user) {
    throw new Errors.ValidationError(
      "Invalid or expired reset token. Please request a new OTP.",
    );
  }

  // Update password and clear all reset fields
  user.auth.passwordHash = password;
  user.auth.passwordResetOTP = "";
  user.auth.passwordResetOTPExpires = undefined;
  user.auth.passwordResetVerified = false;

  await user.save();
}
