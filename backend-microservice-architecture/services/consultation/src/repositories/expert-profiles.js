import mongoose from "mongoose";

import { ExpertProfile } from "../models/expert-profile.js";

/** Public card projection — everything the consult results and expert page render. */
const PUBLIC_SELECT = "fullName username expertise qualification bio categories languages experience price avatar rating ratingCount sessions coverImage isProfileCompleted verification";

export const isValidId = (value) => mongoose.isValidObjectId(value);

export function createExpertProfileRepository() {
  return {
    async findById(id) {
      if (!isValidId(id)) return null;
      return ExpertProfile.findById(id).lean({ virtuals: true });
    },

    /** Only an active, approved expert is publicly visible. */
    async findPublicById(id) {
      if (!isValidId(id)) return null;

      return ExpertProfile.findOne({ _id: id, accountStatus: "active", "verification.status": "approved" })
        .select(PUBLIC_SELECT)
        .lean({ virtuals: true });
    },

    /** Matching: approved + active, optionally narrowed to one category. */
    async listApproved({ category, limit = 5 } = {}) {
      const query = { accountStatus: "active", "verification.status": "approved" };
      if (category) query.categories = category;

      const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);

      return ExpertProfile.find(query)
        .select(PUBLIC_SELECT)
        .sort({ rating: -1, sessions: -1 })
        .limit(safeLimit)
        .lean({ virtuals: true });
    },

    /**
     * Matching without a category limit needs the full ranked candidate set so
     * the service can apply its own deterministic ranking before slicing.
     */
    async listApprovedCandidates({ category, max = 50 } = {}) {
      const query = { accountStatus: "active", "verification.status": "approved" };
      if (category) query.categories = category;

      return ExpertProfile.find(query)
        .select(PUBLIC_SELECT)
        .sort({ rating: -1, sessions: -1 })
        .limit(Math.min(Number(max) || 50, 100))
        .lean({ virtuals: true });
    },

    /** Account events create the projection row. Idempotent by `_id`. */
    async createFromAccount({ accountId, email, username, fullName }) {
      try {
        await ExpertProfile.create({ _id: accountId, email, username, fullName });
        return true;
      } catch (error) {
        // Duplicate key = the projection already exists (event redelivery).
        if (error?.code === 11000) return false;
        throw error;
      }
    },

    /** `$set` only — never `save()`, so a legacy document can't block a sync. */
    async syncIdentity({ accountId, fullName, username, avatar, email }) {
      const patch = {};

      if (fullName !== undefined) patch.fullName = fullName;
      if (username !== undefined) patch.username = username;
      if (email !== undefined) patch.email = email;
      if (avatar !== undefined && avatar && (avatar.key || avatar.url)) patch.avatar = avatar;

      if (Object.keys(patch).length === 0) return null;

      return ExpertProfile.findOneAndUpdate({ _id: accountId }, { $set: patch }, { new: true }).lean({ virtuals: true });
    },

    async syncVerification({ accountId, status, reason, verifiedAt }) {
      return ExpertProfile.findOneAndUpdate(
        { _id: accountId },
        { $set: { verification: { status, rejectionReason: reason || "", verifiedAt: status === "approved" ? verifiedAt || new Date() : null } } },
        { new: true },
      ).lean({ virtuals: true });
    },

    async syncAccountStatus({ accountId, status }) {
      return ExpertProfile.findOneAndUpdate({ _id: accountId }, { $set: { accountStatus: status } }, { new: true }).lean({ virtuals: true });
    },

    /** Owner-scoped write used by `PATCH /experts/me`. */
    async updateOwned(accountId, patch) {
      return ExpertProfile.findOneAndUpdate({ _id: accountId }, { $set: patch }, { new: true, upsert: false }).lean({ virtuals: true });
    },

    /** A completed consultation increments the expert's session counter once. */
    async incrementSessions({ accountId, by = 1 }) {
      return ExpertProfile.updateOne({ _id: accountId }, { $inc: { sessions: by } });
    },

    async exists(accountId) {
      return ExpertProfile.exists({ _id: accountId });
    },
  };
}
