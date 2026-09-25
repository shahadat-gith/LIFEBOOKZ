import mongoose from "mongoose";

/**
 * Notification — one collection serving every account type.
 *
 * Same shape as the existing backend's `modules/notification/model.js`,
 * including the polymorphic recipient/actor pair, so the notification drawer
 * keeps working unchanged. The differences are deliberate:
 *
 *  - `dedupeKey` is unique: notifications are now created by an event consumer
 *    (which can be delivered more than once), so creation has to be
 *    idempotent at the database level, not only in the idempotency table;
 *  - `recipientModel`/`actorModel` still hold `User`/`Author`/`Expert` because
 *    that is what the frontend already receives.
 */
export const NOTIFICATION_TYPES = ["like", "comment", "follow", "publish", "booking", "testimonial", "system"];

export const ACCOUNT_MODELS = ["User", "Author", "Expert"];

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    recipientModel: { type: String, enum: ACCOUNT_MODELS, required: true },

    type: { type: String, enum: NOTIFICATION_TYPES, required: true },

    // A "system" notification has no actor.
    actor: { type: mongoose.Schema.Types.ObjectId, default: null },
    actorModel: { type: String, enum: [...ACCOUNT_MODELS, "System"], default: "User" },

    title: { type: String, trim: true, default: "", maxlength: 120 },
    preview: { type: String, trim: true, default: "", maxlength: 300 },

    /** In-app route opened when the notification is clicked. */
    link: { type: String, trim: true, default: "" },

    /** The comment this notification is about (comment notifications only). */
    commentId: { type: mongoose.Schema.Types.ObjectId, default: null },

    read: { type: Boolean, default: false, index: true },

    /**
     * Deterministic key derived from the source event + recipient. A unique
     * index makes "create the notification for this event" idempotent even if
     * the consumer is retried with a different process.
     */
    dedupeKey: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.dedupeKey;
        return ret;
      },
    },
  },
);

notificationSchema.index({ recipient: 1, recipientModel: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, recipientModel: 1, read: 1, createdAt: -1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
