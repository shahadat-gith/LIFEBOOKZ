import { RefreshToken } from "../models/refresh-token.js";

export function createRefreshTokenRepository() {
  return {
    async store({ accountId, role, tokenHash, familyId, tokenVersion, expiresAt }) {
      return RefreshToken.create({ accountId, role, tokenHash, familyId, tokenVersion, expiresAt });
    },

    async findByHash(tokenHash) {
      return RefreshToken.findOne({ tokenHash }).lean();
    },

    /** Rotation: mark the presented token as used. */
    async markUsed(id, at = new Date()) {
      return RefreshToken.findByIdAndUpdate(id, { $set: { usedAt: at } }, { new: true }).lean();
    },

    /**
     * Reuse detection: whoever presents an already-used token gets the whole
     * family revoked, so a stolen refresh token cannot be replayed after the
     * legitimate client has rotated it.
     */
    async revokeFamily(familyId, reason = "reuse-detected") {
      const result = await RefreshToken.updateMany(
        { familyId, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: reason } },
      );

      return result.modifiedCount;
    },

    async revokeAllForAccount(accountId, reason = "logout") {
      const result = await RefreshToken.updateMany(
        { accountId, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: reason } },
      );

      return result.modifiedCount;
    },

    async revokeByHash(tokenHash, reason = "logout") {
      const result = await RefreshToken.updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: reason } },
      );

      return result.modifiedCount;
    },

    async countActive(accountId) {
      return RefreshToken.countDocuments({ accountId, revokedAt: null, expiresAt: { $gt: new Date() } });
    },
  };
}
