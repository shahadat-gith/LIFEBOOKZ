import { authenticationError } from "@lifebookz/shared-errors";

import { config } from "../config.js";
import { generateOpaqueToken, sha256 } from "./crypto.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Session lifecycle.
 *
 * Access token  : RS256 JWT, 15 minutes, validated by API Gateway (no lookups).
 * Refresh token : opaque random string, hashed at rest, rotated on every use,
 *                 revocable, with reuse detection per family.
 *
 * Revocation is therefore "eventually immediate": a revoked session dies at
 * the next refresh (≤15 minutes for the access token). That is the documented
 * trade-off of moving validation to API Gateway — the alternative, checking a
 * denylist inside every business Lambda, would reintroduce exactly the
 * coupling this architecture removes.
 */
export function createSessionService({ accounts, refreshTokens, keyProvider, publisher, logger, cfg = config }) {
  async function assertUsable(account) {
    if (!account) throw authenticationError("Account no longer exists.");
    if (account.status && account.status !== "active") {
      throw authenticationError("This account is not active. Please contact support.");
    }
  }

  async function issue({ account, familyId, role }) {
    const { token, claims } = await keyProvider.issue({
      account: {
        id: account.id || account._id,
        role: account.role,
        email: account.email,
        username: account.username,
        fullName: account.fullName,
        tokenVersion: account.credentials?.tokenVersion ?? account.tokenVersion ?? 0,
      },
    });

    const refreshToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + cfg.refreshTokenTtlDays * DAY_MS);

    await refreshTokens.store({
      accountId: account.id || account._id,
      role: account.role || role,
      tokenHash: sha256(refreshToken),
      familyId: familyId || generateOpaqueToken(16),
      tokenVersion: claims.tokenVersion,
      expiresAt,
    });

    return {
      token,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: cfg.accessTokenTtlSeconds,
      refreshExpiresAt: expiresAt.toISOString(),
      claims: {
        sub: claims.sub,
        role: claims.role,
        email: claims.email,
        username: claims.username,
        name: claims.name,
        exp: claims.exp,
        jti: claims.jti,
      },
    };
  }

  return {
    issue,

    /** Rotate a refresh token. Any anomaly revokes the whole family. */
    async refresh({ refreshToken }) {
      if (!refreshToken) throw authenticationError("A refresh token is required.");

      const tokenHash = sha256(refreshToken);
      const record = await refreshTokens.findByHash(tokenHash);

      if (!record) throw authenticationError("Invalid refresh token.");

      if (record.revokedAt) {
        throw authenticationError("This session has been revoked. Please sign in again.");
      }

      if (record.usedAt) {
        // Someone replayed a rotated token: treat the family as compromised.
        const revoked = await refreshTokens.revokeFamily(record.familyId, "reuse-detected");
        logger?.warn?.("Refresh token reuse detected — session family revoked", {
          accountId: String(record.accountId),
          familyId: record.familyId,
          revoked,
        });
        throw authenticationError("This session was already refreshed. Please sign in again.");
      }

      if (record.expiresAt && new Date(record.expiresAt) <= new Date()) {
        throw authenticationError("Your session expired. Please sign in again.");
      }

      const account = await accounts.findById(record.accountId, { withSecrets: false });

      if (!account) {
        await refreshTokens.revokeFamily(record.familyId, "account-missing");
        throw authenticationError("Account no longer exists.");
      }

      await assertUsable(account);

      const currentVersion = account.credentials?.tokenVersion ?? 0;

      if (currentVersion !== (record.tokenVersion ?? 0)) {
        // Password changed or the account was force-logged-out.
        await refreshTokens.revokeFamily(record.familyId, "token-version-changed");
        throw authenticationError("Your session is no longer valid. Please sign in again.");
      }

      await refreshTokens.markUsed(record._id);

      return issue({ account, familyId: record.familyId, role: account.role });
    },

    /** Logout: revoke the presented token, or every session for the account. */
    async revoke({ accountId, refreshToken, all = false, reason = "logout" }) {
      let revoked = 0;

      if (all && accountId) {
        revoked = await refreshTokens.revokeAllForAccount(accountId, reason);
      } else if (refreshToken) {
        revoked = await refreshTokens.revokeByHash(sha256(refreshToken), reason);
      }

      if (accountId) {
        await publisher?.publishSafely({
          type: "SessionRevoked",
          data: { accountId: String(accountId), reason, revoked },
          actor: { accountId: String(accountId) },
        });
      }

      return { revoked };
    },

    /** Called after a password reset: every existing session must die. */
    async revokeAllForAccount(accountId, reason = "password-reset") {
      const revoked = await refreshTokens.revokeAllForAccount(accountId, reason);

      await publisher?.publishSafely({
        type: "SessionRevoked",
        data: { accountId: String(accountId), reason, revoked },
        actor: { accountId: String(accountId) },
      });

      return { revoked };
    },
  };
}
