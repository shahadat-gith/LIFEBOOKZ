import mongoose from "mongoose";

/**
 * ProcessedEvent — consumer idempotency for System's inbound event stream.
 *
 * Same pattern as every other business service: one row per `eventId`, unique
 * index makes the duplicate-delivery check atomic, TTL removes rows after 30
 * days so the collection stays bounded without a cleanup job.
 */
const processedEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, default: "" },
    source: { type: String, default: "" },
    sqsMessageId: { type: String, default: "" },
  },
  { timestamps: true },
);

processedEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const ProcessedEvent =
  mongoose.models.ProcessedEvent || mongoose.model("ProcessedEvent", processedEventSchema);

export default ProcessedEvent;
