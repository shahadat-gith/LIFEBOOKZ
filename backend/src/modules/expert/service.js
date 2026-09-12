import crypto from "crypto";
import mongoose from "mongoose";

import Expert from "./model.js";
import Booking, { BOOKING_STATUSES } from "../consult/model.js";

import { generateToken, toSlugUsername } from "../../core/utils/helpers.js";
import * as Errors from "../../core/utils/errors.js";
import { findAccountRolesByEmail } from "../../core/services/accounts.js";
import { sendEmail } from "../../core/services/email.js";
import { logger } from "../../core/services/logger.js";
import { uploadAvatar, deleteFile } from "../../core/services/upload.js";
import {
  embedExpertProfile,
  removeExpertVector,
  storeExpertVector,
} from "./embeddings.js";
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
  "fullName username expertise qualification categories bio languages experience price avatar rating sessions verification createdAt";

function expertToken(expert) {
  return generateToken({ role: "expert", expertId: expert.id });
}

async function findExpertById(userId) {
  if (!userId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  const expert = await Expert.findById(userId);

  if (!expert) {
    throw new Errors.NotFoundError("Expert not found.");
  }

  return expert;
}

/* ---------- Authentication ---------- */

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
    throw new Errors.ValidationError(
      "Please fill all required fields (name, email, password, area of expertise, qualification, bio, phone).",
    );
  }

  if (password.length < 8) {
    throw new Errors.ValidationError("Password must be at least 8 characters.");
  }

  if (username.length < 3) {
    throw new Errors.ValidationError("Username must be at least 3 characters.");
  }

  const validCategories = validateCategories(parsedCategories);

  if (await Expert.exists({ email })) {
    throw new Errors.ConflictError("An expert with this email already exists.");
  }

  if (await Expert.exists({ username })) {
    throw new Errors.ConflictError("That username is already taken.");
  }

  // Built in memory with its final id — nothing is persisted until the
  // matching vector exists, because an expert without one could never be
  // found by consult matching.
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
    avatar: { url: "", publicId: "" },
  });

  let uploadedAvatarId = "";
  let vectorStored = false;

  try {
    if (file) {
      const uploaded = await uploadAvatar(file.buffer);
      uploadedAvatarId = uploaded.publicId;
      expert.avatar = { url: uploaded.url, publicId: uploaded.publicId };
    }

    const embedding = await embedExpertProfile(expert);

    await storeExpertVector(expert, embedding);
    vectorStored = true;

    expert.embeddingText = embedding.text;
    expert.embeddingUpdatedAt = new Date();

    await expert.save();
  } catch (error) {
    // Reject the application cleanly: no expert row, no vector and no
    // orphaned avatar may survive a failed onboarding.
    await discardFailedRegistration({
      expert,
      avatarPublicId: uploadedAvatarId,
      vectorStored,
    });

    throw error;
  }

  return { expert, token: expertToken(expert) };
}

/**
 * Roll back everything a failed registration may have written.
 * Cleanup failures are logged, never thrown, so the original registration
 * error is what reaches the caller.
 */
async function discardFailedRegistration({
  expert,
  avatarPublicId,
  vectorStored,
}) {
  const expertId = expert?._id?.toString() || null;

  try {
    await Expert.deleteOne({ _id: expert._id });
  } catch (error) {
    logger.error("Failed to remove expert after failed registration", {
      expertId,
      reason: error.message,
    });
  }

  if (vectorStored) {
    try {
      await removeExpertVector(expert);
    } catch (error) {
      logger.error("Failed to remove expert vector after failed registration", {
        expertId,
        reason: error.message,
      });
    }
  }

  if (avatarPublicId) {
    try {
      await deleteFile(avatarPublicId);
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
    // Failed sign-ins are worth a record: this usually means the email belongs
    // to another portal rather than that the password was wrong.
    const accountRoles = await findAccountRolesByEmail(email);

    await logger.warn("Expert login failed — no expert account for this email", {
      email,
      accountRoles,
      ip,
    });

    throw new Errors.AuthenticationError("Invalid email or password.");
  }

  const isValid = await expert.comparePassword(password);

  if (!isValid) {
    await logger.warn("Expert login failed — incorrect password", {
      expertId: expert.id,
      email,
      ip,
    });

    throw new Errors.AuthenticationError("Invalid email or password.");
  }

  // Pending and rejected experts can sign in too: the dashboard is where they
  // see their application state, the rejection reason and can keep their
  // profile up to date. Approved-only actions are gated per route.
  return { expert, token: expertToken(expert) };
}

/* ---------- Self service (expert role — pending experts included) ---------- */

export async function getMyExpertProfile(userId) {
  if (!userId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  const expert = await Expert.findById(userId).lean();

  if (!expert) {
    throw new Errors.NotFoundError("Expert not found.");
  }

  // `lean()` skips schema virtuals, so the role is added explicitly.
  return { ...expert, role: "expert" };
}

export async function updateExpert({ userId, body, file }) {
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

  // Track whether anything embeddable changed so we only re-embed then.
  let embeddableChanged = false;

  if (
    fullName !== undefined &&
    fullName.trim() &&
    fullName.trim() !== expert.fullName
  ) {
    expert.fullName = fullName.trim();
    embeddableChanged = true;
  }

  if (
    expertise !== undefined &&
    expertise.trim() &&
    expertise.trim() !== expert.expertise
  ) {
    expert.expertise = expertise.trim();
    embeddableChanged = true;
  }

  if (
    qualification !== undefined &&
    qualification.trim() &&
    qualification.trim() !== expert.qualification
  ) {
    expert.qualification = qualification.trim();
    embeddableChanged = true;
  }

  if (bio !== undefined && bio.trim() && bio.trim() !== expert.bio) {
    expert.bio = bio.trim();
    embeddableChanged = true;
  }

  if (phone !== undefined && phone.trim()) expert.phone = phone.trim();

  if (categories !== undefined) {
    const nextCategories = validateCategories(parseCategories(categories));
    if (nextCategories.join() !== (expert.categories || []).join()) {
      expert.categories = nextCategories;
      embeddableChanged = true;
    }
  }

  if (languages !== undefined) {
    const nextLanguages = parseLanguages(languages);
    if (nextLanguages.join() !== (expert.languages || []).join()) {
      expert.languages = nextLanguages;
      embeddableChanged = true;
    }
  }

  if (experience !== undefined) {
    expert.experience = Math.max(0, Number(experience) || 0);
    embeddableChanged = true;
  }

  if (price !== undefined) expert.price = Math.max(0, Number(price) || 0);

  // Rebuild the vector before the row is written. If the embedding or the
  // index write fails, the update is rejected and the stored profile stays
  // untouched — an expert is never saved without a matching vector.
  if (embeddableChanged) {
    const embedding = await embedExpertProfile(expert);

    await storeExpertVector(expert, embedding);

    expert.embeddingText = embedding.text;
    expert.embeddingUpdatedAt = new Date();
  }

  const replacedAvatarId = expert.avatar?.publicId || "";

  if (file) {
    const uploaded = await uploadAvatar(file.buffer);

    expert.avatar = { url: uploaded.url, publicId: uploaded.publicId };

    try {
      await expert.save();
    } catch (error) {
      // Nothing references the fresh upload yet, so drop it again.
      await deleteFile(uploaded.publicId).catch(() => {});
      throw error;
    }
  } else {
    await expert.save();
  }

  // The replaced avatar is only removed once the new one is committed.
  if (file && replacedAvatarId) {
    await deleteFile(replacedAvatarId).catch((error) =>
      logger.warn("Failed to delete replaced expert avatar", {
        expertId: expert.id,
        publicId: replacedAvatarId,
        reason: error.message,
      }),
    );
  }

  return expert;
}

/* ---------- Bookings ---------- */

export async function listBookingsForExpert({ expertId }) {
  if (!expertId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  return Booking.find({ expert: expertId }).sort({ createdAt: -1 }).lean();
}

export async function setBookingStatus({ expertId, bookingId, status }) {
  if (!expertId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  if (!BOOKING_STATUSES.includes(status)) {
    throw new Errors.ValidationError(
      `Status must be one of: ${BOOKING_STATUSES.join(", ")}.`,
    );
  }

  const booking = await Booking.findOne({ _id: bookingId, expert: expertId });

  if (!booking) {
    throw new Errors.NotFoundError("Booking not found.");
  }

  const wasCompleted = booking.status === "completed";

  booking.status = status;

  if (status === "completed" && !wasCompleted) {
    booking.completedAt = new Date();
    // Only count a consultation once.
    await Expert.updateOne({ _id: expertId }, { $inc: { sessions: 1 } });
  }

  await booking.save();

  return booking;
}

/* ---------- Public ---------- */

export async function getPublicExpert(expertId) {
  const expert = await Expert.findOne({ _id: expertId, status: "active" })
    .select(PUBLIC_EXPERT_SELECT)
    .lean();

  if (!expert) {
    throw new Errors.NotFoundError("Expert not found.");
  }

  return { ...expert, role: "expert" };
}

/* ---------- Password reset (OTP based) ---------- */

export async function requestPasswordReset({ email }) {
  if (!email) {
    throw new Errors.ValidationError("Email is required.");
  }

  // Always resolve silently to avoid revealing whether the email exists
  const expert = await Expert.findOne({ email }).select(RESET_SELECT);

  if (expert) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    expert.auth.passwordResetOTP = otp;
    expert.auth.passwordResetOTPExpires = new Date(Date.now() + OTP_TTL_MS);
    expert.auth.passwordResetVerified = false;

    await expert.save();

    await sendEmail({
      to: expert.email,
      subject: "LifeBookz - Expert Password Reset OTP",
      text: `You requested a password reset for your LifeBookz expert account.\n\nYour OTP is:\n\n${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest,\nThe LifeBookz Team`,
    }).catch(() => {});
  }
}

export async function verifyPasswordResetOTP({ email, otp }) {
  if (!email || !otp) {
    throw new Errors.ValidationError("Email and OTP are required.");
  }

  const expert = await Expert.findOne({ email }).select(RESET_SELECT);

  if (
    !expert ||
    expert.auth.passwordResetOTP !== otp ||
    !expert.auth.passwordResetOTPExpires ||
    expert.auth.passwordResetOTPExpires < new Date()
  ) {
    throw new Errors.ValidationError("Invalid or expired OTP.");
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
    throw new Errors.ValidationError(
      "Reset token and new password are required.",
    );
  }

  if (password.length < 8) {
    throw new Errors.ValidationError(
      "Password must be at least 8 characters.",
    );
  }

  const expert = await Expert.findOne({
    "auth.passwordResetOTP": resetToken,
    "auth.passwordResetOTPExpires": { $gt: new Date() },
    "auth.passwordResetVerified": true,
  }).select(`+auth.passwordHash ${RESET_SELECT}`);

  if (!expert) {
    throw new Errors.ValidationError(
      "Invalid or expired reset token. Please request a new OTP.",
    );
  }

  expert.auth.passwordHash = password;
  expert.auth.passwordResetOTP = "";
  expert.auth.passwordResetOTPExpires = undefined;
  expert.auth.passwordResetVerified = false;

  await expert.save();
}
