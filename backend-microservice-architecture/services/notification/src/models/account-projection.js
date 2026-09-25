import mongoose from "mongoose";

/**
 * AccountProjection — the recipient/actor read model.
 *
 * Notification needs two things the JWT cannot give it: the *current* display
 * name/avatar of an account that triggered something in the past, and the
 * account's email address when it has to queue a message. Both come from the
 * Auth account events this service consumes, so a renamed or re-avatar'd
 * account shows up on old notifications too — the same behaviour the monolith
 * got from `populate`.
 *
 * Exactly one writer: the Auth event stream.
 */
const accountProjectionSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: false },
    role: { type: String, enum: ["user", "author", "expert", "admin", "developer"], required: true },
    fullName: { type: String, trim: true, default: "" },
    username: { type: String, trim: true, lowercase: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    avatar: { url: { type: String, default: "" }, key: { type: String, default: "" } },
    status: { type: String, default: "active" },
  },
  { timestamps: true },
);

accountProjectionSchema.index({ email: 1 });

export const AccountProjection =
  mongoose.models.AccountProjection || mongoose.model("AccountProjection", accountProjectionSchema);

export default AccountProjection;
