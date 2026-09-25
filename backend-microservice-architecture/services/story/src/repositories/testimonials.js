import mongoose from "mongoose";

import { ProcessedEvent, Testimonial } from "../models/testimonial.js";

/**
 * Persistent idempotency store for this service's event consumer.
 *
 * `claim` relies on the unique index on `eventId`: the insert either wins (first
 * delivery → process) or throws a duplicate-key error (redelivery → skip).
 * `release` deletes the row when processing failed, so the SQS redelivery is
 * retried instead of being mistaken for a duplicate.
 */
export function createProcessedEventStore() {
  return {
    async claim(eventId, meta = {}) {
      try {
        await ProcessedEvent.create({
          eventId,
          eventType: meta.eventType || "unknown",
          source: meta.source || "",
          sqsMessageId: meta.sqsMessageId || "",
        });

        return true;
      } catch (error) {
        if (error?.code === 11000) return false;
        throw error;
      }
    },

    async release(eventId) {
      await ProcessedEvent.deleteOne({ eventId });
    },
  };
}

export function createTestimonialRepository() {
  return {
    async list({ limit = 20 } = {}) {
      const safeLimit = Math.min(Number(limit) || 20, 50);

      return Testimonial.find({ status: { $ne: "hidden" } })
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .lean();
    },

    async findMine({ person, personType }) {
      return Testimonial.findOne({ person, personType }).lean();
    },

    async findById(id) {
      if (!mongoose.isValidObjectId(id)) return null;
      return Testimonial.findById(id).lean();
    },

    async upsert({ person, personType, message, rating }) {
      const existing = await Testimonial.findOne({ person, personType });

      if (existing) {
        existing.message = message;
        existing.rating = rating;
        existing.status = "approved";
        await existing.save();

        return existing.toJSON();
      }

      const created = await Testimonial.create({ person, personType, message, rating });

      return created.toJSON();
    },

    async delete(id) {
      const result = await Testimonial.deleteOne({ _id: id });

      return result.deletedCount === 1;
    },

    async setStatus({ id, status }) {
      return Testimonial.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
    },
  };
}
