import mongoose from "mongoose";

import { CONSULT_CATEGORY_IDS } from "../constants.js";

/**
 * ExpertProfile — the expert's professional profile, owned by Consultation.
 *
 * Same boundary as the author profile: Auth owns the account identity
 * (email, username, password, fullName, avatar, status, verification) and this
 * service owns the professional data it needs for matching and booking, plus a
 * deliberate projection of the identity fields a consult card renders.
 *
 * `rating`, `sessions` and the completed-session counter are owned here because
 * they are *derived from consultations*; the monolith kept them on the expert
 * document, which is exactly the coupling this split removes.
 */
const imageSchema = new mongoose.Schema(
  { url: { type: String, default: "", trim: true }, key: { type: String, default: "", trim: true } },
  { _id: false },
);

const expertProfileSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: false },

    // --- projection of the Auth account -----------------------------------
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

    // --- owned by this service --------------------------------------------
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    expertise: { type: String, trim: true, maxlength: 200, default: "" },
    qualification: { type: String, trim: true, maxlength: 300, default: "" },
    bio: { type: String, trim: true, maxlength: 2000, default: "" },
    categories: { type: [{ type: String, enum: CONSULT_CATEGORY_IDS }], default: [] },
    languages: { type: [String], default: ["English"] },
    experience: { type: Number, min: 0, max: 60, default: 0 },
    price: { type: Number, min: 0, default: 0 },

    rating: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, min: 0, default: 0 },
    sessions: { type: Number, min: 0, default: 0 },

    coverImage: { type: imageSchema, default: () => ({}) },
    coverImageMobile: { type: imageSchema, default: () => ({}) },

    isProfileCompleted: { type: Boolean, default: false, index: true },
    profileSubmittedAt: { type: Date, default: null },
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

expertProfileSchema.index({ "verification.status": 1, accountStatus: 1 });
expertProfileSchema.index({ categories: 1, rating: -1 });

export const ExpertProfile = mongoose.models.ExpertProfile || mongoose.model("ExpertProfile", expertProfileSchema);

export default ExpertProfile;
