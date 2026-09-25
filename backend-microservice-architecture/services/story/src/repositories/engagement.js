import mongoose from "mongoose";

import { Comment, Follow, Like } from "../models/engagement.js";

/** Account type → the collection name stored on polymorphic rows. */
export const MODEL_BY_ROLE = { user: "User", author: "Author", expert: "Expert" };
export const modelForRole = (role) => MODEL_BY_ROLE[role] || "User";

export function createEngagementRepository() {
  return {
    // ------------------------------------------------------------------ likes
    async findLike({ storyId, accountId }) {
      return Like.findOne({ story: storyId, account: accountId }).lean();
    },

    async createLike({ storyId, accountId, accountModel }) {
      return Like.create({ story: storyId, account: accountId, accountModel });
    },

    async deleteLike({ storyId, accountId }) {
      const result = await Like.deleteOne({ story: storyId, account: accountId });

      return result.deletedCount === 1;
    },

    async countLikes(storyId) {
      return Like.countDocuments({ story: storyId });
    },

    async listLikes(storyId, limit = 50) {
      return Like.find({ story: storyId }).sort({ createdAt: -1 }).limit(limit).lean();
    },

    async likedStoryIds({ accountId, storyIds }) {
      if (!accountId || storyIds.length === 0) return new Set();

      const rows = await Like.find({ account: accountId, story: { $in: storyIds } }).select("story").lean();

      return new Set(rows.map((row) => String(row.story)));
    },

    // --------------------------------------------------------------- comments
    async createComment({ storyId, accountId, accountModel, content }) {
      const created = await Comment.create({ story: storyId, account: accountId, accountModel, content });

      return created.toJSON();
    },

    async findCommentById(commentId) {
      if (!mongoose.isValidObjectId(commentId)) return null;
      return Comment.findById(commentId);
    },

    async listComments({ storyId, page = 1, limit = 20 }) {
      const safeLimit = Math.min(Number(limit) || 20, 50);
      const safePage = Math.max(Number(page) || 1, 1);

      const [rows, total] = await Promise.all([
        Comment.find({ story: storyId })
          .sort({ createdAt: -1 })
          .skip((safePage - 1) * safeLimit)
          .limit(safeLimit)
          .lean(),
        Comment.countDocuments({ story: storyId }),
      ]);

      return { items: rows, total, page: safePage, limit: safeLimit, pages: Math.max(Math.ceil(total / safeLimit), 1) };
    },

    async countComments(storyId) {
      return Comment.countDocuments({ story: storyId });
    },

    // ---------------------------------------------------------------- follows
    async findFollow({ followerId, authorId }) {
      return Follow.findOne({ follower: followerId, author: authorId }).lean();
    },

    async createFollow({ followerId, followerModel, authorId }) {
      return Follow.create({ follower: followerId, followerModel, author: authorId });
    },

    async deleteFollow({ followerId, authorId }) {
      const result = await Follow.deleteOne({ follower: followerId, author: authorId });

      return result.deletedCount === 1;
    },

    async countFollowers(authorId) {
      return Follow.countDocuments({ author: authorId });
    },

    async countFollowing(accountId) {
      return Follow.countDocuments({ follower: accountId });
    },

    async listFollowers(authorId, { limit = 50 } = {}) {
      return Follow.find({ author: authorId }).sort({ createdAt: -1 }).limit(limit).lean();
    },

    async listFollowing(accountId, { limit = 50 } = {}) {
      return Follow.find({ follower: accountId }).sort({ createdAt: -1 }).limit(limit).lean();
    },
  };
}
