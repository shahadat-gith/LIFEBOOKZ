import Follow from "./model.js";
import User from "../user/model.js";
import Author from "../author/model.js";
import { createNotification } from "../notification/service.js";
import { NotFoundError, ValidationError } from "../../core/utils/errors.js";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/**
 * A reader (User) or another author (Author) follows an author; both
 * counters are bumped together on the follower's own model.
 */
export async function followAuthor({ userId, role, authorId }) {
  if (!role || !["user", "author"].includes(role)) {
    throw new ValidationError("Only signed-in users and authors can follow authors.");
  }
  if (role === "author" && String(userId) === String(authorId)) {
    throw new ValidationError("You cannot follow yourself.");
  }

  const author = await Author.findById(authorId);
  if (!author) {
    throw new NotFoundError("Author not found.");
  }

  const existing = await Follow.findOne({ who: userId, whom: authorId });
  if (existing) {
    throw new ValidationError("Already following this author.");
  }

  const followerModel = role === "author" ? Author : User;

  await Promise.all([
    Follow.create({ who: userId, whom: authorId }),
    followerModel.findByIdAndUpdate(userId, { $inc: { "stats.following": 1 } }),
    Author.findByIdAndUpdate(authorId, { $inc: { "stats.followers": 1 } }),
  ]);

  // Notify the author (best-effort)
  const follower = await followerModel
    .findById(userId)
    .select("fullName avatar")
    .lean();
  createNotification({
    recipient: { id: authorId, model: "Author" },
    type: "follow",
    actor: {
      id: userId,
      model: followerModel.modelName,
      name: follower?.fullName || "A reader",
    },
    preview: "started following you",
  });
}

/**
 * A reader (User) or another author (Author) unfollows an author; both
 * counters are decremented together on the follower's own model.
 */
export async function unfollowAuthor({ userId, role, authorId }) {
  if (!role || !["user", "author"].includes(role)) {
    throw new ValidationError("Only signed-in users and authors can unfollow authors.");
  }

  const follow = await Follow.findOneAndDelete({ who: userId, whom: authorId });

  if (!follow) {
    throw new NotFoundError("You are not following this author.");
  }

  const followerModel = role === "author" ? Author : User;

  await Promise.all([
    followerModel.findByIdAndUpdate(userId, { $inc: { "stats.following": -1 } }),
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
