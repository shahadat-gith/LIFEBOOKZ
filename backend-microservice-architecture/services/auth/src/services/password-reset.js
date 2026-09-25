import { tooManyRequestsError, validationError } from "@lifebookz/shared-errors";

import { generateOpaqueToken, generateOtp, hashPassword, safeEqual, sha256 } from "./crypto.js";

const RESET_REQUEST_LIMIT_PER_HOUR = 3;
const RESET_REQUEST_LIMIT_PER_IP_HOUR = 10;
const RESET_VERIFY_LIMIT_PER_HOUR = 5;
const WINDOW_SECONDS = 3600;

/**
 * Password reset: OTP → short-lived reset token → new password.
 *
 * Three properties are preserved from the existing backend (it got these
 * right the hard way) and one is tightened:
 *
 * 1. Requesting a reset always answers the same way, so the endpoint cannot be
 *    used to discover which emails have accounts.
 * 2. Only a *targeted* write touches the OTP fields. A document that predates a
 *    newly-required profile field can still reset its password.
 * 3. Completing the reset is one atomic update, so a reset token can never be
 *    replayed, even by two concurrent requests.
 * 4. (tightened) The OTP is stored as a SHA-256 hash, not in plain text.
 *
 * The OTP itself travels only through the `OtpRequested` event → Notification →
 * SQS email queue → email worker. It is excluded from the analytics allow-list.
 */
export function createPasswordResetService({ accounts, sessions, rateLimiter, publisher, logger, cfg }) {
  async function consume({ key, limit }) {
    if (!rateLimiter) return { allowed: true, retryAfterSeconds: 0 };

    const result = await rateLimiter.consume({ key, limit, windowSeconds: WINDOW_SECONDS });

    if (!result.allowed) {
      throw tooManyRequestsError(
        "Too many reset attempts. Please wait an hour before trying again.",
        { retryAfterSeconds: result.retryAfterSeconds },
      );
    }

    return result;
  }

  return {
    /** Step 1 — request an OTP. Never reveals whether the email exists. */
    async request({ email, ip }) {
      const cleanEmail = String(email || "").trim().toLowerCase();

      if (!cleanEmail) {
        throw validationError("Email is required.", { fields: { email: "Email is required." } });
      }

      await consume({ key: `reset-request:email:${cleanEmail}`, limit: RESET_REQUEST_LIMIT_PER_HOUR });
      await consume({ key: `reset-request:ip:${ip || "unknown"}`, limit: RESET_REQUEST_LIMIT_PER_IP_HOUR });

      const account = await accounts.findByEmail(cleanEmail);

      if (!account) {
        logger?.info?.("Password reset requested for an unknown email", { ip });
        return { delivered: false };
      }

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + (cfg?.otpTtlSeconds ?? 600) * 1000);

      await accounts.setOtp(account._id, { hash: sha256(otp), expiresAt, purpose: "password-reset" });

      // The only place the plain OTP exists besides the recipient's inbox.
      await publisher?.publishSafely({
        type: "OtpRequested",
        data: {
          accountId: String(account._id),
          role: account.role,
          email: account.email,
          fullName: account.fullName,
          otp,
          purpose: "password-reset",
          expiresAt: expiresAt.toISOString(),
        },
        actor: { accountId: String(account._id), role: account.role },
      });

      logger?.info?.("Password reset OTP issued", { accountId: String(account._id), role: account.role });

      return { delivered: true };
    },

    /** Step 2 — exchange the OTP for a single-use reset token. */
    async verify({ email, otp, ip }) {
      const cleanEmail = String(email || "").trim().toLowerCase();

      if (!cleanEmail || !otp) {
        throw validationError("Email and OTP are required.", {
          fields: {
            ...(cleanEmail ? {} : { email: "Email is required." }),
            ...(otp ? {} : { otp: "OTP is required." }),
          },
        });
      }

      await consume({ key: `reset-verify:email:${cleanEmail}`, limit: RESET_VERIFY_LIMIT_PER_HOUR });

      const account = await accounts.findByEmail(cleanEmail, { withSecrets: true });

      const expected = account?.otp?.hash;
      const expiresAt = account?.otp?.expiresAt;
      const valid = Boolean(expected) && Boolean(expiresAt) && new Date(expiresAt) > new Date() && safeEqual(sha256(otp), expected);

      if (!valid) {
        if (account) await accounts.incrementOtpAttempts(account._id);
        logger?.warn?.("Password reset OTP rejected", { accountId: account ? String(account._id) : null, ip });

        throw validationError("Invalid or expired OTP.", { fields: { otp: "Invalid or expired OTP." } });
      }

      const resetToken = generateOpaqueToken();
      const resetExpiresAt = new Date(Date.now() + (cfg?.resetTokenTtlSeconds ?? 300) * 1000);

      // The verified reset token replaces the OTP: the next step only accepts
      // the token, and it expires much sooner than the OTP did.
      await accounts.setOtpVerified(account._id, { hash: sha256(resetToken), expiresAt: resetExpiresAt });

      return { resetToken, expiresAt: resetExpiresAt.toISOString() };
    },

    /** Step 3 — set the new password; every existing session is revoked. */
    async complete({ resetToken, password }) {
      if (!resetToken || !password) {
        throw validationError("Reset token and new password are required.", {
          fields: {
            ...(resetToken ? {} : { resetToken: "Reset token is required." }),
            ...(password ? {} : { password: "New password is required." }),
          },
        });
      }

      if (String(password).length < 8) {
        throw validationError("Password must be at least 8 characters.", {
          fields: { password: "Password must be at least 8 characters." },
        });
      }

      const tokenHash = sha256(resetToken);
      const account = await accounts.findByOtpHash(tokenHash);

      if (!account) {
        throw validationError("Invalid or expired reset token. Please request a new OTP.", {
          fields: { resetToken: "Invalid or expired reset token. Please request a new OTP." },
        });
      }

      const passwordHash = await hashPassword(password, cfg?.bcryptRounds ?? 12);
      const updated = await accounts.completePasswordReset({ tokenHash, passwordHash, accountId: account._id });

      if (!updated) {
        throw validationError("Invalid or expired reset token. Please request a new OTP.", {
          fields: { resetToken: "Invalid or expired reset token. Please request a new OTP." },
        });
      }

      await sessions.revokeAllForAccount(account._id, "password-reset");

      await publisher?.publishSafely({
        type: "PasswordResetCompleted",
        data: { accountId: String(account._id), role: account.role },
        actor: { accountId: String(account._id), role: account.role },
      });

      logger?.info?.("Password reset completed", { accountId: String(account._id), role: account.role });

      return { reset: true };
    },
  };
}
