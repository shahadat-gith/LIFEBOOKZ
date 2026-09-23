import config from "../../core/config/index.js";

import Author from "../author/model.js";
import Expert from "../expert/model.js";
import User from "../user/model.js";
import Story from "../story/models/Story.js";

import { generateToken } from "../../core/utils/helpers.js";
import {
  authenticationError,
  notFoundError,
  serviceUnavailableError,
  validationError,
} from "../../core/utils/errors.js";
import { logger } from "../../core/services/logger.js";

import { sendApplicationApproved, sendApplicationRejected } from "./utils.js";

export function loginAdmin({ email, password }) {
  if (!config.admin.email || !config.admin.password || !config.admin.key) {
    throw serviceUnavailableError(
      "Admin access is not configured on this server.",
    );
  }

  if (email !== config.admin.email || password !== config.admin.password) {
    throw authenticationError("Invalid admin credentials.");
  }

  return generateToken({ role: "admin", key: config.admin.key });
}

/**
 * The single admin identity (there is exactly one, from env).
 */
export function getAdminIdentity() {
  return { email: config.admin.email, role: "admin" };
}

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
    throw notFoundError("Author not found.");
  }

  author.verification.status = "approved";
  author.verification.verifiedAt = new Date();
  author.verification.rejectionReason = "";

  await author.save();

  // Fire-and-forget: the response should not wait on SES.
  sendApplicationApproved(author.email, author.fullName, "author");

  return author;
}

export async function rejectAuthor({ authorId, reason }) {
  if (!reason?.trim()) {
    throw validationError("Rejection reason is required.");
  }

  const author = await Author.findById(authorId);

  if (!author) {
    throw notFoundError("Author not found.");
  }

  author.verification.status = "rejected";
  author.verification.verifiedAt = new Date();
  author.verification.rejectionReason = reason.trim();

  await author.save();

  sendApplicationRejected(author.email, author.fullName, reason.trim(), "author");

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

export async function listUsers() {
  const users = await User.find().sort({ createdAt: -1 }).lean();

  return users.map((user) => ({ ...user, role: "user" }));
}

export async function listStories() {
  return Story.find()
    .populate("author", "fullName")
    .sort({ createdAt: -1 })
    .lean();
}

export async function listPendingExperts() {
  const experts = await Expert.find({ "verification.status": "pending" })
    .sort({ createdAt: 1 })
    .lean();

  return experts.map((expert) => ({ ...expert, role: "expert" }));
}

export async function approveExpert({ expertId }) {
  const expert = await Expert.findById(expertId);

  if (!expert) {
    throw notFoundError("Expert not found.");
  }

  expert.verification.status = "approved";
  expert.verification.verifiedAt = new Date();
  expert.verification.rejectionReason = "";

  await expert.save();

  sendApplicationApproved(expert.email, expert.fullName, "expert");

  return expert;
}

export async function rejectExpert({ expertId, reason }) {
  if (!reason?.trim()) {
    throw validationError("Rejection reason is required.");
  }

  const expert = await Expert.findById(expertId);

  if (!expert) {
    throw notFoundError("Expert not found.");
  }

  expert.verification.status = "rejected";
  expert.verification.verifiedAt = new Date();
  expert.verification.rejectionReason = reason.trim();

  await expert.save();

  sendApplicationRejected(
    expert.email,
    expert.fullName,
    reason.trim(),
    "expert",
  );

  return expert;
}

export async function listApprovedExperts() {
  const experts = await Expert.find({ "verification.status": "approved" })
    .sort({ createdAt: -1 })
    .lean();

  return experts.map((expert) => ({ ...expert, role: "expert" }));
}
