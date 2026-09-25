import mongoose from "mongoose";

/** Idempotency record for this service's event consumer. */
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

export const ProcessedEvent = mongoose.models.ProcessedEvent || mongoose.model("ProcessedEvent", processedEventSchema);

export default ProcessedEvent;
