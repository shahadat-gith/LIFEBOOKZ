import crypto from "crypto";

import User from "./model.js";
import { generateToken, verifyPassword } from "../../core/utils/helpers.js";
import {
  authenticationError,
  conflictError,
  notFoundError,
  validationError,
} from "../../core/utils/errors.js";
import {
  findAccountRolesByEmail,
  noAccountMessage,
} from "../../core/services/accounts.js";
import { sendWelcomeMail, sendOtpMail } from "../../core/services/mailer.js";
import { logger } from "../../core/services/logger.js";
import {
  uploadAvatar,
  replaceImage,
  deleteFile,
} from "../../core/services/upload.js";

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

export async function registerUser({ email, password, fullName, file }) {
  if (!email || !password || !fullName) {
    throw validationError("Email, password, and full name are required.");
  }

  const existing = await User.findOne({ email });

  if (existing) {
    const message = "An account with this email already exists.";

    throw conflictError(message, { email: message });
  }

  const username = await buildUniqueUsername(email);

  let avatar = { url: "", key: "" };

  if (file) {
    const uploaded = await uploadAvatar(file.buffer, file.mimetype, "user");
    avatar = { url: uploaded.url, key: uploaded.key };
  }

  const user = await User.create({
    email,
    username,
    auth: { passwordHash: password },
    fullName,
    avatar,
  });

  sendWelcomeMail({ to: user.email, name: user.fullName, role: "user" });

  return { user, token: userToken(user) };
}

export async function loginUser({ email, password, ip }) {
  const user = await User.findOne({ email }).select("+auth.passwordHash");

  if (!user) {
    const accountRoles = await findAccountRolesByEmail(email);

    await logger.warn("Reader login failed — no reader account for this email", {
      email,
      accountRoles,
      ip,
    });

    const message = noAccountMessage(accountRoles, "user");

    throw authenticationError(message, { email: message });
  }

  const isValid = await verifyPassword(password, user.auth.passwordHash);

  if (!isValid) {
    await logger.warn("Reader login failed — incorrect password", {
      userId: user.id,
      email,
      ip,
    });

    const message = "Incorrect password. Try again, or reset it.";

    throw authenticationError(message, { password: message });
  }

  return { user, token: userToken(user) };
}

export async function getUserById(userId) {
  if (!userId) {
    throw authenticationError("Authentication required.");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw notFoundError("User not found.");
  }

  return user;
}

export async function updateUser({ userId, fullName, file, coverFile, coverMobileFile }) {
  const user = await getUserById(userId);

  if (fullName !== undefined) {
    user.fullName = fullName;
  }

  if (file) {
    user.avatar = await replaceImage({
      buffer: file.buffer,
      contentType: file.mimetype,
      role: "user",
      kind: "avatar",
      previousKey: user.avatar?.key,
    });
  }

  // Desktop (16:5) cover variant
  if (coverFile) {
    user.coverImage = await replaceImage({
      buffer: coverFile.buffer,
      contentType: coverFile.mimetype,
      role: "user",
      kind: "cover",
      previousKey: user.coverImage?.key,
    });
  }

  // Mobile (4:3) cover variant
  if (coverMobileFile) {
    user.coverImageMobile = await replaceImage({
      buffer: coverMobileFile.buffer,
      contentType: coverMobileFile.mimetype,
      role: "user",
      kind: "coverMobile",
      previousKey: user.coverImageMobile?.key,
    });
  }

  await user.save();

  return user;
}

export async function deleteUser({ userId }) {
  const user = await getUserById(userId);

  if (user.avatar?.key) {
    await deleteFile(user.avatar.key);
  }

  await user.deleteOne();
}

export async function getPublicProfile(userId) {
  const user = await User.findById(userId)
    .select("fullName avatar coverImage coverImageMobile createdAt")
    .lean();

  if (!user) {
    throw notFoundError("User not found.");
  }

  // `lean()` skips schema virtuals, so the role is added explicitly.
  return { ...user, role: "user" };
}

export async function requestPasswordReset({ email }) {
  if (!email) {
    throw validationError("Email is required.");
  }

  // Always resolve silently to avoid revealing whether the email exists
  const user = await User.findOne({ email }).select(RESET_SELECT);

  if (user) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.auth.passwordResetOTP = otp;
    user.auth.passwordResetOTPExpires = new Date(Date.now() + OTP_TTL_MS);
    user.auth.passwordResetVerified = false;

    await user.save();

    await sendOtpMail({ to: user.email, otp, role: "user" });
  }
}

export async function verifyPasswordResetOTP({ email, otp }) {
  if (!email || !otp) {
    throw validationError("Email and OTP are required.");
  }

  const user = await User.findOne({ email }).select(RESET_SELECT);

  if (
    !user ||
    user.auth.passwordResetOTP !== otp ||
    !user.auth.passwordResetOTPExpires ||
    user.auth.passwordResetOTPExpires < new Date()
  ) {
    throw validationError("Invalid or expired OTP.");
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
    throw validationError("Reset token and new password are required.");
  }

  if (password.length < 8) {
    throw validationError("Password must be at least 8 characters.");
  }

  const user = await User.findOne({
    "auth.passwordResetOTP": resetToken,
    "auth.passwordResetOTPExpires": { $gt: new Date() },
    "auth.passwordResetVerified": true,
  }).select(`+auth.passwordHash ${RESET_SELECT}`);

  if (!user) {
    throw validationError(
      "Invalid or expired reset token. Please request a new OTP.",
    );
  }

  user.auth.passwordHash = password;
  user.auth.passwordResetOTP = "";
  user.auth.passwordResetOTPExpires = undefined;
  user.auth.passwordResetVerified = false;

  await user.save();
}
