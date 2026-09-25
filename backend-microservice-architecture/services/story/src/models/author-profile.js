import mongoose from "mongoose";

/**
 * AuthorProfile — the author's professional profile, owned by Story.
 *
 * Boundary decision (documented in ARCHITECTURE-MAPPING.md): the *identity*
 * (email, username, password, fullName, avatar, status, verification) is owned
 * by Auth, and Story keeps a **deliberate read-model projection** of the
 * display fields it needs to render a feed card without a cross-cluster read.
 * The professional fields (profession, bio, address, social links, covers,
 * `isProfileCompleted`) are authored here and are the feed's filter keys.
 *
 * `_id` is the Auth account id, so no extra mapping table is needed.
 */
const imageSchema = new mongoose.Schema(
  { url: { type: String, default: "", trim: true }, key: { type: String, default: "", trim: true } },
  { _id: false },
);

const socialLinksSchema = new mongoose.Schema(
  {
    website: { type: String, default: "", trim: true },
    x: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
    youtube: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    country: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    zipCode: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const authorProfileSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: false },

    // --- projection of Auth identity ---------------------------------------
    email: { type: String, lowercase: true, trim: true, default: "" },
    username: { type: String, lowercase: true, trim: true, default: "" },
    fullName: { type: String, trim: true, default: "" },
    avatar: { type: imageSchema, default: () => ({}) },
    accountStatus: { type: String, default: "active" },
    verification: {
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      verifiedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: "" },
    },
    verificationSyncedAt: { type: Date, default: null },

    // --- owned by this service ---------------------------------------------
    profession: { type: String, trim: true, maxlength: 100, default: "" },
    bio: { type: String, trim: true, maxlength: 2000, default: "" },
    phone: { type: String, trim: true, default: "" },
    dob: { type: Date, default: null },
    gender: { type: String, enum: ["Male", "Female", "Other", null], default: null },
    address: { type: addressSchema, default: () => ({}) },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    coverImage: { type: imageSchema, default: () => ({}) },
    coverImageMobile: { type: imageSchema, default: () => ({}) },

    /** Unlocks publishing, exactly as in the monolith. */
    isProfileCompleted: { type: Boolean, default: false, index: true },
    profileSubmittedAt: { type: Date, default: null },

    stats: {
      followers: { type: Number, default: 0, min: 0 },
      following: { type: Number, default: 0, min: 0 },
      stories: { type: Number, default: 0, min: 0 },
      likes: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

authorProfileSchema.index({ "verification.status": 1, accountStatus: 1 });
authorProfileSchema.index({ profession: 1 });
authorProfileSchema.index({ fullName: "text" });

export const AuthorProfile = mongoose.models.AuthorProfile || mongoose.model("AuthorProfile", authorProfileSchema);

export default AuthorProfile;
