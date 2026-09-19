import Follow from "./model.js";
import User from "../user/model.js";
import Author from "../author/model.js";
import Expert from "../expert/model.js";
import { createNotification } from "../notification/service.js";
import { NotFoundError, ValidationError } from "../../core/utils/errors.js";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// Anyone with a LifeBookz account can follow an author.
const FOLLOWER_MODELS = { User, Author, Expert };
const FOLLOWER_ROLES = ["user", "author", "expert"];

const ROLE_TO_MODEL = { user: "User", author: "Author", expert: "Expert" };

// Rows created before `whoModel` existed were always readers.
const followerModelOf = (follow) => follow?.whoModel || "User";

/**
 * Replaces each follow's `who` id with the actual account document, looking
 * the ids up per collection (a plain populate cannot span several models).
 */
async function withFollowerAccounts(follows) {
  const idsByModel = new Map();

  for (const follow of follows) {
    const model = followerModelOf(follow);
    if (!idsByModel.has(model)) idsByModel.set(model, new Set());
    idsByModel.get(model).add(String(follow.who));
  }

  const accounts = new Map();

  await Promise.all(
    [...idsByModel.entries()].map(async ([model, ids]) => {
      const Model = FOLLOWER_MODELS[model];
      if (!Model) return;

      const people = await Model.find({ _id: { $in: [...ids] } })
        .select("fullName username avatar profession")
        .lean();

      people.forEach((person) => {
        accounts.set(`${model}:${person._id}`, person);
      });
    }),
  );

  return follows.map((follow) => {
    const model = followerModelOf(follow);

    return {
      ...follow,
      whoModel: model,
      who: accounts.get(`${model}:${follow.who}`) || null,
    };
  });
}

/**
 * A reader (User) or another author (Author) follows an author; both
 * counters are bumped together on the follower's own model.
 */
export async function followAuthor({ userId, role, authorId }) {
  if (!role || !FOLLOWER_ROLES.includes(role)) {
    throw new ValidationError(
      "Only signed-in readers, authors and experts can follow authors.",
    );
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

  const whoModel = ROLE_TO_MODEL[role] || "User";
  const followerModel = FOLLOWER_MODELS[whoModel];

  await Promise.all([
    Follow.create({ who: userId, whoModel, whom: authorId }),
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
      model: whoModel,
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
  if (!role || !FOLLOWER_ROLES.includes(role)) {
    throw new ValidationError(
      "Only signed-in readers, authors and experts can unfollow authors.",
    );
  }

  const follow = await Follow.findOneAndDelete({ who: userId, whom: authorId });

  if (!follow) {
    throw new NotFoundError("You are not following this author.");
  }

  const followerModel = FOLLOWER_MODELS[ROLE_TO_MODEL[role] || "User"];

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
  const follows = await Follow.find({ whom: authorId })
    .sort({ createdAt: -1 })
    .lean();

  return withFollowerAccounts(follows);
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
