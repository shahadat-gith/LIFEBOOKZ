import Expert from "../expert/model.js";
import Booking, { SESSION_TYPES } from "./model.js";
import {
  CONSULT_CATEGORY_IDS,
  categoryLabel,
} from "../expert/constants.js";
import { searchExpertVectors } from "../expert/embeddings.js";
import { logger } from "../../core/services/logger.js";
import * as Errors from "../../core/utils/errors.js";
import { createNotification } from "../notification/service.js";

// Fields the consult results cards need.
const EXPERT_SELECT =
  "fullName username expertise qualification categories bio languages experience price avatar rating sessions";

const MIN_PROBLEM_LENGTH = 10;

/* ---------- Semantic matching ---------- */

/**
 * Generates an embedding for the described problem, finds the closest
 * approved experts and ranks them by rating first, vector relevance second.
 * Falls back to rating-only results when embeddings are unavailable.
 */
export async function matchExperts({ problem, category, limit }) {
  const cleanProblem = problem?.trim();
  const cleanCategory = category?.trim() || "";
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);

  if (!cleanProblem || cleanProblem.length < MIN_PROBLEM_LENGTH) {
    throw new Errors.ValidationError(
      "Please describe your problem in at least 10 characters.",
    );
  }

  if (cleanCategory && !CONSULT_CATEGORY_IDS.includes(cleanCategory)) {
    throw new Errors.ValidationError("Unknown consultancy category.");
  }

  // The category is part of the query text so the vector captures intent
  // even when the problem description is short.
  const queryText = cleanCategory
    ? `${categoryLabel(cleanCategory)} consultancy. ${cleanProblem}`
    : cleanProblem;

  let hits = [];

  try {
    hits = await searchExpertVectors({
      text: queryText,
      category: cleanCategory || undefined,
      limit: Math.max(safeLimit * 4, 20),
    });
  } catch (error) {
    // Embedding/Qdrant unavailable — degrade to rating-based results
    // instead of failing the whole consult flow.
    logger.warn("Consult vector search failed — falling back to ratings", {
      category: cleanCategory || null,
      reason: error.message,
      stack: error.stack,
    });
  }

  let experts = [];

  if (hits.length) {
    const ids = hits.map((hit) => hit.payload?.expertId).filter(Boolean);

    const docs = await Expert.find({
      _id: { $in: ids },
      status: "active",
      "verification.status": "approved",
    })
      .select(EXPERT_SELECT)
      .lean();

    const docMap = new Map(docs.map((d) => [d._id.toString(), d]));
    const scoreMap = new Map(
      hits.map((hit) => [String(hit.payload?.expertId), hit.score]),
    );

    // Preserve vector relevance order while hydrating.
    experts = ids
      .map((id) => {
        const doc = docMap.get(String(id));
        return doc
          ? { ...doc, matchScore: scoreMap.get(String(id)) ?? null }
          : null;
      })
      .filter(Boolean);
  } else {
    const query = {
      status: "active",
      "verification.status": "approved",
    };

    if (cleanCategory) query.categories = cleanCategory;

    experts = (await Expert.find(query).select(EXPERT_SELECT).lean()).map(
      (expert) => ({ ...expert, matchScore: null }),
    );
  }

  // Ranking: rating first (as requested), vector relevance as tie-breaker.
  experts.sort(
    (a, b) =>
      (b.rating || 0) - (a.rating || 0) ||
      (b.matchScore || 0) - (a.matchScore || 0),
  );

  const results = experts
    .slice(0, safeLimit)
    .map((expert, index) => ({ ...expert, matchRank: index + 1 }));

  return {
    experts: results,
    category: cleanCategory || null,
    // False when we had to fall back to rating-only results.
    matched: hits.length > 0,
  };
}

/* ---------- Bookings ---------- */

/**
 * Creates a booking for the signed-in user against an approved expert.
 */
export async function createBooking({ user, input }) {
  const {
    expertId,
    problem,
    category,
    sessionType,
    date,
    time,
    notes,
    preferredContact,
  } = input;

  const cleanProblem = problem?.trim();
  const cleanCategory = category?.trim() || "";

  if (!expertId) {
    throw new Errors.ValidationError("Please choose an expert to book.");
  }

  if (!cleanProblem || cleanProblem.length < MIN_PROBLEM_LENGTH) {
    throw new Errors.ValidationError(
      "Please describe your problem in at least 10 characters.",
    );
  }

  if (cleanCategory && !CONSULT_CATEGORY_IDS.includes(cleanCategory)) {
    throw new Errors.ValidationError("Unknown consultancy category.");
  }

  if (sessionType && !SESSION_TYPES.includes(sessionType)) {
    throw new Errors.ValidationError("Unknown session type.");
  }

  if (!user?.id) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  const expert = await Expert.findOne({
    _id: expertId,
    status: "active",
    "verification.status": "approved",
  }).select("fullName expertise price categories");

  if (!expert) {
    throw new Errors.NotFoundError("Expert not found or not available.");
  }

  const booking = await Booking.create({
    user: user.id,
    // Kept as a contact snapshot so expert dashboards can render the
    // client's name/email without populating the user document.
    guestName: user.fullName || "",
    guestEmail: user.email || "",
    guestPhone: "",
    expert: expert._id,
    problem: cleanProblem,
    category: cleanCategory || undefined,
    sessionType: sessionType || "video",
    date: date?.trim() || "",
    time: time?.trim() || "",
    notes: notes?.trim() || "",
    preferredContact: preferredContact || "email",
  });

  // Notify the expert (best-effort, never blocks the booking)
  createNotification({
    recipient: { id: expert._id, model: "Expert" },
    type: "booking",
    actor: { id: user.id, model: "User", name: user.fullName || "A client" },
    title: "New consultation request",
    preview: `${user.fullName || "A client"} requested a ${sessionType || "video"} session.`,
  });

  return {
    ...booking.toObject(),
    expert: {
      id: expert.id,
      fullName: expert.fullName,
      expertise: expert.expertise,
      price: expert.price,
    },
  };
}

/**
 * The signed-in user's own bookings, newest first.
 */
export async function listMyBookings({ userId }) {
  if (!userId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  return Booking.find({ user: userId })
    .populate("expert", "fullName expertise avatar rating categories price")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * A user cancels one of their own bookings.
 */
export async function cancelMyBooking({ userId, bookingId }) {
  if (!userId) {
    throw new Errors.AuthenticationError("Authentication required.");
  }

  const booking = await Booking.findOne({ _id: bookingId, user: userId });

  if (!booking) {
    throw new Errors.NotFoundError("Booking not found.");
  }

  if (!["pending", "confirmed"].includes(booking.status)) {
    throw new Errors.ValidationError(
      `A ${booking.status} booking cannot be cancelled.`,
    );
  }

  booking.status = "cancelled";
  await booking.save();

  return booking;
}
