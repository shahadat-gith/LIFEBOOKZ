import crypto from "crypto";

import Author from "./model.js";
import Story from "../story/models/Story.js";

import { generateToken } from "../../core/utils/helpers.js";
import * as Errors from "../../core/utils/errors.js";
import { findAccountRolesByEmail } from "../../core/services/accounts.js";
import { sendEmail } from "../../core/services/email.js";
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

const PUBLIC_AUTHOR_SELECT =
  "fullName username profession avatar coverImage coverImageMobile verification bio socialLinks address phone dob gender stats createdAt";

function authorToken(author) {
  return generateToken({ role: "author", authorId: author.id });
}

/**
 * FormData sends nested objects as JSON strings — decode defensively.
 */
function parseJsonField(value, { strict = false } = {}) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    if (strict) throw new Errors.ValidationError("Invalid social links.");
    return undefined;
  }
}

function sanitizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
}

async function findAuthorById(userId) {
  if (!userId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  const author = await Author.findById(userId);

  if (!author) {
    throw new Errors.NotFoundError("Author not found.");
  }

  return author;
}

/* ---------- Authentication ---------- */

export async function registerAuthor({ body, file }) {
  let {
    email,
    password,
    fullName,
    username,
    // Optional at signup — completing the profile later unlocks publishing.
    profession,
    bio,
    phone,
    dob,
    gender,
    address = {},
    socialLinks = {},
  } = body;

  // Parse JSON strings that come from FormData
  socialLinks = parseJsonField(socialLinks, { strict: true }) ?? {};
  address = parseJsonField(address) ?? {};

  email = email?.trim().toLowerCase();
  fullName = fullName?.trim();
  username = sanitizeUsername(username || fullName || "");

  // Lightweight signup: only name, email, password and username are required.
  if (!email || !password || !fullName) {
    throw new Errors.ValidationError(
      "Please fill all required fields (name, email, password).",
    );
  }

  if (username.length < 3) {
    throw new Errors.ValidationError(
      "Username must be at least 3 characters.",
    );
  }

  const existing = await Author.exists({ email });

  if (existing) {
    throw new Errors.ConflictError(
      "An author with this email already exists.",
    );
  }

  let avatar = { url: "", key: "" };

  if (file) {
    const uploaded = await uploadAvatar(file.buffer, file.mimetype, "author");
    avatar = { url: uploaded.url, key: uploaded.key };
  }

  const isProfileCompleted = Boolean(
    profession?.trim() &&
      bio?.trim() &&
      phone?.trim() &&
      dob &&
      gender,
  );

  const author = await Author.create({
    email,
    username,
    auth: { passwordHash: password },
    fullName,
    profession: profession?.trim() || "",
    phone: phone?.trim() || "",
    ...(dob ? { dob: new Date(dob) } : {}),
    ...(gender ? { gender } : {}),
    avatar,
    bio: bio?.trim() || "",
    address: {
      country: address.country || "",
      state: address.state || "",
      city: address.city || "",
      zipCode: address.zipCode || "",
    },
    socialLinks: {
      website: socialLinks.website || "",
      x: socialLinks.x || "",
      instagram: socialLinks.instagram || "",
      facebook: socialLinks.facebook || "",
      linkedin: socialLinks.linkedin || "",
      youtube: socialLinks.youtube || "",
    },
    isProfileCompleted,
  });

  return { author, token: authorToken(author) };
}

export async function loginAuthor({ email, password, ip }) {
  const author = await Author.findOne({ email }).select("+auth.passwordHash");

  if (!author) {
    // Failed sign-ins are worth a record: this usually means the email belongs
    // to another portal rather than that the password was wrong.
    const accountRoles = await findAccountRolesByEmail(email);

    await logger.warn("Author login failed — no author account for this email", {
      email,
      accountRoles,
      ip,
    });

    throw new Errors.AuthenticationError("Invalid email or password.");
  }

  const isValid = await author.comparePassword(password);

  if (!isValid) {
    await logger.warn("Author login failed — incorrect password", {
      authorId: author.id,
      email,
      ip,
    });

    throw new Errors.AuthenticationError("Invalid email or password.");
  }

  // Pending and rejected authors can sign in too: the dashboard is where they
  // see their application state, the rejection reason and can keep their
  // profile up to date. Publishing is gated separately by `requireApproved`.
  return { author, token: authorToken(author) };
}

/* ---------- Profile ---------- */

export async function getMyAuthorProfile(userId) {
  if (!userId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  const author = await Author.findById(userId).lean();

  if (!author) {
    throw new Errors.NotFoundError("Author not found.");
  }

  // `lean()` skips schema virtuals, so the role is added explicitly.
  return { ...author, role: "author" };
}

export async function updateAuthor({
  userId,
  body,
  file,
  coverFile,
  coverMobileFile,
}) {
  const author = await findAuthorById(userId);

  let { fullName, profession, bio, phone, dob, gender, address, socialLinks } =
    body;

  // Parse JSON strings when sent via FormData
  socialLinks = parseJsonField(socialLinks);
  address = parseJsonField(address);

  if (fullName !== undefined) author.fullName = fullName;
  if (profession !== undefined) author.profession = profession;
  if (bio !== undefined) author.bio = bio;
  if (phone !== undefined) author.phone = phone;
  if (dob !== undefined) author.dob = new Date(dob);
  if (gender !== undefined) author.gender = gender;

  if (address) {
    author.address = { ...(author.address || {}), ...address };
  }

  if (socialLinks) {
    author.socialLinks = { ...(author.socialLinks || {}), ...socialLinks };
  }

  if (file) {
    author.avatar = await replaceImage({
      buffer: file.buffer,
      contentType: file.mimetype,
      role: "author",
      kind: "avatar",
      previousKey: author.avatar?.key,
    });
  }

  // Desktop (16:5) cover variant
  if (coverFile) {
    author.coverImage = await replaceImage({
      buffer: coverFile.buffer,
      contentType: coverFile.mimetype,
      role: "author",
      kind: "cover",
      previousKey: author.coverImage?.key,
    });
  }

  // Mobile (4:3) cover variant — shown below the sm breakpoint
  if (coverMobileFile) {
    author.coverImageMobile = await replaceImage({
      buffer: coverMobileFile.buffer,
      contentType: coverMobileFile.mimetype,
      role: "author",
      kind: "coverMobile",
      previousKey: author.coverImageMobile?.key,
    });
  }

  // Profile is considered complete once the publishing-critical fields are
  // all filled in. Keeps existing true values sticky (admins/bans aside).
  const profileDone = Boolean(
    (author.profession || "").trim() &&
      (author.bio || "").trim() &&
      (author.phone || "").trim() &&
      author.dob &&
      author.gender,
  );
  if (profileDone || author.isProfileCompleted) {
    author.isProfileCompleted = profileDone;
  }

  await author.save();

  return author;
}

export async function getPublicAuthor(authorId) {
  const author = await Author.findById(authorId)
    .select(PUBLIC_AUTHOR_SELECT)
    .lean();

  if (!author) {
    throw new Errors.NotFoundError("Author not found.");
  }

  return { ...author, role: "author" };
}

/* ---------- Stories owned by the author ---------- */

export async function listMyStories({ authorId }) {
  if (!authorId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  return Story.find({ author: authorId }).sort({ updatedAt: -1 }).lean();
}

export async function getMyStory({ authorId, storyId }) {
  if (!authorId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  const story = await Story.findOne({ _id: storyId, author: authorId }).lean();

  if (!story) {
    throw new Errors.NotFoundError("Story not found.");
  }

  return story;
}

/**
 * Aggregated profile stats for the author's own profile page:
 * followers, following, chapters, stories, and total likes received.
 */
export async function getMyAuthorStats({ authorId }) {
  if (!authorId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  const Follow = (await import("../following/model.js")).default;

  const [author, followers, publishedBooks] = await Promise.all([
    Author.findById(authorId).select("stats").lean(),
    Follow.countDocuments({ whom: authorId }),
    Story.aggregate([
      { $match: { author: authorId, status: "published" } },
      {
        $project: {
          likes: "$stats.likes",
          chapters: { $size: { $ifNull: ["$chapters", []] } },
          stories: {
            $sum: {
              $map: {
                input: { $ifNull: ["$chapters", []] },
                as: "ch",
                in: { $size: { $ifNull: ["$$ch.stories", []] } },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          likes: { $sum: "$likes" },
          chapters: { $sum: "$chapters" },
          stories: { $sum: "$stories" },
        },
      },
    ]),
  ]);

  return {
    followers: followers || 0,
    following: 0,
    chapters: publishedBooks[0]?.chapters || 0,
    stories: publishedBooks[0]?.stories || 0,
    likes: publishedBooks[0]?.likes || 0,
  };
}

/* ---------- Public directory ---------- */

export async function listApprovedAuthors() {
  const authors = await Author.find({ "verification.status": "approved" })
    .select("fullName profession avatar bio createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const authorIds = authors.map((a) => a._id);
  const countMap = {};

  if (authorIds.length > 0) {
    const storyCounts = await Story.aggregate([
      { $match: { author: { $in: authorIds }, status: "published" } },
      { $group: { _id: "$author", count: { $sum: 1 } } },
    ]);

    storyCounts.forEach((row) => {
      countMap[row._id.toString()] = row.count;
    });
  }

  return authors.map((author) => ({
    ...author,
    storyCount: countMap[author._id.toString()] || 0,
  }));
}

/* ---------- Password Reset (OTP-based) ---------- */

export async function requestPasswordReset({ email }) {
  if (!email) {
    throw new Errors.ValidationError("Email is required.");
  }

  // Always resolve silently to avoid revealing whether the email exists
  const author = await Author.findOne({ email }).select(RESET_SELECT);

  if (author) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    author.auth.passwordResetOTP = otp;
    author.auth.passwordResetOTPExpires = new Date(Date.now() + OTP_TTL_MS);
    author.auth.passwordResetVerified = false;

    await author.save();

    await sendEmail({
      to: author.email,
      subject: "LifeBookz - Author Password Reset OTP",
      text: `You requested a password reset for your LifeBookz author account.\n\nYour OTP is:\n\n${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest,\nThe LifeBookz Team`,
    }).catch(() => {});
  }
}

export async function verifyPasswordResetOTP({ email, otp }) {
  if (!email || !otp) {
    throw new Errors.ValidationError("Email and OTP are required.");
  }

  const author = await Author.findOne({ email }).select(RESET_SELECT);

  if (
    !author ||
    author.auth.passwordResetOTP !== otp ||
    !author.auth.passwordResetOTPExpires ||
    author.auth.passwordResetOTPExpires < new Date()
  ) {
    throw new Errors.ValidationError("Invalid or expired OTP.");
  }

  author.auth.passwordResetVerified = true;
  author.auth.passwordResetOTPExpires = undefined;

  const resetToken = crypto.randomBytes(32).toString("hex");
  author.auth.passwordResetOTP = resetToken;
  author.auth.passwordResetOTPExpires = new Date(
    Date.now() + RESET_TOKEN_TTL_MS,
  );

  await author.save();

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

  const author = await Author.findOne({
    "auth.passwordResetOTP": resetToken,
    "auth.passwordResetOTPExpires": { $gt: new Date() },
    "auth.passwordResetVerified": true,
  }).select(`+auth.passwordHash ${RESET_SELECT}`);

  if (!author) {
    throw new Errors.ValidationError(
      "Invalid or expired reset token. Please request a new OTP.",
    );
  }

  author.auth.passwordHash = password;
  author.auth.passwordResetOTP = "";
  author.auth.passwordResetOTPExpires = undefined;
  author.auth.passwordResetVerified = false;

  await author.save();
}
