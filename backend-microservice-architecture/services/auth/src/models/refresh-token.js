import mongoose from "mongoose";

/**
 * Refresh token — the revocable half of the session.
 *
 * Access tokens are stateless RS256 JWTs (15 min) so no service has to call
 * Auth on the hot path. Refresh tokens are the opposite: random opaque
 * strings, stored only as a SHA-256 hash, rotated on every use, and grouped
 * into a `familyId` so replay of an already-rotated token revokes the whole
 * chain instead of silently minting a new session.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    role: { type: String, required: true },

    // sha256(token) — the raw token exists only in the client and in transit.
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },

    // Claims version at issue time; compared with the account on refresh.
    tokenVersion: { type: Number, default: 0 },

    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: "" },
  },
  { timestamps: true },
);

// MongoDB deletes expired sessions for us — no cleanup job needed.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken =
  mongoose.models.RefreshToken || mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
