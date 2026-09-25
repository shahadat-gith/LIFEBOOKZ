import crypto from "crypto";
import mongoose from "mongoose";

import Author from "./model.js";
import Story from "../story/models/Story.js";

import {
  generateToken,
  hashPassword,
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
import { isFollowing } from "../following/service.js";
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
    if (strict) throw validationError("Invalid social links.");
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
    throw authenticationError("Authentication required.");
  }

  const author = await Author.findById(userId);

  if (!author) {
    throw notFoundError("Author not found.");
  }

  return author;
}

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
    throw validationError(
      "Please fill all required fields (name, email, password).",
    );
  }

  if (username.length < 3) {
    throw validationError("Username must be at least 3 characters.");
  }

  const existing = await Author.exists({ email });

  if (existing) {
    const message = "An author with this email already exists.";

    throw conflictError(message, { email: message });
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

  sendWelcomeMail({ to: author.email, name: author.fullName, role: "author" });

  return { author, token: authorToken(author) };
}

export async function loginAuthor({ email, password, ip }) {
  const author = await Author.findOne({ email }).select("+auth.passwordHash");

  if (!author) {
    const accountRoles = await findAccountRolesByEmail(email);

    await logger.warn("Author login failed — no author account for this email", {
      email,
      accountRoles,
      ip,
    });

    const message = noAccountMessage(accountRoles, "author");

    throw authenticationError(message, { email: message });
  }

  const isValid = await verifyPassword(password, author.auth.passwordHash);

  if (!isValid) {
    await logger.warn("Author login failed — incorrect password", {
      authorId: author.id,
      email,
      ip,
    });

    const message = "Incorrect password. Try again, or reset it.";

    throw authenticationError(message, { password: message });
  }

  // Pending and rejected authors can sign in too: the dashboard is where they
  // see their application state, the rejection reason and can keep their
  // profile up to date. Publishing is gated separately by `requireApproved`.
  return { author, token: authorToken(author) };
}

export async function getMyAuthorProfile(userId) {
  if (!userId) {
    throw authenticationError("Authentication required.");
  }

  const author = await Author.findById(userId).lean();

  if (!author) {
    throw notFoundError("Author not found.");
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

  // Desktop (16:9) cover variant
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

/**
 * An author as any visitor sees them.
 *
 * A signed-in reader or author also learns whether they already follow this
 * author, so the profile page can draw its follow button from the same
 * request that loads the profile instead of asking a second time. The check
 * spans every account type — readers, authors and experts all follow authors
 * through the same `Follow` rows.
 */
export async function getPublicAuthor({ authorId, viewerId } = {}) {
  const author = await Author.findById(authorId)
    .select(PUBLIC_AUTHOR_SELECT)
    .lean();

  if (!author) {
    throw notFoundError("Author not found.");
  }

  const isSelf = Boolean(viewerId) && String(viewerId) === String(author._id);

  // Nobody follows themselves, and an anonymous visitor never does. The
  // published count is derived here rather than read from the stored
  // counter, which only moves when a story is published or removed.
  const [isFollowedByLoggedInUser, storyCount] = await Promise.all([
    !viewerId || isSelf
      ? false
      : isFollowing({ userId: viewerId, authorId: author._id }),
    Story.countDocuments({
      author: author._id,
      status: "published",
      visibility: "public",
    }),
  ]);

  return {
    ...author,
    stats: { ...author.stats, stories: storyCount },
    role: "author",
    isSelf,
    isFollowedByLoggedInUser,
  };
}

export async function listMyStories({ authorId }) {
  if (!authorId) {
    throw authenticationError("Authentication required.");
  }

  return Story.find({ author: authorId }).sort({ updatedAt: -1 }).lean();
}

export async function getMyStory({ authorId, storyId }) {
  if (!authorId) {
    throw authenticationError("Authentication required.");
  }

  const story = await Story.findOne({ _id: storyId, author: authorId }).lean();

  if (!story) {
    throw notFoundError("Story not found.");
  }

  return story;
}

/**
 * Aggregated profile stats for the author's own profile page:
 * followers, following, chapters, stories, and total likes received.
 */
export async function getMyAuthorStats({ authorId }) {
  if (!authorId) {
    throw authenticationError("Authentication required.");
  }

  const Follow = (await import("../following/model.js")).default;

  // Aggregations do not cast strings for us — an unmatched ObjectId would
  // quietly report zero chapters and stories.
  const owner = new mongoose.Types.ObjectId(String(authorId));

  const [followers, following, books] = await Promise.all([
    Follow.countDocuments({ whom: authorId }),
    Follow.countDocuments({ who: authorId }),
    Story.aggregate([
      // Everything the author owns: the profile page counts drafts too.
      { $match: { author: owner } },
      {
        $project: {
          likes: { $ifNull: ["$stats.likes", 0] },
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
    following: following || 0,
    chapters: books[0]?.chapters || 0,
    stories: books[0]?.stories || 0,
    likes: books[0]?.likes || 0,
  };
}

export async function listApprovedAuthors() {
  const listed = await Author.find({ "verification.status": "approved" })
    .select("fullName profession avatar bio createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const authorIds = listed.map((a) => a._id);
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

  return listed.map((author) => ({
    ...author,
    storyCount: countMap[author._id.toString()] || 0,
  }));
}

export async function requestPasswordReset({ email }) {
  if (!email) {
    throw validationError("Email is required.");
  }

  // Always resolve silently to avoid revealing whether the email exists
  const author = await Author.findOne({ email }).select("email");

  if (!author) return;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Targeted write on purpose. Resetting a password only touches `auth`, so it
  // must not re-validate the rest of the profile — a document predating a
  // `required` field would otherwise be locked out of its own reset.
  await Author.updateOne(
    { _id: author._id },
    {
      $set: {
        "auth.passwordResetOTP": otp,
        "auth.passwordResetOTPExpires": new Date(Date.now() + OTP_TTL_MS),
        "auth.passwordResetVerified": false,
      },
    },
  );

  await sendOtpMail({ to: author.email, otp, role: "author" });
}

export async function verifyPasswordResetOTP({ email, otp }) {
  if (!email || !otp) {
    throw validationError("Email and OTP are required.");
  }

  const author = await Author.findOne({ email }).select(`email ${RESET_SELECT}`);

  if (
    !author ||
    author.auth.passwordResetOTP !== otp ||
    !author.auth.passwordResetOTPExpires ||
    author.auth.passwordResetOTPExpires < new Date()
  ) {
    throw validationError("Invalid or expired OTP.");
  }

  // Verified marks that the reset token — not the OTP — is the credential the
  // next step accepts, so the short-lived token replaces the OTP here.
  const resetToken = crypto.randomBytes(32).toString("hex");

  await Author.updateOne(
    { _id: author._id },
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
  const result = await Author.updateOne(
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
