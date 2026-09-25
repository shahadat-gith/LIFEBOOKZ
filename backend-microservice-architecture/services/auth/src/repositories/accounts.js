import mongoose from "mongoose";

import { Account, ACCOUNT_ROLES } from "../models/account.js";

export const isValidId = (value) => mongoose.isValidObjectId(value);

const SECRET_PATHS = "+credentials.passwordHash +otp.hash +otp.expiresAt +otp.verifiedAt";

/** Fields a client is allowed to see. */
const PUBLIC_FIELDS = "role email username fullName avatar coverImage coverImageMobile status createdAt";

export function createAccountRepository() {
  return {
    async create(doc) {
      const account = await Account.create(doc);
      return account.toObject({ virtuals: true });
    },

    async findByEmail(email, { withSecrets = false } = {}) {
      const query = Account.findOne({ email: String(email).toLowerCase().trim() });
      if (withSecrets) query.select(SECRET_PATHS);
      return query.lean({ virtuals: true });
    },

    async findById(id, { withSecrets = false, withOtp = false } = {}) {
      if (!isValidId(id)) return null;

      const query = Account.findById(id);
      query.select(withOtp ? SECRET_PATHS : withSecrets ? "+credentials.passwordHash" : PUBLIC_FIELDS);
      return query.lean({ virtuals: true });
    },

    async findPublicById(id) {
      if (!isValidId(id)) return null;
      return Account.findById(id).select("fullName avatar coverImage coverImageMobile createdAt").lean();
    },

    /**
     * Which roles own this email address.
     *
     * The monolith had to query three collections for this; one collection
     * answers it with a single read. It is what produces the "no account found
     * — it is registered as a … account" message.
     */
    async findRolesByEmail(email) {
      const rows = await Account.find({ email: String(email).toLowerCase().trim() })
        .select("role")
        .lean();

      return rows.map((row) => row.role).filter((role) => ACCOUNT_ROLES.includes(role));
    },

    async usernameExists(username) {
      return Boolean(await Account.exists({ username: String(username).toLowerCase() }));
    },

    async emailExists(email) {
      return Boolean(await Account.exists({ email: String(email).toLowerCase().trim() }));
    },

    async updateProfile(id, { fullName, avatar, coverImage, coverImageMobile }) {
      const set = {};
      const unset = {};

      if (fullName !== undefined) set.fullName = fullName;
      for (const [field, value] of Object.entries({ avatar, coverImage, coverImageMobile })) {
        if (value === undefined) continue;
        if (value === null) unset[field] = "";
        else set[field] = value;
      }

      return Account.findByIdAndUpdate(
        id,
        { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) },
        { new: true },
      ).lean({ virtuals: true });
    },

    async setLastLogin(id, at = new Date()) {
      await Account.updateOne({ _id: id }, { $set: { lastLoginAt: at } });
    },

    /** OTP request step: only the hash + expiry are written (targeted update). */
    async setOtp(id, { hash, expiresAt, purpose }) {
      await Account.updateOne(
        { _id: id },
        {
          $set: {
            "otp.hash": hash,
            "otp.expiresAt": expiresAt,
            "otp.purpose": purpose,
            "otp.verifiedAt": null,
            "otp.attempts": 0,
          },
        },
      );
    },

    async setOtpVerified(id, { hash, expiresAt }) {
      await Account.updateOne(
        { _id: id },
        { $set: { "otp.hash": hash, "otp.expiresAt": expiresAt, "otp.verifiedAt": new Date() } },
      );
    },

    async incrementOtpAttempts(id) {
      await Account.updateOne({ _id: id }, { $inc: { "otp.attempts": 1 } });
    },

    async clearOtp(id) {
      await Account.updateOne(
        { _id: id },
        {
          $unset: { "otp.hash": "", "otp.expiresAt": "", "otp.verifiedAt": "" },
          $set: { "otp.attempts": 0 },
        },
      );
    },

    /** Look up the account a verified reset token belongs to. */
    async findByOtpHash(tokenHash) {
      if (!tokenHash) return null;

      return Account.findOne({ "otp.hash": tokenHash, "otp.expiresAt": { $gt: new Date() }, "otp.verifiedAt": { $ne: null } })
        .select("+otp.hash +otp.expiresAt +otp.verifiedAt role email username status credentials.tokenVersion")
        .lean({ virtuals: true });
    },

    /**
     * Password reset — one atomic write.
     *
     * Matching on the token hash *and* the expiry *and* the verified flag means
     * two concurrent submissions of the same token cannot both succeed, and a
     * document that predates a `required` field can still be reset (the write
     * never re-validates the rest of the profile).
     */
    async completePasswordReset({ tokenHash, passwordHash, accountId, now = new Date() }) {
      const result = await Account.updateOne(
        {
          ...(accountId ? { _id: accountId } : {}),
          "otp.hash": tokenHash,
          "otp.expiresAt": { $gt: now },
          "otp.verifiedAt": { $ne: null },
        },
        {
          $set: {
            "credentials.passwordHash": passwordHash,
            "credentials.passwordUpdatedAt": now,
          },
          $inc: { "credentials.tokenVersion": 1 },
          $unset: { "otp.hash": "", "otp.expiresAt": "", "otp.verifiedAt": "" },
        },
      );

      return result.matchedCount === 1;
    },

    async setVerification(id, { status, reason = "", decidedBy = "" }) {
      return Account.findByIdAndUpdate(
        id,
        {
          $set: {
            "verification.status": status,
            "verification.verifiedAt": new Date(),
            "verification.rejectionReason": status === "rejected" ? reason : "",
            "verification.decidedBy": decidedBy,
          },
        },
        { new: true },
      ).lean({ virtuals: true });
    },

    async setStatus(id, status) {
      return Account.findByIdAndUpdate(
        id,
        { $set: { status, ...(status === "deleted" ? { deletedAt: new Date() } : {}) } },
        { new: true },
      ).lean({ virtuals: true });
    },

    async softDelete(id) {
      return Account.findByIdAndUpdate(
        id,
        {
          $set: { status: "deleted", deletedAt: new Date() },
          $inc: { "credentials.tokenVersion": 1 },
          $unset: { "otp.hash": "", "otp.expiresAt": "", "otp.verifiedAt": "" },
        },
        { new: true },
      ).lean({ virtuals: true });
    },

    async countByRole(role) {
      return Account.countDocuments({ role, status: { $ne: "deleted" } });
    },
  };
}
