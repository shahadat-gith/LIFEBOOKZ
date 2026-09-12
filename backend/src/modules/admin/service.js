import config from "../../core/config/index.js";

import Author from "../author/model.js";
import Expert from "../expert/model.js";
import User from "../user/model.js";
import Story from "../story/models/Story.js";

import { generateToken } from "../../core/utils/helpers.js";
import * as Errors from "../../core/utils/errors.js";
import { logger } from "../../core/services/logger.js";

import { sendApplicationApproved, sendApplicationRejected } from "./utils.js";
import { sendExpertApproved, sendExpertRejected } from "../expert/utils.js";
import {
  removeExpertVector,
  syncExpertEmbedding,
} from "../expert/embeddings.js";

/* ---------- Authentication ---------- */

export function loginAdmin({ email, password }) {
  if (!config.admin.email || !config.admin.password || !config.admin.key) {
    throw new Errors.ServiceUnavailableError(
      "Admin access is not configured on this server.",
    );
  }

  if (email !== config.admin.email || password !== config.admin.password) {
    throw new Errors.AuthenticationError("Invalid admin credentials.");
  }

  return generateToken({ role: "admin", key: config.admin.key });
}

/**
 * The single admin identity (there is exactly one, from env).
 */
export function getAdminIdentity() {
  return { email: config.admin.email, role: "admin" };
}

/* ---------- Dashboard ---------- */

export async function getDashboardStats() {
  const [
    totalUsers,
    totalAuthors,
    totalStories,
    totalExperts,
    pendingAuthors,
    pendingExperts,
  ] = await Promise.all([
    User.countDocuments(),
    Author.countDocuments(),
    Story.countDocuments({ status: "published" }),
    Expert.countDocuments(),
    Author.countDocuments({ "verification.status": "pending" }),
    Expert.countDocuments({ "verification.status": "pending" }),
  ]);

  return {
    totalUsers,
    totalAuthors,
    totalStories,
    totalExperts,
    pendingAuthors,
    pendingExperts,
  };
}

/* ---------- Authors ---------- */

export async function listPendingAuthors() {
  const authors = await Author.find({ "verification.status": "pending" })
    .sort({ createdAt: 1 })
    .lean();

  // `lean()` skips schema virtuals, so the role is added explicitly.
  return authors.map((author) => ({ ...author, role: "author" }));
}

export async function approveAuthor({ authorId }) {
  const author = await Author.findById(authorId);

  if (!author) {
    throw new Errors.NotFoundError("Author not found.");
  }

  author.verification.status = "approved";
  author.verification.verifiedAt = new Date();
  author.verification.rejectionReason = "";

  await author.save();

  // Send email without delaying the response
  sendApplicationApproved(author.email, author.fullName).catch((err) =>
    logger.error("Failed to send author approval email", {
      authorId: author.id,
      reason: err.message,
    }),
  );

  return author;
}

export async function rejectAuthor({ authorId, reason }) {
  if (!reason?.trim()) {
    throw new Errors.ValidationError("Rejection reason is required.");
  }

  const author = await Author.findById(authorId);

  if (!author) {
    throw new Errors.NotFoundError("Author not found.");
  }

  author.verification.status = "rejected";
  author.verification.verifiedAt = new Date();
  author.verification.rejectionReason = reason.trim();

  await author.save();

  sendApplicationRejected(author.email, author.fullName, reason.trim()).catch(
    (err) =>
      logger.error("Failed to send author rejection email", {
        authorId: author.id,
        reason: err.message,
      }),
  );

  return author;
}

export async function listApprovedAuthors() {
  const authors = await Author.find({ "verification.status": "approved" })
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
    role: "author",
    storyCount: countMap[author._id.toString()] || 0,
  }));
}

/* ---------- Users ---------- */

export async function listUsers() {
  const users = await User.find().sort({ createdAt: -1 }).lean();

  return users.map((user) => ({ ...user, role: "user" }));
}

/* ---------- Stories ---------- */

export async function listStories() {
  return Story.find()
    .populate("author", "fullName")
    .sort({ createdAt: -1 })
    .lean();
}

/* ---------- Experts ---------- */

export async function listPendingExperts() {
  const experts = await Expert.find({ "verification.status": "pending" })
    .sort({ createdAt: 1 })
    .lean();

  return experts.map((expert) => ({ ...expert, role: "expert" }));
}

export async function approveExpert({ expertId }) {
  const expert = await Expert.findById(expertId);

  if (!expert) {
    throw new Errors.NotFoundError("Expert not found.");
  }

  // Refresh the vector before flipping the status. Approval is refused when
  // that fails, because an approved expert without a vector would be
  // invisible in consult matching.
  await syncExpertEmbedding(expert, { force: true });

  expert.verification.status = "approved";
  expert.verification.verifiedAt = new Date();
  expert.verification.rejectionReason = "";

  await expert.save();

  sendExpertApproved(expert.email, expert.fullName).catch((err) =>
    logger.error("Failed to send expert approval email", {
      expertId: expert.id,
      reason: err.message,
    }),
  );

  return expert;
}

export async function rejectExpert({ expertId, reason }) {
  if (!reason?.trim()) {
    throw new Errors.ValidationError("Rejection reason is required.");
  }

  const expert = await Expert.findById(expertId);

  if (!expert) {
    throw new Errors.NotFoundError("Expert not found.");
  }

  expert.verification.status = "rejected";
  expert.verification.verifiedAt = new Date();
  expert.verification.rejectionReason = reason.trim();

  await expert.save();

  // Take the rejected expert out of the matching index so their vector never
  // occupies a consult result slot. Approving again rebuilds it.
  removeExpertVector(expert).catch((err) =>
    logger.warn("Failed to remove rejected expert vector", {
      expertId: expert.id,
      reason: err.message,
    }),
  );

  sendExpertRejected(expert.email, expert.fullName, reason.trim()).catch((err) =>
    logger.error("Failed to send expert rejection email", {
      expertId: expert.id,
      reason: err.message,
    }),
  );

  return expert;
}

export async function listApprovedExperts() {
  const experts = await Expert.find({ "verification.status": "approved" })
    .sort({ createdAt: -1 })
    .lean();

  return experts.map((expert) => ({ ...expert, role: "expert" }));
}
