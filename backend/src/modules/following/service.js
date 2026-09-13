import Follow from "./model.js";
import User from "../user/model.js";
import Author from "../author/model.js";
import { createNotification } from "../notification/service.js";
import { NotFoundError, ValidationError } from "../../core/utils/errors.js";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/**
 * A user follows an author and both counters are bumped together.
 */
export async function followAuthor({ userId, role, authorId }) {
  if (role !== "user") {
    throw new ValidationError("Only users can follow authors.");
  }

  const author = await Author.findById(authorId);
  if (!author) {
    throw new NotFoundError("Author not found.");
  }

  const existing = await Follow.findOne({ who: userId, whom: authorId });
  if (existing) {
    throw new ValidationError("Already following this author.");
  }

  await Promise.all([
    Follow.create({ who: userId, whom: authorId }),
    User.findByIdAndUpdate(userId, { $inc: { "stats.following": 1 } }),
    Author.findByIdAndUpdate(authorId, { $inc: { "stats.followers": 1 } }),
  ]);

  // Notify the author (best-effort)
  const follower = await User.findById(userId).select("fullName avatar").lean();
  createNotification({
    recipient: authorId,
    type: "follow",
    actor: userId,
    actorName: follower?.fullName || "A reader",
    actorAvatar: follower?.avatar || "",
    preview: "started following you",
  });
}

/**
 * A user unfollows an author and both counters are decremented together.
 */
export async function unfollowAuthor({ userId, role, authorId }) {
  if (role !== "user") {
    throw new ValidationError("Only users can unfollow authors.");
  }

  const follow = await Follow.findOneAndDelete({ who: userId, whom: authorId });

  if (!follow) {
    throw new NotFoundError("You are not following this author.");
  }

  await Promise.all([
    User.findByIdAndUpdate(userId, { $inc: { "stats.following": -1 } }),
    Author.findByIdAndUpdate(authorId, { $inc: { "stats.followers": -1 } }),
  ]);
}

/**
 * Whether the given user follows the given author.
 */
export async function isFollowing({ userId, authorId }) {
  if (!userId) return false;

  const existing = await Follow.findOne({ who: userId, whom: authorId });
  return Boolean(existing);
}

/**
 * Everyone following an author.
 */
export async function getFollowers({ authorId }) {
  return Follow.find({ whom: authorId })
    .populate("who", "fullName avatar")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Everyone a user follows. An invalid id simply yields an empty list rather
 * than a Mongoose CastError.
 */
export async function getFollowing({ userId }) {
  if (
    !userId ||
    userId === "undefined" ||
    userId === "null" ||
    !OBJECT_ID.test(userId)
  ) {
    return [];
  }

  return Follow.find({ who: userId })
    .populate("whom", "fullName avatar profession")
    .sort({ createdAt: -1 })
    .lean();
}
