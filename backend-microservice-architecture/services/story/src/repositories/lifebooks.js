import mongoose from "mongoose";

import { Lifebook } from "../models/lifebook.js";

const FEED_SELECT =
  "title slug chapters.order chapters.stories.title chapters.stories.storyType chapters.stories.media chapters.stories.visibility bannerImage author authorProfession language stats recentLikers featured publishedAt createdAt updatedAt status visibility";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const isValidId = (value) => mongoose.isValidObjectId(value);

export function createLifebookRepository({ authorProfiles } = {}) {
  /** Attach the author display card from this service's projection. */
  async function decorateWithAuthors(rows) {
    if (!rows.length || !authorProfiles) return rows;

    const ids = [...new Set(rows.map((row) => String(row.author)))];

    const profiles = await authorProfiles.findManyByIds(ids);
    const byId = new Map(profiles.map((profile) => [String(profile._id), profile]));

    return rows.map((row) => ({
      ...row,
      author: byId.get(String(row.author)) || null,
    }));
  }

  return {
    async create(doc) {
      const created = await Lifebook.create(doc);
      return created.toObject({ virtuals: true });
    },

    async findById(id) {
      if (!isValidId(id)) return null;
      return Lifebook.findById(id).lean({ virtuals: true });
    },

    async findByIdOrSlug(value) {
      if (!value) return null;

      if (isValidId(value)) {
        const byId = await Lifebook.findById(value).lean({ virtuals: true });
        if (byId) return byId;
      }

      return Lifebook.findOne({ slug: String(value).toLowerCase() }).lean({ virtuals: true });
    },

    async findOwned({ storyId, authorId }) {
      if (!isValidId(storyId)) return null;
      return Lifebook.findOne({ _id: storyId, author: authorId });
    },

    async save(document) {
      await document.save();
      return document.toObject({ virtuals: true });
    },

    async deleteOwned({ storyId, authorId }) {
      if (!isValidId(storyId)) return false;
      const result = await Lifebook.deleteOne({ _id: storyId, author: authorId });
      return result.deletedCount === 1;
    },

    async listDrafts({ authorId, page = 1, limit = 20 }) {
      const safeLimit = Math.min(Number(limit) || 20, 50);
      const safePage = Math.max(Number(page) || 1, 1);

      const [rows, total] = await Promise.all([
        Lifebook.find({ author: authorId })
          .sort({ updatedAt: -1 })
          .skip((safePage - 1) * safeLimit)
          .limit(safeLimit)
          .lean({ virtuals: true }),
        Lifebook.countDocuments({ author: authorId }),
      ]);

      return { items: rows, total, page: safePage, limit: safeLimit, pages: Math.max(Math.ceil(total / safeLimit), 1) };
    },

    async listMine({ authorId }) {
      return Lifebook.find({ author: authorId }).sort({ updatedAt: -1 }).lean({ virtuals: true });
    },

    async listPublished({ profession, language, sort = "recent", page = 1, limit = 12 } = {}) {
      const safeLimit = Math.min(Number(limit) || 12, 50);
      const safePage = Math.max(Number(page) || 1, 1);

      const filter = { status: "published", visibility: "public" };
      if (profession) filter.authorProfession = new RegExp(`^${escapeRegex(profession)}$`, "i");
      if (language) filter.language = language;

      const sortSpec =
        sort === "popular" ? { "stats.likes": -1, publishedAt: -1 } : sort === "featured" ? { featured: -1, publishedAt: -1 } : { publishedAt: -1 };

      const [rows, total] = await Promise.all([
        Lifebook.find(filter).select(FEED_SELECT).sort(sortSpec).skip((safePage - 1) * safeLimit).limit(safeLimit).lean({ virtuals: true }),
        Lifebook.countDocuments(filter),
      ]);

      return { items: await decorateWithAuthors(rows), total, page: safePage, limit: safeLimit, pages: Math.max(Math.ceil(total / safeLimit), 1) };
    },

    async searchPublished({ q, profession, limit = 20 }) {
      const safeLimit = Math.min(Number(limit) || 20, 50);
      const filter = { status: "published", visibility: "public" };

      if (profession) filter.authorProfession = new RegExp(`^${escapeRegex(profession)}$`, "i");
      if (q) {
        filter.$or = [
          { title: { $regex: escapeRegex(q), $options: "i" } },
          { "chapters.stories.title": { $regex: escapeRegex(q), $options: "i" } },
          { "chapters.stories.content": { $regex: escapeRegex(q), $options: "i" } },
        ];
      }

      const rows = await Lifebook.find(filter).select(FEED_SELECT).sort({ publishedAt: -1 }).limit(safeLimit).lean({ virtuals: true });

      return decorateWithAuthors(rows);
    },

    async aggregateAuthorStats(authorId) {
      const owner = new mongoose.Types.ObjectId(String(authorId));

      const rows = await Lifebook.aggregate([
        { $match: { author: owner } },
        {
          $project: {
            likes: { $ifNull: ["$stats.likes", 0] },
            chapters: { $size: { $ifNull: ["$chapters", []] } },
            stories: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$chapters", []] },
                  as: "chapter",
                  in: { $size: { $ifNull: ["$$chapter.stories", []] } },
                },
              },
            },
          },
        },
        { $group: { _id: null, likes: { $sum: "$likes" }, chapters: { $sum: "$chapters" }, stories: { $sum: "$stories" } } },
      ]);

      return { likes: rows[0]?.likes || 0, chapters: rows[0]?.chapters || 0, stories: rows[0]?.stories || 0 };
    },

    async countByAuthor({ authorId, status }) {
      return Lifebook.countDocuments({ author: authorId, ...(status ? { status } : {}) });
    },

    async incrementStats({ storyId, likes = 0, comments = 0, views = 0, shares = 0 }) {
      const inc = {};

      if (likes) inc["stats.likes"] = likes;
      if (comments) inc["stats.comments"] = comments;
      if (views) inc["stats.views"] = views;
      if (shares) inc["stats.shares"] = shares;

      if (Object.keys(inc).length === 0) return null;

      return Lifebook.updateOne({ _id: storyId }, { $inc: inc });
    },

    async pushRecentLiker({ storyId, liker, max = 5 }) {
      return Lifebook.updateOne(
        { _id: storyId },
        { $push: { recentLikers: { $each: [liker], $slice: -max } } },
      );
    },

    async removeRecentLiker({ storyId, accountId }) {
      return Lifebook.updateOne({ _id: storyId }, { $pull: { recentLikers: { account: accountId } } });
    },

    async myStats({ authorId }) {
      return this.aggregateAuthorStats(authorId);
    },

    /**
     * Keep the denormalised profession in sync so the feed filter
     * (`authorProfession`) never goes stale after a profile edit.
     */
    async updateAuthorProfession({ authorId, profession }) {
      const result = await Lifebook.updateMany(
        { author: authorId },
        { $set: { authorProfession: profession ? String(profession).toLowerCase() : null } },
      );

      return result.modifiedCount;
    },
  };
}
