import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    // Readers (User), authors (Author) and experts (Expert) can all follow
    // an author, so the follower's collection is stored alongside the id.
    who: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "whoModel",
      required: true,
      index: true,
    },

    whoModel: {
      type: String,
      enum: ["User", "Author", "Expert"],
      default: "User",
      required: true,
    },

    whom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
      index: true,
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

    toObject: {
      virtuals: true,
    },
  }
);

// Prevent duplicate follows
followSchema.index(
  { who: 1, whom: 1 },
  { unique: true }
);

// Fast lookups
followSchema.index({ who: 1, createdAt: -1 });
followSchema.index({ whom: 1, createdAt: -1 });

const Follow = mongoose.models.Follow || mongoose.model("Follow", followSchema);

export default Follow;