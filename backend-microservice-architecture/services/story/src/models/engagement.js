import mongoose from "mongoose";

/**
 * Engagement models.
 *
 * Like and Comment are polymorphic over the account type exactly like the
 * monolith: `whoModel` names the collection (User/Author/Expert) and drives
 * `refPath`, so one account id space can like and comment from any portal —
 * even though those collections now live in a different service's database.
 * Only the id is stored here; the display name/avatar comes from
 * Notification's/Story's own projections, never from a cross-service join.
 */
export const ACCOUNT_MODELS = ["User", "Author", "Expert"];

const likeSchema = new mongoose.Schema(
  {
    story: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    account: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountModel: { type: String, enum: ACCOUNT_MODELS, default: "User" },
  },
  { timestamps: true },
);

likeSchema.index({ story: 1, account: 1 }, { unique: true });

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, required: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const commentSchema = new mongoose.Schema(
  {
    story: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    account: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountModel: { type: String, enum: ACCOUNT_MODELS, default: "User" },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    edited: { type: Boolean, default: false },
    likes: [
      {
        account: { type: mongoose.Schema.Types.ObjectId, required: true },
        accountModel: { type: String, enum: ACCOUNT_MODELS, default: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    replies: { type: [replySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        ret.likeCount = ret.likes?.length || 0;
        return ret;
      },
    },
  },
);

commentSchema.index({ story: 1, createdAt: -1 });
commentSchema.index({ account: 1, createdAt: -1 });

const followSchema = new mongoose.Schema(
  {
    // Any account type can follow an author.
    follower: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    followerModel: { type: String, enum: ACCOUNT_MODELS, default: "User", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true },
);

followSchema.index({ follower: 1, author: 1 }, { unique: true });
followSchema.index({ author: 1, createdAt: -1 });

export const Like = mongoose.models.Like || mongoose.model("Like", likeSchema);
export const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
export const Follow = mongoose.models.Follow || mongoose.model("Follow", followSchema);
