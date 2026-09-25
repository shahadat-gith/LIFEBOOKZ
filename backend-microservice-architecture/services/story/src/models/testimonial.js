import mongoose from "mongoose";

import { ACCOUNT_MODELS } from "./engagement.js";

/**
 * Testimonial — public social proof written by any account type and moderated
 * by an admin. It is content, so it lives with the content domain (Story), not
 * with admin/system operations.
 */
const testimonialSchema = new mongoose.Schema(
  {
    personType: { type: String, enum: ACCOUNT_MODELS, required: true },
    person: { type: mongoose.Schema.Types.ObjectId, required: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    status: { type: String, enum: ["approved", "hidden"], default: "approved", index: true },
  },
  { timestamps: true },
);

testimonialSchema.index({ personType: 1, person: 1 }, { unique: true });

/**
 * Idempotency record for event consumers.
 *
 * A unique index on `eventId` makes `claim()` an atomic first-writer-wins
 * insert; the TTL index removes old rows so the collection stays small. This is
 * the persistent mechanism the spec requires — never an in-memory Set.
 */
const processedEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    source: { type: String, default: "" },
    sqsMessageId: { type: String, default: "" },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

processedEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const Testimonial = mongoose.models.Testimonial || mongoose.model("Testimonial", testimonialSchema);
export const ProcessedEvent = mongoose.models.ProcessedEvent || mongoose.model("ProcessedEvent", processedEventSchema);
