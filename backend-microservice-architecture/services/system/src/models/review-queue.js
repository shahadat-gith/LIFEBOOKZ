import mongoose from "mongoose";

/**
 * ReviewQueue — System's read model of author/expert applications.
 *
 * The *verification state itself* is owned by Auth (the Account document);
 * System only mirrors what the admin review screens show, exactly the same
 * deliberate-projection rule every other service follows. Written by the
 * `AuthorProfileSubmitted` / `ExpertProfileSubmitted` /
 * `AccountVerificationDecided` event stream — never by direct cross-cluster
 * queries against Auth or the business services.
 *
 * `_id` is the Auth account id.
 */
const reviewQueueSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: false },

    role: { type: String, enum: ["author", "expert"], required: true, index: true },

    // Projection of the Auth identity (the admin cards show these).
    email: { type: String, lowercase: true, trim: true, default: "" },
    username: { type: String, lowercase: true, trim: true, default: "" },
    fullName: { type: String, trim: true, default: "" },

    // Domain summary of what was submitted.
    summary: {
      profession: { type: String, default: "" }, // authors
      expertise: { type: String, default: "" }, // experts
      categories: { type: [String], default: [] }, // experts
    },

    // Mirror of Auth's verification state (single writer: the event stream).
    verification: {
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
      verifiedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: "" },
    },

    submittedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

reviewQueueSchema.index({ role: 1, "verification.status": 1, submittedAt: 1 });

export const ReviewQueue =
  mongoose.models.ReviewQueue || mongoose.model("ReviewQueue", reviewQueueSchema);

export default ReviewQueue;
