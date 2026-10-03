import mongoose from "mongoose";
import { CONSULT_CATEGORY_IDS } from "../constants/expert.constants.js";

import { CONSULTATION_STATUSES } from "../utils/consultation.js";

/**
 * A one-to-one consultation between a signed-in user and an approved expert.
 *
 * Lifecycle: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED, with CANCELLED /
 * EXPIRED as terminal escapes.
 *
 *   PENDING      user request waiting for the expert's decision.
 *   CONFIRMED    expert accepted — the meeting room exists; the user was
 *                emailed the join link and pays at the door.
 *   IN_PROGRESS  payment verified and the user has joined. The expert is now
 *                BUSY: no new requests reach them until this ends.
 *   COMPLETED    the expert closed the meeting; the user can rate it once.
 */

const paymentSchema = new mongoose.Schema(
  {
    provider: { type: String, default: "razorpay" },

    // Razorpay identifiers, stored for reconciliation with the dashboard.
    orderId: { type: String, trim: true, default: "" },
    paymentId: { type: String, trim: true, default: "" },
    signature: { type: String, trim: true, default: "" },

    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },

    amount: { type: Number, min: 0, default: 0 }, // paise
    currency: { type: String, default: "INR" },

    paidAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema(
  {
    startedAt: { type: Date },
    endedAt: { type: Date },
    durationSeconds: { type: Number, min: 0, default: 0 },

    // Liveness — an IN_PROGRESS session whose BOTH heartbeats go quiet is
    // force-completed by the stale sweep.
    userHeartbeatAt: { type: Date },
    expertHeartbeatAt: { type: Date },

    // Who actually joined, for audit ("exactly 1 user + 1 expert").
    userJoinedAt: { type: Date },
    expertJoinedAt: { type: Date },
  },
  { _id: false },
);

const ratingSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 1, max: 5 },
    review: { type: String, trim: true, maxlength: 2000, default: "" },
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ratedAt: { type: Date },
  },
  { _id: false },
);

const consultationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
      index: true,
    },

    // What the user needs help with (shared with the expert by email).
    problem: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 4000,
    },

    category: { type: String, enum: CONSULT_CATEGORY_IDS },

    notes: { type: String, trim: true, maxlength: 2000, default: "" },

    // Contact snapshot, so lists/emails can render names without population.
    userName: { type: String, trim: true, default: "" },
    userEmail: { type: String, trim: true, lowercase: true, default: "" },

    // Price agreed at acceptance time (expert price may change later).
    amount: { type: Number, min: 0, default: 0 }, // paise
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: CONSULTATION_STATUSES,
      default: "PENDING",
      index: true,
    },

    payment: { type: paymentSchema, default: () => ({}) },
    session: { type: sessionSchema, default: () => ({}) },
    rating: { type: ratingSchema, default: undefined },

    // Deadline that drives lazy expiry of unanswered requests.
    requestExpiresAt: { type: Date },

    cancelledBy: {
      type: String,
      enum: ["user", "expert", "system"],
    },
    cancelReason: { type: String, trim: true, maxlength: 500, default: "" },
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

    toObject: { virtuals: true },
  },
);

// List lookups per participant.
consultationSchema.index({ expert: 1, status: 1, createdAt: -1 });
consultationSchema.index({ user: 1, status: 1, createdAt: -1 });

// "Is this expert busy?" queries.
consultationSchema.index({ expert: 1, status: 1 });

// Lazy expiry sweep.
consultationSchema.index({ status: 1, requestExpiresAt: 1 });

// Reconciliation with the Razorpay dashboard — one order per consultation.
consultationSchema.index(
  { "payment.orderId": 1 },
  { unique: true, partialFilterExpression: { "payment.orderId": { $gt: "" } } },
);

// Exactly one rating per consultation, enforced by the database itself.
consultationSchema.index(
  { "rating.score": 1 },
  {
    unique: true,
    partialFilterExpression: { "rating.score": { $type: "number" } },
    name: "uniq_rating_when_rated",
  },
);

const Consultation =
  mongoose.models.Consultation ||
  mongoose.model("Consultation", consultationSchema);

export default Consultation;
