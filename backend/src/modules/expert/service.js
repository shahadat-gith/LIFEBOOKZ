import crypto from "crypto";
import mongoose from "mongoose";

import Expert from "./model.js";
import Booking, { BOOKING_STATUSES } from "../consult/model.js";

import {
  generateToken,
  toSlugUsername,
  verifyPassword,
} from "../../core/utils/helpers.js";
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
import {
  sendWelcomeMail,
  sendOtpMail,
  sendBookingStatusMail,
} from "../../core/services/mailer.js";
import { logger } from "../../core/services/logger.js";
import {
  uploadAvatar,
  uploadCover,
  deleteFile,
} from "../../core/services/upload.js";
import {
  parseCategories,
  parseLanguages,
  validateCategories,
} from "./utils.js";

const RESET_SELECT =
  "+auth.passwordResetOTP +auth.passwordResetOTPExpires +auth.passwordResetVerified";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 5 * 60 * 1000;

const PUBLIC_EXPERT_SELECT =
  "fullName username expertise qualification categories bio languages experience price avatar coverImage coverImageMobile rating sessions verification createdAt";

function expertToken(expert) {
  return generateToken({ role: "expert", expertId: expert.id });
}

async function findExpertById(userId) {
  if (!userId) {
    throw authenticationError("Authentication required.");
  }

  const expert = await Expert.findById(userId);

  if (!expert) {
    throw notFoundError("Expert not found.");
  }

  return expert;
}

export async function registerExpert({ body, file }) {
  let {
    email,
    password,
    fullName,
    username,
    profession,
    expertise,
    qualification,
    categories,
    bio,
    phone,
    languages,
    experience,
    price,
  } = body;

  const parsedCategories = parseCategories(categories);

  email = email?.trim().toLowerCase();
  fullName = fullName?.trim();
  username = toSlugUsername(username || fullName || "");
  expertise = expertise?.trim();
  qualification = qualification?.trim();
  bio = bio?.trim();
  phone = phone?.trim();

  // `profession` is accepted as a friendlier alias for `expertise`.
  if (!expertise && profession?.trim()) {
    expertise = profession.trim();
  }

  if (
    !email ||
    !password ||
    !fullName ||
    !expertise ||
    !qualification ||
    !bio ||
    !phone
  ) {
    throw validationError(
      "Please fill all required fields (name, email, password, area of expertise, qualification, bio, phone).",
    );
  }

  if (password.length < 8) {
    throw validationError("Password must be at least 8 characters.");
  }

  if (username.length < 3) {
    throw validationError("Username must be at least 3 characters.");
  }

  const validCategories = validateCategories(parsedCategories);

  if (await Expert.exists({ email })) {
    const message = "An expert with this email already exists.";

    throw conflictError(message, { email: message });
  }

  if (await Expert.exists({ username })) {
    const message = "That username is already taken.";

    throw conflictError(message, { username: message });
  }

  const expert = new Expert({
    _id: new mongoose.Types.ObjectId(),
    email,
    username,
    auth: { passwordHash: password },
    fullName,
    phone,
    expertise,
    qualification,
    categories: validCategories,
    bio,
    languages: parseLanguages(languages),
    experience: Math.max(0, Number(experience) || 0),
    price: Math.max(0, Number(price) || 0),
    avatar: { url: "", key: "" },
  });

  try {
    if (file) {
      const uploaded = await uploadAvatar(file.buffer, file.mimetype, "expert");
      expert.avatar = { url: uploaded.url, key: uploaded.key };
    }

    await expert.save();
  } catch (error) {
    // Reject the application cleanly — no expert row or orphaned avatar
    // may survive a failed onboarding.
    await discardFailedRegistration({ expert });

    throw error;
  }

  sendWelcomeMail({ to: expert.email, name: expert.fullName, role: "expert" });

  return { expert, token: expertToken(expert) };
}

/**
 * Roll back everything a failed registration may have written.
 * Cleanup failures are logged, never thrown, so the original registration
 * error is what reaches the caller.
 */
async function discardFailedRegistration({ expert }) {
  const expertId = expert?._id?.toString() || null;

  try {
    await Expert.deleteOne({ _id: expert._id });
  } catch (error) {
    logger.error("Failed to remove expert after failed registration", {
      expertId,
      reason: error.message,
    });
  }

  if (expert?.avatar?.key) {
    try {
      await deleteFile(expert.avatar.key);
    } catch (error) {
      logger.error("Failed to remove expert avatar after failed registration", {
        expertId,
        reason: error.message,
      });
    }
  }
}

export async function loginExpert({ email, password, ip }) {
  const expert = await Expert.findOne({ email }).select("+auth.passwordHash");

  if (!expert) {
    const accountRoles = await findAccountRolesByEmail(email);

    await logger.warn("Expert login failed — no expert account for this email", {
      email,
      accountRoles,
      ip,
    });

    const message = noAccountMessage(accountRoles, "expert");

    throw authenticationError(message, { email: message });
  }

  const isValid = await verifyPassword(password, expert.auth.passwordHash);

  if (!isValid) {
    await logger.warn("Expert login failed — incorrect password", {
      expertId: expert.id,
      email,
      ip,
    });

    const message = "Incorrect password. Try again, or reset it.";

    throw authenticationError(message, { password: message });
  }

  // Pending and rejected experts can sign in too: the dashboard is where they
  // see their application state, the rejection reason and can keep their
  // profile up to date. Approved-only actions are gated per route.
  return { expert, token: expertToken(expert) };
}

export async function getMyExpertProfile(userId) {
  if (!userId) {
    throw authenticationError("Authentication required.");
  }

  const expert = await Expert.findById(userId).lean();

  if (!expert) {
    throw notFoundError("Expert not found.");
  }

  // `lean()` skips schema virtuals, so the role is added explicitly.
  return { ...expert, role: "expert" };
}

export async function updateExpert({ userId, body, file, coverFile, coverMobileFile }) {
  const expert = await findExpertById(userId);

  const {
    fullName,
    expertise,
    qualification,
    categories,
    bio,
    phone,
    languages,
    experience,
    price,
  } = body;

  if (
    fullName !== undefined &&
    fullName.trim() &&
    fullName.trim() !== expert.fullName
  ) {
    expert.fullName = fullName.trim();
  }

  if (
    expertise !== undefined &&
    expertise.trim() &&
    expertise.trim() !== expert.expertise
  ) {
    expert.expertise = expertise.trim();
  }

  if (
    qualification !== undefined &&
    qualification.trim() &&
    qualification.trim() !== expert.qualification
  ) {
    expert.qualification = qualification.trim();
  }

  if (bio !== undefined && bio.trim() && bio.trim() !== expert.bio) {
    expert.bio = bio.trim();
  }

  if (phone !== undefined && phone.trim()) expert.phone = phone.trim();

  if (categories !== undefined) {
    const nextCategories = validateCategories(parseCategories(categories));
    if (nextCategories.join() !== (expert.categories || []).join()) {
      expert.categories = nextCategories;
    }
  }

  if (languages !== undefined) {
    const nextLanguages = parseLanguages(languages);
    if (nextLanguages.join() !== (expert.languages || []).join()) {
      expert.languages = nextLanguages;
    }
  }

  if (experience !== undefined) {
    expert.experience = Math.max(0, Number(experience) || 0);
  }

  if (price !== undefined) expert.price = Math.max(0, Number(price) || 0);

  // Upload new images BEFORE saving, so a storage failure rejects the whole
  // update and the stored profile stays untouched.
  const replacedKeys = [];
  const freshKeys = [];

  if (file) {
    replacedKeys.push(["avatar", expert.avatar?.key]);
    const uploaded = await uploadAvatar(file.buffer, file.mimetype, "expert");
    expert.avatar = { url: uploaded.url, key: uploaded.key };
    freshKeys.push(uploaded.key);
  }

  // Desktop (16:5) cover variant
  if (coverFile) {
    replacedKeys.push(["coverImage", expert.coverImage?.key]);
    const uploaded = await uploadCover(
      coverFile.buffer,
      coverFile.mimetype,
      "expert",
      "desktop",
    );
    expert.coverImage = { url: uploaded.url, key: uploaded.key };
    freshKeys.push(uploaded.key);
  }

  // Mobile (4:3) cover variant
  if (coverMobileFile) {
    replacedKeys.push(["coverImageMobile", expert.coverImageMobile?.key]);
    const uploaded = await uploadCover(
      coverMobileFile.buffer,
      coverMobileFile.mimetype,
      "expert",
      "mobile",
    );
    expert.coverImageMobile = { url: uploaded.url, key: uploaded.key };
    freshKeys.push(uploaded.key);
  }

  try {
    await expert.save();
  } catch (error) {
    // Nothing references the fresh uploads yet, so drop them again.
    await Promise.all(freshKeys.map((key) => deleteFile(key).catch(() => {})));
    throw error;
  }

  // Replaced images are only removed once the new ones are committed.
  await Promise.all(
    replacedKeys
      .filter(([, key]) => key)
      .map(([field, key]) =>
        deleteFile(key).catch((error) =>
          logger.warn("Failed to delete replaced expert image", {
            expertId: expert.id,
            field,
            key,
            reason: error.message,
          }),
        ),
      ),
  );

  return expert;
}

export async function listBookingsForExpert({ expertId }) {
  if (!expertId) {
    throw authenticationError("Authentication required.");
  }

  return Booking.find({ expert: expertId }).sort({ createdAt: -1 }).lean();
}

export async function setBookingStatus({ expertId, bookingId, status }) {
  if (!expertId) {
    throw authenticationError("Authentication required.");
  }

  if (!BOOKING_STATUSES.includes(status)) {
    throw validationError(
      `Status must be one of: ${BOOKING_STATUSES.join(", ")}.`,
    );
  }

  const booking = await Booking.findOne({ _id: bookingId, expert: expertId });

  if (!booking) {
    throw notFoundError("Booking not found.");
  }

  const wasCompleted = booking.status === "completed";
  const previousStatus = booking.status;

  booking.status = status;

  if (status === "completed" && !wasCompleted) {
    booking.completedAt = new Date();
    // Only count a consultation once.
    await Expert.updateOne({ _id: expertId }, { $inc: { sessions: 1 } });
  }

  await booking.save();

  if (booking.guestEmail && previousStatus !== status) {
    const expert = await Expert.findById(expertId).select("fullName");

    sendBookingStatusMail({
      to: booking.guestEmail,
      clientName: booking.guestName,
      expertName: expert?.fullName,
      status,
      sessionType: booking.sessionType,
      date: booking.date,
      time: booking.time,
    });
  }

  return booking;
}

export async function getPublicExpert(expertId) {
  const expert = await Expert.findOne({ _id: expertId, status: "active" })
    .select(PUBLIC_EXPERT_SELECT)
    .lean();

  if (!expert) {
    throw notFoundError("Expert not found.");
  }

  return { ...expert, role: "expert" };
}

export async function requestPasswordReset({ email }) {
  if (!email) {
    throw validationError("Email is required.");
  }

  // Always resolve silently to avoid revealing whether the email exists
  const expert = await Expert.findOne({ email }).select(RESET_SELECT);

  if (expert) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    expert.auth.passwordResetOTP = otp;
    expert.auth.passwordResetOTPExpires = new Date(Date.now() + OTP_TTL_MS);
    expert.auth.passwordResetVerified = false;

    await expert.save();

    await sendOtpMail({ to: expert.email, otp, role: "expert" });
  }
}

export async function verifyPasswordResetOTP({ email, otp }) {
  if (!email || !otp) {
    throw validationError("Email and OTP are required.");
  }

  const expert = await Expert.findOne({ email }).select(RESET_SELECT);

  if (
    !expert ||
    expert.auth.passwordResetOTP !== otp ||
    !expert.auth.passwordResetOTPExpires ||
    expert.auth.passwordResetOTPExpires < new Date()
  ) {
    throw validationError("Invalid or expired OTP.");
  }

  expert.auth.passwordResetVerified = true;
  expert.auth.passwordResetOTPExpires = undefined;

  const resetToken = crypto.randomBytes(32).toString("hex");
  expert.auth.passwordResetOTP = resetToken;
  expert.auth.passwordResetOTPExpires = new Date(
    Date.now() + RESET_TOKEN_TTL_MS,
  );

  await expert.save();

  return resetToken;
}

export async function resetPassword({ resetToken, password }) {
  if (!resetToken || !password) {
    throw validationError("Reset token and new password are required.");
  }

  if (password.length < 8) {
    throw validationError("Password must be at least 8 characters.");
  }

  const expert = await Expert.findOne({
    "auth.passwordResetOTP": resetToken,
    "auth.passwordResetOTPExpires": { $gt: new Date() },
    "auth.passwordResetVerified": true,
  }).select(`+auth.passwordHash ${RESET_SELECT}`);

  if (!expert) {
    throw validationError(
      "Invalid or expired reset token. Please request a new OTP.",
    );
  }

  expert.auth.passwordHash = password;
  expert.auth.passwordResetOTP = "";
  expert.auth.passwordResetOTPExpires = undefined;
  expert.auth.passwordResetVerified = false;

  await expert.save();
}
