import Expert from "../expert/model.js";
import Booking, { SESSION_TYPES } from "./model.js";
import {
  CONSULT_CATEGORY_IDS,
  categoryLabel,
} from "../expert/constants.js";
import { logger } from "../../core/services/logger.js";
import * as Errors from "../../core/utils/errors.js";
import { createNotification } from "../notification/service.js";

// Fields the consult results cards need.
const EXPERT_SELECT =
  "fullName username expertise qualification categories bio languages experience price avatar rating sessions";

const MIN_PROBLEM_LENGTH = 10;

/* ---------- Semantic matching ---------- */

/**
 * Finds approved experts for the described problem and ranks them by
 * rating. (Semantic vector matching was removed.)
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

  // Semantic matching was removed — experts are surfaced by category and
  // ranked by rating.
  const query = {
    status: "active",
    "verification.status": "approved",
  };

  if (cleanCategory) query.categories = cleanCategory;

  let experts = await Expert.find(query).select(EXPERT_SELECT).lean();

  // Ranking: rating first.
  experts.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const results = experts
    .slice(0, safeLimit)
    .map((expert, index) => ({ ...expert, matchRank: index + 1, matchScore: null }));

  return {
    experts: results,
    category: cleanCategory || null,
    matched: false,
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
