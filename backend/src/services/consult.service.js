import mongoose from "mongoose";

import Expert from "../models/Expert.js";
import Consultation from "../models/Consultation.js";
import { CONSULT_CATEGORY_IDS } from "../constants/expert.constants.js";
import config from "../config/index.js";
import { logger } from "./logger.service.js";
import {
  sendBookingRequestMail,
  sendBookingStatusMail,
} from "./mailer.service.js";
import * as paymentService from "./payment.service.js";

import {
  authenticationError,
  conflictError,
  forbiddenError,
  notFoundError,
  validationError,
} from "../utils/errors.js";

import {
  BUSY_STATUSES,
  CONSULTATION_STATUSES,
  PAYABLE_STATUSES,
  buildExpertOccupiedFilter,
  decideWebhookAction,
  isSessionStale,
  lastActivityAt,
  sessionDurationSeconds,
} from "../utils/consultation.js";

// Fields the consult results cards need.
const EXPERT_SELECT =
  "fullName username expertise qualification categories bio languages experience price avatar rating ratingCount sessions";

const MIN_PROBLEM_LENGTH = 10;

const FREE_AMOUNT = 0;

/** The room link emailed to the user once the expert confirms. */
export function roomUrlFor(consultationId) {
  const base = (config.frontend.client || "").replace(/\/$/, "");
  return `${base}/consult/${consultationId}/session`;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

let transactionsSupported = true;

/**
 * Runs `fn` inside a MongoDB transaction with brief retries on write
 * conflicts. On deployments without replica-set transactions (some local
 * setups) it falls back to running `fn` directly — the services then rely on
 * atomic update conditions for safety, which they always do anyway.
 */
export async function runInTransaction(fn) {
  // No live connection (unit tests, tooling) → run directly; the atomic
  // update conditions below carry the safety on their own.
  if (mongoose.connection.readyState !== 1) return fn(null);
  if (!transactionsSupported) return fn(null);

  try {
    return await mongoose.connection.transaction(fn, {
      readPreference: "primary",
      readConcern: { level: "local" },
      writeConcern: { w: "majority" },
    });
  } catch (error) {
    if (/Transaction numbers are only allowed/i.test(error?.message || "")) {
      transactionsSupported = false;
      logger.warn("MongoDB transactions unavailable — falling back to atomic updates.");
      return fn(null);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Lazy sweeps — no cron needed on Lambda; every relevant endpoint sweeps.
// ---------------------------------------------------------------------------

/**
 * Expires requests nobody accepted, and force-completes abandoned
 * IN_PROGRESS sessions. Cheap, indexed, idempotent.
 */
export async function expireStaleConsultations() {
  const now = new Date();
  const staleSessionMs = config.consult.sessionStaleMinutes * 60 * 1000;

  // Requests that no expert accepted in time.
  const expiredRequests = await Consultation.updateMany(
    { status: "PENDING", requestExpiresAt: { $lt: now } },
    { $set: { status: "EXPIRED", cancelledBy: "system", cancelReason: "Request expired." } },
  );

  // Sessions both participants walked away from.
  const inProgress = await Consultation.find({ status: "IN_PROGRESS" })
    .select("session expert")
    .lean();

  let abandoned = 0;
  for (const doc of inProgress) {
    if (!isSessionStale(doc.session, staleSessionMs, now.getTime())) continue;

    const endedAt = lastActivityAt(doc.session);
    await Consultation.updateOne(
      { _id: doc._id, status: "IN_PROGRESS" },
      {
        $set: {
          status: "COMPLETED",
          "session.endedAt": endedAt,
          "session.durationSeconds": sessionDurationSeconds(doc.session.startedAt, endedAt),
        },
      },
    );
    await Expert.updateOne({ _id: doc.expert }, { $inc: { sessions: 1 } });
    abandoned += 1;
  }

  if (expiredRequests.modifiedCount || abandoned) {
    logger.info("Consultation sweep", {
      expiredRequests: expiredRequests.modifiedCount,
      abandoned,
    });
  }
}

// ---------------------------------------------------------------------------
// Discovery — only AVAILABLE experts are shown
// ---------------------------------------------------------------------------

/**
 * Approved experts for the described problem, ranked by rating.
 * Experts currently IN_PROGRESS (in a live session) are busy and are left
 * out. Experts can also take themselves off the list with the dashboard
 * availability switch (`isAvailable: false`). Availability is decided by
 * these two flags — nothing else.
 */
export async function matchExperts({ problem, category, limit }) {
  const cleanProblem = problem?.trim();
  const cleanCategory = category?.trim() || "";
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);

  if (!cleanProblem || cleanProblem.length < MIN_PROBLEM_LENGTH) {
    throw validationError(
      "Please describe your problem in at least 10 characters.",
    );
  }

  if (cleanCategory && !CONSULT_CATEGORY_IDS.includes(cleanCategory)) {
    throw validationError("Unknown consultancy category.");
  }

  const busyIds = await Consultation.find({ status: { $in: BUSY_STATUSES } })
    .distinct("expert");

  const query = {
    status: "active",
    "verification.status": "approved",
    isAvailable: { $ne: false },
    _id: { $nin: busyIds },
  };

  if (cleanCategory) query.categories = cleanCategory;

  const experts = await Expert.find(query).select(EXPERT_SELECT).lean();

  experts.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return {
    experts: experts.slice(0, safeLimit),
    category: cleanCategory || null,
    matched: false,
  };
}

// ---------------------------------------------------------------------------
// Request creation (user)
// ---------------------------------------------------------------------------

export async function createConsultation({ user, input }) {
  const { expertId, problem, category, notes } = input;

  const cleanProblem = problem?.trim();
  const cleanCategory = category?.trim() || "";

  if (!user?.id) throw authenticationError("Authentication required.");
  if (!expertId) throw validationError("Please choose an expert to book.");
  if (!cleanProblem || cleanProblem.length < MIN_PROBLEM_LENGTH) {
    throw validationError(
      "Please describe your problem in at least 10 characters.",
    );
  }
  if (cleanCategory && !CONSULT_CATEGORY_IDS.includes(cleanCategory)) {
    throw validationError("Unknown consultancy category.");
  }

  const expert = await Expert.findOne({
    _id: expertId,
    status: "active",
    "verification.status": "approved",
  }).select("fullName email price");

  if (!expert) {
    throw notFoundError("Expert not found or not available.");
  }

  const consultation = await Consultation.create({
    user: user.id,
    expert: expert._id,
    problem: cleanProblem,
    category: cleanCategory || undefined,
    notes: notes?.trim() || "",
    userName: user.fullName || "",
    userEmail: user.email || "",
    // Display price at request time; the binding amount is set on acceptance.
    amount: Math.round((expert.price || 0) * 100),
    currency: "INR",
    status: "PENDING",
    requestExpiresAt: new Date(Date.now() + config.consult.requestTtlHours * 60 * 60 * 1000),
  });

  // The expert is asked — by email — to open their dashboard and confirm or
  // reject. The problem and category travel with it.
  sendBookingRequestMail({
    to: expert.email,
    expertName: expert.fullName,
    clientName: user.fullName,
    clientEmail: user.email,
    category: cleanCategory || "General consultation",
    problem: cleanProblem,
  });

  return consultation;
}

// ---------------------------------------------------------------------------
// Reads (strictly participant-scoped)
// ---------------------------------------------------------------------------

function participantFilter(id, role, extra = {}) {
  return role === "expert" ? { expert: id, ...extra } : { user: id, ...extra };
}

export async function listMine({ userId, role = "user", status }) {
  if (!userId) throw authenticationError("Authentication required.");

  const extra = {};
  if (status && CONSULTATION_STATUSES.includes(status)) extra.status = status;

  return Consultation.find(participantFilter(userId, role, extra))
    .populate("expert", "fullName username expertise avatar rating ratingCount price")
    .populate("user", "fullName username avatar")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
}

export async function getForParticipant({ id, role, userId }) {
  if (!userId) throw authenticationError("Authentication required.");

  await expireStaleConsultations();

  const consultation = await Consultation.findOne(
    participantFilter(userId, role, { _id: id }),
  )
    .populate("expert", "fullName username expertise avatar rating ratingCount price")
    .populate("user", "fullName username avatar")
    .lean();

  if (!consultation) throw notFoundError("Consultation not found.");
  return consultation;
}

// ---------------------------------------------------------------------------
// Expert decision — confirm or reject
// ---------------------------------------------------------------------------

/**
 * The expert confirms a PENDING request.
 *
 * Occupancy is enforced inside a transaction: the busy check (is the expert
 * IN_PROGRESS right now?) and the PENDING → CONFIRMED flip commit together,
 * so a busy expert can never take a second booking. On success the meeting
 * room exists and the user is emailed the join link.
 */
export async function acceptConsultation({ expertId, consultationId }) {
  if (!expertId) throw authenticationError("Authentication required.");

  await expireStaleConsultations();

  const expert = await Expert.findById(expertId).select("fullName price");
  if (!expert) throw notFoundError("Expert not found.");

  const amount = Math.round((expert.price || 0) * 100);

  const confirmed = await runInTransaction(async (session) => {
    // 1. Lock the request: only a still-PENDING, unexpired one can flip.
    const consultation = await Consultation.findOneAndUpdate(
      {
        _id: consultationId,
        expert: expertId,
        status: "PENDING",
        $or: [
          { requestExpiresAt: { $gt: new Date() } },
          { requestExpiresAt: { $exists: false } },
        ],
      },
      {
        $set: {
          status: "CONFIRMED",
          amount,
          // Free consultations are already "paid".
          ...(amount <= FREE_AMOUNT
            ? {
                "payment.status": "paid",
                "payment.paidAt": new Date(),
                "payment.amount": 0,
                "payment.currency": "INR",
              }
            : {}),
        },
      },
      { new: true, ...(session ? { session } : {}) },
    );

    if (!consultation) {
      // Distinguish "not mine / not pending" from "expired".
      const existing = await Consultation.findOne(
        { _id: consultationId, expert: expertId },
        null,
        session ? { session } : {},
      ).lean();

      if (!existing) throw notFoundError("Consultation request not found.");
      if (existing.status === "EXPIRED" || existing.requestExpiresAt < new Date()) {
        throw conflictError("This request has expired.");
      }
      throw conflictError(`This request is already ${existing.status.toLowerCase()}.`);
    }

    // 2. Busy check: an expert IN_PROGRESS right now cannot take bookings.
    const busyCount = await (session
      ? Consultation.countDocuments(
          buildExpertOccupiedFilter(expertId, consultationId),
        ).session(session)
      : Consultation.countDocuments(
          buildExpertOccupiedFilter(expertId, consultationId),
        ));

    if (busyCount > 0) {
      throw conflictError(
        "You are currently in a session. Close it before confirming another request.",
      );
    }

    return consultation;
  });

  // 3. Tell the user: session confirmed, here is the room link (pay at door).
  sendBookingStatusMail({
    to: confirmed.userEmail,
    clientName: confirmed.userName,
    expertName: expert.fullName,
    status: "confirmed",
    roomUrl: roomUrlFor(confirmed.id),
    amountLabel: `₹${(amount / 100).toFixed(0)}`,
  });

  return confirmed;
}

export async function declineConsultation({ expertId, consultationId, reason }) {
  if (!expertId) throw authenticationError("Authentication required.");

  const expert = await Expert.findById(expertId).select("fullName");

  const consultation = await Consultation.findOneAndUpdate(
    { _id: consultationId, expert: expertId, status: "PENDING" },
    {
      $set: {
        status: "CANCELLED",
        cancelledBy: "expert",
        cancelReason: reason?.trim() || "Declined by expert.",
      },
    },
    { new: true },
  );

  if (!consultation) throw notFoundError("No pending consultation request found.");

  // The user learns about the rejection by email.
  sendBookingStatusMail({
    to: consultation.userEmail,
    clientName: consultation.userName,
    expertName: expert?.fullName,
    status: "cancelled",
    reason: consultation.cancelReason,
  });

  return consultation;
}

// ---------------------------------------------------------------------------
// Payment — pay at the meeting room door
// ---------------------------------------------------------------------------

/**
 * Creates (or re-opens) the Razorpay order for a confirmed consultation.
 * The user only reaches this from the room, after the expert confirmed.
 */
export async function createPaymentOrder({ userId, consultationId }) {
  if (!userId) throw authenticationError("Authentication required.");

  const consultation = await Consultation.findOne({
    _id: consultationId,
    user: userId,
    status: "CONFIRMED",
  });

  if (!consultation) {
    throw notFoundError("No confirmed consultation found for this user.");
  }

  if (consultation.payment?.paid) {
    throw conflictError("This consultation is already paid.");
  }

  if (consultation.amount <= FREE_AMOUNT) {
    throw validationError("This consultation is free — no payment needed.");
  }

  // Idempotent: an existing unpaid order is returned as-is (checkout can be
  // re-opened without creating stray orders).
  if (consultation.payment?.orderId && consultation.payment.status === "created") {
    return {
      keyId: paymentService.checkoutConfig().keyId,
      orderId: consultation.payment.orderId,
      amount: consultation.payment.amount || consultation.amount,
      currency: consultation.payment.currency || "INR",
    };
  }

  const order = await paymentService.createOrder({ consultation });

  await Consultation.updateOne(
    { _id: consultation._id, "payment.paid": { $ne: true } },
    {
      $set: {
        "payment.orderId": order.orderId,
        "payment.amount": order.amount,
        "payment.currency": order.currency,
        "payment.status": "created",
      },
    },
  );

  return {
    keyId: order.keyId,
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
  };
}

/**
 * Verifies the checkout signature server-side and marks the consultation
 * paid. The status stays CONFIRMED — the session starts when the user joins.
 */
export async function verifyPayment({ userId, consultationId, orderId, paymentId, signature }) {
  if (!userId) throw authenticationError("Authentication required.");

  const verified = paymentService.verifyCheckout({ orderId, paymentId, signature });

  const consultation = await Consultation.findOne({
    _id: consultationId,
    user: userId,
  });

  if (!consultation) throw notFoundError("Consultation not found.");

  // Idempotent success: the same payment verified twice is fine.
  if (
    consultation.payment?.paid &&
    consultation.payment?.paymentId === verified.paymentId
  ) {
    return consultation;
  }

  if (consultation.status !== "CONFIRMED") {
    throw conflictError(
      `A ${consultation.status.toLowerCase()} consultation cannot be paid for.`,
    );
  }

  // The frontend can only echo an order id this consultation actually owns.
  if (consultation.payment?.orderId && consultation.payment.orderId !== verified.orderId) {
    throw validationError("This payment does not belong to this consultation.");
  }

  // Atomic mark-paid: races with the webhook or a duplicate submit resolve
  // to exactly one winner because of the paid condition.
  const updated = await Consultation.findOneAndUpdate(
    {
      _id: consultation._id,
      status: "CONFIRMED",
      "payment.paid": { $ne: true },
    },
    {
      $set: {
        "payment.orderId": verified.orderId,
        "payment.paymentId": verified.paymentId,
        "payment.signature": verified.signature,
        "payment.status": "paid",
        "payment.paid": true,
        "payment.paidAt": new Date(),
        "payment.amount": consultation.amount,
        "payment.currency": consultation.currency || "INR",
      },
    },
    { new: true },
  );

  if (!updated) {
    throw conflictError("The payment could not be applied. Please refresh and try again.");
  }

  return updated;
}

/**
 * Razorpay webhook. `rawBody` must be the exact bytes Razorpay signed.
 * Safe to replay: decisions are derived from stored state, never from the
 * event payload alone. Payment events only ever update the payment record —
 * the session lifecycle is driven by joins, not webhooks.
 */
export async function handleWebhook({ rawBody, signature }) {
  if (!paymentService.verifyWebhook(rawBody, signature)) {
    throw forbiddenError("Invalid webhook signature.");
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw validationError("Malformed webhook payload.");
  }

  const type = event?.event;
  const payment = event?.payload?.payment?.entity;

  if (!type || !payment?.order_id) {
    return { handled: false };
  }

  const consultation = await Consultation.findOne({
    "payment.orderId": payment.order_id,
  });

  if (!consultation) {
    // Unknown order — acknowledge so Razorpay stops retrying.
    logger.warn("Webhook for unknown order", { orderId: payment.order_id, event: type });
    return { handled: false };
  }

  const decision = decideWebhookAction({
    event: type,
    consultation,
    payment,
  });

  if (decision.action === "markPaid") {
    await Consultation.updateOne(
      {
        _id: consultation._id,
        status: "CONFIRMED",
        "payment.paid": { $ne: true },
      },
      {
        $set: {
          "payment.paymentId": decision.paymentId,
          "payment.status": "paid",
          "payment.paid": true,
          "payment.paidAt": new Date(
            payment.created_at ? payment.created_at * 1000 : Date.now(),
          ),
          "payment.amount": consultation.amount,
          "payment.currency": consultation.currency || "INR",
        },
      },
    );
  } else if (decision.action === "markFailed") {
    await Consultation.updateOne(
      { _id: consultation._id, status: "CONFIRMED" },
      {
        $set: {
          "payment.status": "failed",
          "payment.failedAt": new Date(),
          "payment.failureReason": decision.reason || "Payment failed.",
        },
      },
    );
  }

  return { handled: decision.action !== "ignore", action: decision.action };
}

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

const USER_CANCELLABLE = ["PENDING", "CONFIRMED"];
const EXPERT_CANCELLABLE = ["PENDING", "CONFIRMED", "IN_PROGRESS"];

export async function cancelConsultation({ userId, role, consultationId, reason }) {
  if (!userId) throw authenticationError("Authentication required.");

  const cancellable = role === "expert" ? EXPERT_CANCELLABLE : USER_CANCELLABLE;

  const consultation = await Consultation.findOneAndUpdate(
    {
      _id: consultationId,
      ...participantFilter(userId, role),
      status: { $in: cancellable },
    },
    {
      $set: {
        status: "CANCELLED",
        cancelledBy: role,
        cancelReason: reason?.trim() || "Cancelled.",
      },
    },
    { new: true },
  );

  if (!consultation) {
    throw conflictError("This consultation can no longer be cancelled.");
  }

  return consultation;
}

// ---------------------------------------------------------------------------
// Rating
// ---------------------------------------------------------------------------

/**
 * The participating user rates a completed consultation — once, enforced
 * atomically. The expert's aggregate rating is then recalculated from the
 * rating records themselves.
 */
export async function rateConsultation({ userId, consultationId, score, review }) {
  if (!userId) throw authenticationError("Authentication required.");

  const rating = Number(score);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw validationError("Rating must be a whole number between 1 and 5.");
  }
  const cleanReview = typeof review === "string" ? review.trim().slice(0, 2000) : "";

  const updated = await Consultation.findOneAndUpdate(
    {
      _id: consultationId,
      user: userId,
      status: "COMPLETED",
      // The partial unique index is the hard guarantee; this condition keeps
      // the API message friendly.
      "rating.score": { $exists: false },
    },
    {
      $set: {
        rating: {
          score: rating,
          review: cleanReview,
          ratedBy: userId,
          ratedAt: new Date(),
        },
      },
    },
    { new: true },
  );

  if (!updated) {
    const consultation = await Consultation.findOne({
      _id: consultationId,
      user: userId,
    }).lean();

    if (!consultation) throw notFoundError("Consultation not found.");
    if (consultation.status !== "COMPLETED") {
      throw validationError("Only completed consultations can be rated.");
    }
    if (consultation.rating?.score) {
      throw conflictError("You have already rated this consultation.");
    }
    throw notFoundError("Consultation not found.");
  }

  await refreshExpertRating(updated.expert);

  return updated;
}

/** Recomputes the expert's rating/count from the consultation records. */
export async function refreshExpertRating(expertId) {
  const expertOid = /^[0-9a-fA-F]{24}$/.test(String(expertId))
    ? new mongoose.Types.ObjectId(String(expertId))
    : expertId;

  const [stats] = await Consultation.aggregate([
    {
      $match: {
        expert: expertOid,
        "rating.score": { $type: "number" },
      },
    },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating.score" },
        count: { $sum: 1 },
      },
    },
  ]);

  await Expert.updateOne(
    { _id: expertId },
    {
      $set: {
        rating: stats ? Math.round(stats.average * 10) / 10 : 0,
        ratingCount: stats ? stats.count : 0,
      },
    },
  );
}

export { PAYABLE_STATUSES };
