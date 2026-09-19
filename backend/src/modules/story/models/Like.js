import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },

    /**
     * The account that liked the story. `userModel` names its collection and
     * drives `refPath`, so readers, authors and experts can all like a story
     * and the liker's details are populated on read rather than copied here.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      refPath: "userModel",
    },

    userModel: {
      type: String,
      enum: ["User", "Author", "Expert"],
      default: "User",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        return ret;
      },
    },
  }
);

likeSchema.index({ story: 1, user: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema);

export default Like;