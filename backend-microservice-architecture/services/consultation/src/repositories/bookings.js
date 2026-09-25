import mongoose from "mongoose";

import { Booking } from "../models/booking.js";
import { ProcessedEvent } from "../models/processed-event.js";
import { ExpertProfile } from "../models/expert-profile.js";

const EXPERT_CARD = "fullName username avatar expertise categories price rating sessions";
const EXPERT_CARD_KEYS = EXPERT_CARD.split(" ");

export const isValidId = (value) => mongoose.isValidObjectId(value);

/** Attach the expert card from this service's own projection (no cross-service read). */
function withExpertCard(rows) {
  return rows.map((row) => {
    const raw = row.expert;

    if (!raw || typeof raw !== "object") return row;

    const card = { id: String(raw._id) };
    for (const key of EXPERT_CARD_KEYS) card[key] = raw[key];

    return { ...row, expert: card };
  });
}

/**
 * Persistent idempotency store — same first-writer-wins pattern as Story:
 * the unique index on `eventId` makes the insert atomic, and `release` removes
 * the claim when handling failed so the SQS redelivery is actually retried.
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

export function createBookingRepository() {
  async function decorate(rows) {
    if (!rows.length) return rows;

    const ids = [...new Set(rows.map((row) => String(row.expert)).filter(Boolean))];
    const profiles = await ExpertProfile.find({ _id: { $in: ids } }).select(EXPERT_CARD).lean();
    const byId = new Map(profiles.map((profile) => [String(profile._id), profile]));

    return withExpertCard(rows.map((row) => ({ ...row, expert: byId.get(String(row.expert)) || row.expert })));
  }

  return {
    async create(doc) {
      const created = await Booking.create(doc);
      return created.toObject({ virtuals: true });
    },

    async findById(id) {
      if (!isValidId(id)) return null;
      return Booking.findById(id).lean({ virtuals: true });
    },

    async findForClient({ bookingId, clientId }) {
      if (!isValidId(bookingId)) return null;
      return Booking.findOne({ _id: bookingId, client: clientId });
    },

    async findForExpert({ bookingId, expertId }) {
      if (!isValidId(bookingId)) return null;
      return Booking.findOne({ _id: bookingId, expert: expertId });
    },

    async save(document) {
      await document.save();
      return document.toObject({ virtuals: true });
    },

    async listForClient({ clientId, limit = 50 }) {
      const rows = await Booking.find({ client: clientId })
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(limit) || 50, 100))
        .lean({ virtuals: true });

      return decorate(rows);
    },

    async listForExpert({ expertId, limit = 100 }) {
      const rows = await Booking.find({ expert: expertId })
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(limit) || 100, 200))
        .lean({ virtuals: true });

      return decorate(rows);
    },

    /**
     * Atomic status transition. `status: { $ne: to }` makes the write
     * idempotent and race-free: of two concurrent "completed" clicks exactly
     * one modifies the document, so `sessions` is incremented exactly once.
     */
    async transitionStatus({ bookingId, expertId, to, completedAt = null }) {
      if (!isValidId(bookingId)) return false;

      const result = await Booking.updateOne(
        { _id: bookingId, expert: expertId, status: { $ne: to } },
        {
          $set: {
            status: to,
            statusChangedAt: new Date(),
            ...(completedAt ? { completedAt } : {}),
          },
        },
      );

      return result.modifiedCount === 1;
    },

    async count({ expertId, status }) {
      return Booking.countDocuments({ expert: expertId, ...(status ? { status } : {}) });
    },
  };
}
