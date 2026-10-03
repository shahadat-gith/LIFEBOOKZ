import crypto from "crypto";
import mongoose from "mongoose";

import Expert from "../models/Expert.js";
import Consultation from "../models/Consultation.js";

import {
  generateToken,
  hashPassword,
  toSlugUsername,
  verifyPassword,
} from "../utils/helpers.js";
import {
  authenticationError,
  conflictError,
  notFoundError,
  validationError,
} from "../utils/errors.js";
import {
  findAccountRolesByEmail,
  noAccountMessage,
} from "./accounts.service.js";
import {
  sendWelcomeMail,
  sendOtpMail,
} from "./mailer.service.js";
import { logger } from "./logger.service.js";
import {
  uploadAvatar,
  uploadCover,
  deleteFile,
} from "./upload.service.js";
import {
  parseCategories,
  parseLanguages,
  validateCategories,
} from "../utils/expert.utils.js";

const RESET_SELECT =
  "+auth.passwordResetOTP +auth.passwordResetOTPExpires +auth.passwordResetVerified";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 5 * 60 * 1000;

const PUBLIC_EXPERT_SELECT =
  "fullName username expertise qualification categories bio languages experience price avatar coverImage rating ratingCount sessions verification createdAt";

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

/**
 * Toggles the expert's availability for new consultation requests. When
 * unavailable the expert is left out of matching results entirely; live
 * sessions are unaffected.
 */
export async function setAvailability({ userId, isAvailable }) {
  if (!userId) {
    throw authenticationError("Authentication required.");
  }
  if (typeof isAvailable !== "boolean") {
    throw validationError("`isAvailable` must be true or false.");
  }

  const expert = await Expert.findByIdAndUpdate(
    userId,
    { $set: { isAvailable } },
    { new: true, runValidators: true },
  ).select("fullName isAvailable");

  if (!expert) {
    throw notFoundError("Expert not found.");
  }

  return expert;
}

export async function updateExpert({ userId, body, file, coverFile }) {
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

  // Desktop (16:9) cover variant
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

/**
 * The expert's consultations, newest first. Lifecycle actions (accept,
 * decline, end session) live in the consult services — this is a read.
 */
export async function listBookingsForExpert({ expertId }) {
  if (!expertId) {
    throw authenticationError("Authentication required.");
  }

  return Consultation.find({ expert: expertId })
    .populate("user", "fullName username avatar")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
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
  const expert = await Expert.findOne({ email }).select("email");

  if (!expert) return;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Targeted write on purpose. Resetting a password only touches `auth`, so it
  // must not re-validate the rest of the profile — a document predating a
  // `required` field would otherwise be locked out of its own reset.
  await Expert.updateOne(
    { _id: expert._id },
    {
      $set: {
        "auth.passwordResetOTP": otp,
        "auth.passwordResetOTPExpires": new Date(Date.now() + OTP_TTL_MS),
        "auth.passwordResetVerified": false,
      },
    },
  );

  await sendOtpMail({ to: expert.email, otp, role: "expert" });
}

export async function verifyPasswordResetOTP({ email, otp }) {
  if (!email || !otp) {
    throw validationError("Email and OTP are required.");
  }

  const expert = await Expert.findOne({ email }).select(`email ${RESET_SELECT}`);

  if (
    !expert ||
    expert.auth.passwordResetOTP !== otp ||
    !expert.auth.passwordResetOTPExpires ||
    expert.auth.passwordResetOTPExpires < new Date()
  ) {
    throw validationError("Invalid or expired OTP.");
  }

  // Verified marks that the reset token — not the OTP — is the credential the
  // next step accepts, so the short-lived token replaces the OTP here.
  const resetToken = crypto.randomBytes(32).toString("hex");

  await Expert.updateOne(
    { _id: expert._id },
    {
      $set: {
        "auth.passwordResetVerified": true,
        "auth.passwordResetOTP": resetToken,
        "auth.passwordResetOTPExpires": new Date(
          Date.now() + RESET_TOKEN_TTL_MS,
        ),
      },
    },
  );

  return resetToken;
}

export async function resetPassword({ resetToken, password }) {
  if (!resetToken || !password) {
    throw validationError("Reset token and new password are required.");
  }

  if (password.length < 8) {
    throw validationError("Password must be at least 8 characters.");
  }

  // Hashing happens here because the write below is a targeted update, so the
  // model's pre-save hook never runs.
  const passwordHash = await hashPassword(password);

  // One atomic write: match on the token, swap in the hash and drop the token.
  // Two concurrent submissions of the same token cannot both succeed.
  const result = await Expert.updateOne(
    {
      "auth.passwordResetOTP": resetToken,
      "auth.passwordResetOTPExpires": { $gt: new Date() },
      "auth.passwordResetVerified": true,
    },
    {
      $set: {
        "auth.passwordHash": passwordHash,
        "auth.passwordResetVerified": false,
      },
      $unset: {
        "auth.passwordResetOTP": "",
        "auth.passwordResetOTPExpires": "",
      },
    },
  );

  if (result.matchedCount === 0) {
    throw validationError(
      "Invalid or expired reset token. Please request a new OTP.",
    );
  }
}
