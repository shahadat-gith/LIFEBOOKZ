import mongoose from "mongoose";
import { storiesConn } from "../../shared/config/database.js";

const commentSchema = new mongoose.Schema(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, maxlength: 5000 },
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
  },
);

commentSchema.index({ story: 1, createdAt: -1 });

const Comment = storiesConn.model("Comment", commentSchema);
export default Comment;
