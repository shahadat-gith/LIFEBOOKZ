import mongoose from "mongoose";

/**
 * Notification — something that happened to an author's content:
 * a like, a comment, or a new follower.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["like", "comment", "follow"],
      required: true,
    },

    actorModel: {
      type: String,
      enum: ["User", "Author"],
      default: "User",
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "actorModel",
    },

    actorName: {
      type: String,
      trim: true,
      default: "",
    },

    actorAvatar: {
      type: String,
      trim: true,
      default: "",
    },

    // Story (lifebook) the event relates to, when applicable
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },

    storySlug: {
      type: String,
      trim: true,
      default: "",
    },

    // Comment preview / follow message
    preview: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },
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
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
