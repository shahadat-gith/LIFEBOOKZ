import mongoose from "mongoose";

import { AuthorProfile } from "../models/author-profile.js";

export const isValidId = (value) => mongoose.isValidObjectId(value);

/** Projection of the Auth account that Story needs to render a feed card. */
const PUBLIC_SELECT =
  "fullName username profession bio avatar coverImage coverImageMobile socialLinks address createdAt verification.status accountStatus stats isProfileCompleted";

export function createAuthorProfileRepository() {
  return {
    async createFromAccount({ accountId, email, username, fullName, role }) {
      // Authors only: readers and experts have no author profile.
      if (role && role !== "author") return null;

      return AuthorProfile.findOneAndUpdate(
        { _id: accountId },
        {
          $setOnInsert: {
            _id: accountId,
            email: email || "",
            username: username || "",
            fullName: fullName || "",
            verification: { status: "pending" },
            accountStatus: "active",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean({ virtuals: true });
    },

    /** Identity projection update (name/avatar) driven by Auth events. */
    async syncIdentity({ accountId, fullName, username, avatar }) {
      const set = {};
      if (fullName !== undefined) set.fullName = fullName;
      if (username !== undefined) set.username = username;
      if (avatar !== undefined) set.avatar = typeof avatar === "string" ? { url: avatar, key: "" } : avatar;

      if (Object.keys(set).length === 0) return null;

      return AuthorProfile.findByIdAndUpdate(accountId, { $set: set }, { new: true }).lean({ virtuals: true });
    },

    async syncVerification({ accountId, status, reason = "", verifiedAt }) {
      return AuthorProfile.findByIdAndUpdate(
        accountId,
        {
          $set: {
            "verification.status": status,
            "verification.rejectionReason": reason,
            "verification.verifiedAt": verifiedAt ? new Date(verifiedAt) : new Date(),
            verificationSyncedAt: new Date(),
          },
        },
        { new: true },
      ).lean({ virtuals: true });
    },

    async syncAccountStatus({ accountId, status }) {
      return AuthorProfile.findByIdAndUpdate(accountId, { $set: { accountStatus: status } }, { new: true }).lean();
    },

    async findById(accountId, { publicOnly = false } = {}) {
      if (!isValidId(accountId)) return null;

      const query = AuthorProfile.findById(accountId);
      if (publicOnly) query.select(PUBLIC_SELECT);

      return query.lean({ virtuals: true });
    },

    async findManyByIds(ids = []) {
      if (!ids.length) return [];

      return AuthorProfile.find({ _id: { $in: ids } }).select(PUBLIC_SELECT).lean({ virtuals: true });
    },

    async updateOwned(accountId, patch) {
      return AuthorProfile.findByIdAndUpdate(accountId, { $set: patch }, { new: true }).lean({ virtuals: true });
    },

    async markProfileSubmitted(accountId) {
      return AuthorProfile.findByIdAndUpdate(
        accountId,
        { $set: { isProfileCompleted: true, profileSubmittedAt: new Date() } },
        { new: true },
      ).lean({ virtuals: true });
    },

    async incrementStats(accountId, { followers = 0, following = 0, likes = 0, stories = 0 }) {
      const inc = {};
      if (followers) inc["stats.followers"] = followers;
      if (following) inc["stats.following"] = following;
      if (likes) inc["stats.likes"] = likes;
      if (stories) inc["stats.stories"] = stories;

      if (Object.keys(inc).length === 0) return null;

      return AuthorProfile.updateOne({ _id: accountId }, { $inc: inc });
    },

    async listApproved({ limit = 50 } = {}) {
      return AuthorProfile.find({ "verification.status": "approved", accountStatus: { $ne: "deleted" } })
        .select("fullName profession avatar bio createdAt")
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(limit) || 50, 100))
        .lean();
    },

    /** Distinct professions used by the search filters (approved authors only). */
    async listProfessions() {
      const rows = await AuthorProfile.aggregate([
        { $match: { "verification.status": "approved", accountStatus: "active", profession: { $type: "string", $ne: "" } } },
        { $group: { _id: { $toLower: "$profession" }, label: { $first: "$profession" }, count: { $sum: 1 } } },
        { $sort: { count: -1, label: 1 } },
        { $limit: 50 },
      ]);

      return rows.map((row) => ({ value: row._id, label: row.label, count: row.count }));
    },
  };
}
