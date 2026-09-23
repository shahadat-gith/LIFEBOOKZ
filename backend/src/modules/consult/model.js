import mongoose from "mongoose";
import { CONSULT_CATEGORY_IDS } from "../expert/constants.js";

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export const SESSION_TYPES = ["video", "audio", "chat"];

const bookingSchema = new mongoose.Schema(
  {
    // Logged-in users get their booking tied to the account.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Guests can still book — we keep their contact details instead.
    guestName: {
      type: String,
      trim: true,
      default: "",
    },

    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    guestPhone: {
      type: String,
      trim: true,
      default: "",
    },

    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
      index: true,
    },

    // What the person needs help with.
    problem: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },

    category: {
      type: String,
      enum: CONSULT_CATEGORY_IDS,
    },

    sessionType: {
      type: String,
      enum: SESSION_TYPES,
      default: "video",
    },

    date: {
      type: String,
      trim: true,
      default: "",
    },

    time: {
      type: String,
      trim: true,
      default: "",
    },

    // Optional extra context the user shares when booking.
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // Contact preference / urgency captured on the consult form.
    preferredContact: {
      type: String,
      enum: ["email", "phone", "video", "chat"],
      default: "email",
    },

    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "pending",
      index: true,
    },

    completedAt: {
      type: Date,
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
  },
);

bookingSchema.index({ expert: 1, status: 1, createdAt: -1 });
bookingSchema.index({ user: 1, createdAt: -1 });

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
