import mongoose from "mongoose";

/**
 * Notification — one model serving every account type.
 *
 *  recipient     — the User, Author, or Expert being notified
 *  type          — what happened (like, comment, follow, publish,
 *                  booking, testimonial, system)
 *  actor         — who triggered it (any account type, or null for system)
 *  link          — in-app path the notification opens when clicked
 */
export const NOTIFICATION_TYPES = [
  "like",
  "comment",
  "follow",
  "publish",
  "booking",
  "testimonial",
  "system",
];

export const ACCOUNT_MODELS = ["User", "Author", "Expert"];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipientModel",
      index: true,
    },

    recipientModel: {
      type: String,
      enum: ACCOUNT_MODELS,
      required: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },

    // "System" notifications have no actor.
    actorModel: {
      type: String,
      enum: [...ACCOUNT_MODELS, "System"],
      default: "User",
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "actorModel",
      default: null,
    },

    // Denormalized for cheap rendering
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

    // Optional headline (e.g. "New consultation request")
    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },

    // Message body (comment preview, action phrase, etc.)
    preview: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    // In-app route to open when the notification is clicked
    link: {
      type: String,
      trim: true,
      default: "",
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

notificationSchema.index({ recipient: 1, recipientModel: 1, createdAt: -1 });
notificationSchema.index({
  recipient: 1,
  recipientModel: 1,
  read: 1,
  createdAt: -1,
});

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
