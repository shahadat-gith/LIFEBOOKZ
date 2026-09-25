import { ReviewQueue } from "../models/review-queue.js";

export function createReviewQueueRepository() {
  return {
    async upsertSubmitted({ accountId, role, email, username, fullName, summary, submittedAt }) {
      return ReviewQueue.findByIdAndUpdate(
        accountId,
        {
          $set: {
            role,
            ...(email !== undefined ? { email } : {}),
            ...(username !== undefined ? { username } : {}),
            ...(fullName !== undefined ? { fullName } : {}),
            ...(summary ? { summary } : {}),
            submittedAt: submittedAt || new Date(),
            "verification.status": "pending",
            "verification.rejectionReason": "",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, omitUndefined: true },
      ).lean();
    },

    async syncVerification({ accountId, status, reason, verifiedAt }) {
      return ReviewQueue.findByIdAndUpdate(
        accountId,
        {
          $set: {
            "verification.status": status,
            "verification.rejectionReason": status === "rejected" ? reason || "" : "",
            "verification.verifiedAt": verifiedAt ? new Date(verifiedAt) : new Date(),
          },
        },
        { new: true, omitUndefined: true },
      ).lean();
    },

    async syncIdentity({ accountId, role, email, username, fullName }) {
      const patch = {};
      if (email !== undefined) patch.email = email;
      if (username !== undefined) patch.username = username;
      if (fullName !== undefined) patch.fullName = fullName;

      if (Object.keys(patch).length === 0) return null;

      return ReviewQueue.findOneAndUpdate({ _id: accountId, role }, { $set: patch }, { new: true }).lean();
    },

    async listByStatus(role, status, { limit = 100 } = {}) {
      return ReviewQueue.find({ role, "verification.status": status })
        .sort(status === "pending" ? { submittedAt: 1 } : { "verification.verifiedAt": -1 })
        .limit(limit)
        .lean();
    },

    async counts() {
      const [pendingAuthors, pendingExperts, approvedAuthors, approvedExperts] = await Promise.all([
        ReviewQueue.countDocuments({ role: "author", "verification.status": "pending" }),
        ReviewQueue.countDocuments({ role: "expert", "verification.status": "pending" }),
        ReviewQueue.countDocuments({ role: "author", "verification.status": "approved" }),
        ReviewQueue.countDocuments({ role: "expert", "verification.status": "approved" }),
      ]);

      return { pendingAuthors, pendingExperts, approvedAuthors, approvedExperts };
    },
  };
}
