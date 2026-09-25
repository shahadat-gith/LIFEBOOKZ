import mongoose from "mongoose";

/**
 * Account — the single identity document for every portal.
 *
 * The monolith keeps one collection per role (User / Author / Expert) plus an
 * environment-configured admin and developer. Because both services here need
 * to answer "which portal does this email belong to?" (that lookup is what
 * produces the existing "no account found — it is registered as a …" message)
 * and because credentials, OTP state and application status are identical for
 * all three roles, this service owns **one** collection with an explicit
 * `role` field. The role-specific *profile* fields deliberately live with the
 * domain that uses them (author profile in Story, expert profile in
 * Consultation) — see ARCHITECTURE-MAPPING.md.
 *
 * Privileged identities (admin/developer) are intentionally NOT stored here:
 * they are credentials from Secrets Manager, so a leaked database cannot mint
 * an admin.
 */
export const ACCOUNT_ROLES = ["user", "author", "expert"];
export const ACCOUNT_STATUSES = ["active", "suspended", "deleted"];
export const VERIFICATION_STATUSES = ["pending", "approved", "rejected"];
export const OTP_PURPOSES = ["password-reset"];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "", trim: true },
    key: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const verificationSchema = new mongoose.Schema(
  {
    status: { type: String, enum: VERIFICATION_STATUSES, default: "pending" },
    verifiedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "", trim: true, maxlength: 500 },
    decidedBy: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const credentialsSchema = new mongoose.Schema(
  {
    // `select: false` keeps the hash out of every query unless asked for.
    passwordHash: { type: String, required: true, select: false },
    passwordUpdatedAt: { type: Date, default: null },
    /**
     * Bumped on password reset / forced logout. A refresh attempts compares it
     * against the token's claim, which is how we invalidate every outstanding
     * access token without a denylist lookup on the hot path.
     */
    tokenVersion: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const otpSchema = new mongoose.Schema(
  {
    // Only a SHA-256 hash is stored: a database leak must not reveal a live
    // reset code. (The monolith stored the OTP verbatim.)
    hash: { type: String, default: "", select: false },
    expiresAt: { type: Date, default: null, select: false },
    verifiedAt: { type: Date, default: null, select: false },
    purpose: { type: String, enum: OTP_PURPOSES, default: "password-reset" },
    attempts: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const accountSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ACCOUNT_ROLES, required: true, index: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
      maxlength: 254,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_.-]+$/,
    },

    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },

    avatar: { type: imageSchema, default: () => ({}) },
    coverImage: { type: imageSchema, default: () => ({}) },
    coverImageMobile: { type: imageSchema, default: () => ({}) },

    status: { type: String, enum: ACCOUNT_STATUSES, default: "active", index: true },

    verification: { type: verificationSchema, default: () => ({}) },

    credentials: { type: credentialsSchema, required: true },

    otp: { type: otpSchema, default: () => ({}) },

    lastLoginAt: { type: Date, default: null },

    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.credentials;
        delete ret.otp;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Application review queues (admin) read these directly.
accountSchema.index({ "verification.status": 1, role: 1, createdAt: -1 });
accountSchema.index({ status: 1, role: 1 });

export const Account = mongoose.models.Account || mongoose.model("Account", accountSchema);
export default Account;
