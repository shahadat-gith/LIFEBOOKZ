import mongoose from "mongoose";

import { BOOKING_STATUSES, CONSULT_CATEGORY_IDS, PREFERRED_CONTACTS, SESSION_TYPES } from "../constants.js";

/**
 * Booking — a consultation request.
 *
 * The client is always a signed-in reader in the new architecture: guest
 * bookings existed in the monolith because the consult form was public, but the
 * route was already guarded by `authenticate + authorize("user")`, so the guest
 * fields were only ever filled from the authenticated account. The contact
 * snapshot (`clientName`/`clientEmail`) is kept for the expert dashboard and the
 * email worker, which must not need a lookup in another service.
 */
const bookingSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    clientName: { type: String, trim: true, default: "" },
    clientEmail: { type: String, trim: true, lowercase: true, default: "" },
    clientPhone: { type: String, trim: true, default: "" },

    expert: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    problem: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, enum: CONSULT_CATEGORY_IDS },
    sessionType: { type: String, enum: SESSION_TYPES, default: "video" },
    date: { type: String, trim: true, default: "" },
    time: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    preferredContact: { type: String, enum: PREFERRED_CONTACTS, default: "email" },

    status: { type: String, enum: BOOKING_STATUSES, default: "pending", index: true },
    completedAt: { type: Date, default: null },

    /** Set once the expert ruling was acknowledged (email/idempotency guard). */
    statusChangedAt: { type: Date, default: null },
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
  },
);

bookingSchema.index({ expert: 1, status: 1, createdAt: -1 });
bookingSchema.index({ client: 1, createdAt: -1 });

export const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
