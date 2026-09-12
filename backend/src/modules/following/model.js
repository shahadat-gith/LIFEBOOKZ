import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    who: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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