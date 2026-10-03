import Consultation from "../models/Consultation.js";
import SignalingMessage from "../models/SignalingMessage.js";
import Expert from "../models/Expert.js";
import config from "../config/index.js";
import { logger } from "./logger.service.js";
import { sendBookingStatusMail } from "./mailer.service.js";

import {
  authenticationError,
  conflictError,
  forbiddenError,
  notFoundError,
  validationError,
} from "../utils/errors.js";

import {
  buildIceServers,
  isSessionStale,
  lastActivityAt,
  sessionDurationSeconds,
} from "../utils/consultation.js";
import { expireStaleConsultations } from "./consult.service.js";

/**
 * One-to-one WebRTC video session over a consultation.
 *
 * The room exists as soon as the expert confirms (CONFIRMED). The user
 * receives the link by email and must complete the payment BEFORE entering;
 * the expert joins free. The session starts (IN_PROGRESS) when the paid user
 * joins — that is also when the expert becomes busy.
 *
 * Lambda/API Gateway has no persistent sockets, so signaling travels through
 * MongoDB: each participant POSTs offers/answers/ICE candidates and GETs the
 * peer's messages by polling. Media never touches this server — peers
 * connect directly (STUN/TURN).
 *
 * Exactly two participants can access a room: the consultation's own user
 * and expert, resolved from the authenticated identity on every request.
 */

const SIGNAL_TYPES = ["offer", "answer", "ice", "bye"];

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

/**
 * Loads the consultation for a participant and returns their side.
 * Throws unless the caller is the assigned user or the assigned expert —
 * the ids always come from the token, never from the request.
 */
export async function authorizeParticipant({ consultationId, userId, role }) {
  if (!userId) throw authenticationError("Authentication required.");
  if (role !== "user" && role !== "expert") {
    throw forbiddenError("Only the consultation's user and expert can access its session.");
  }

  const consultation = await Consultation.findOne({
    _id: consultationId,
    ...(role === "expert" ? { expert: userId } : { user: userId }),
  });

  if (!consultation) throw notFoundError("Consultation not found.");
  return { consultation, side: role };
}

function sessionView(consultation, side) {
  const s = consultation.session || {};
  return {
    consultationId: consultation.id,
    status: consultation.status,
    side,
    paid: Boolean(consultation.payment?.paid) || consultation.amount === 0,
    session: {
      startedAt: s.startedAt || null,
      endedAt: s.endedAt || null,
      durationSeconds: s.durationSeconds || 0,
    },
  };
}

function isPaid(consultation) {
  return Boolean(consultation.payment?.paid) || consultation.amount === 0;
}

// ---------------------------------------------------------------------------
// Room access
// ---------------------------------------------------------------------------

/**
 * ICE servers + current state. A confirmed-but-unpaid user is NOT rejected —
 * they get `paymentRequired: true` plus the amount, so the room page can
 * show the payment step first.
 */
export async function getSessionConfig({ consultationId, userId, role }) {
  const { consultation, side } = await authorizeParticipant({
    consultationId,
    userId,
    role,
  });

  if (["COMPLETED", "CANCELLED", "EXPIRED"].includes(consultation.status)) {
    throw forbiddenError(
      `A ${consultation.status.toLowerCase()} consultation cannot be joined.`,
    );
  }
  if (consultation.status === "PENDING") {
    throw forbiddenError(
      "This consultation is not confirmed yet. Join once the expert has confirmed it.",
    );
  }

  const paymentRequired = side === "user" && !isPaid(consultation);

  return {
    ...sessionView(consultation, side),
    paymentRequired,
    ...(paymentRequired
      ? {
          amount: consultation.amount,
          currency: consultation.currency || "INR",
        }
      : {}),
    iceServers: buildIceServers(config.webrtc),
    // Polling hints for the signaling client.
    signaling: { pollAfterMs: 1000 },
  };
}

/**
 * Enter the room.
 *  - The user must have paid (or the consultation is free) — the session
 *    then starts: CONFIRMED → IN_PROGRESS with startedAt set.
 *  - The expert joins free; a confirmed booking already waits for them.
 */
export async function joinSession({ consultationId, userId, role }) {
  const { consultation, side } = await authorizeParticipant({
    consultationId,
    userId,
    role,
  });

  if (["COMPLETED", "CANCELLED", "EXPIRED"].includes(consultation.status)) {
    throw forbiddenError(
      `A ${consultation.status.toLowerCase()} consultation cannot be joined.`,
    );
  }
  if (consultation.status === "PENDING") {
    throw forbiddenError("The expert has not confirmed this consultation yet.");
  }

  // The pay wall: only the user pays, only before entering.
  if (side === "user" && !isPaid(consultation)) {
    throw conflictError("Payment required before joining the session.");
  }

  const now = new Date();
  const joinedAtField = side === "user" ? "userJoinedAt" : "expertJoinedAt";
  const heartbeatField = side === "user" ? "userHeartbeatAt" : "expertHeartbeatAt";

  // The user's first join starts the session; the expert's join never does.
  const updated = await Consultation.findOneAndUpdate(
    {
      _id: consultation._id,
      status: { $in: ["CONFIRMED", "IN_PROGRESS"] },
    },
    {
      $set: {
        ...(side === "user"
          ? {
              status: "IN_PROGRESS",
              "session.startedAt": consultation.session?.startedAt || now,
            }
          : {}),
        [`session.${joinedAtField}`]: now,
        [`session.${heartbeatField}`]: now,
      },
    },
    { new: true },
  );

  if (!updated) throw conflictError("This session can no longer be joined.");

  return sessionView(updated, side);
}

/** Liveness ping; also drives the stale-session sweep. */
export async function heartbeat({ consultationId, userId, role }) {
  const { consultation, side } = await authorizeParticipant({
    consultationId,
    userId,
    role,
  });

  if (consultation.status !== "IN_PROGRESS") {
    throw conflictError("No live session to keep alive.");
  }

  const now = new Date();
  const field = side === "user" ? "userHeartbeatAt" : "expertHeartbeatAt";

  const updated = await Consultation.findOneAndUpdate(
    { _id: consultation._id, status: "IN_PROGRESS" },
    { $set: { [`session.${field}`]: now } },
    { new: true },
  );

  if (!updated) throw conflictError("The session has already ended.");

  // Opportunistic sweep: if both sides went quiet, close it here.
  const staleMs = config.consult.sessionStaleMinutes * 60 * 1000;
  if (isSessionStale(updated.session, staleMs, now.getTime())) {
    await forceComplete(updated);
  }

  return sessionView(updated, side);
}

/**
 * Close the meeting. Either side can end it — the expert closing is the
 * normal path, after which the user is prompted to share their experience.
 */
export async function endSession({ consultationId, userId, role, reason }) {
  const { consultation, side } = await authorizeParticipant({
    consultationId,
    userId,
    role,
  });

  if (consultation.status === "COMPLETED") {
    return sessionView(consultation, side); // idempotent
  }
  if (consultation.status !== "IN_PROGRESS" && consultation.status !== "CONFIRMED") {
    throw conflictError(`A ${consultation.status.toLowerCase()} session cannot be ended.`);
  }

  const endedAt = new Date();
  const updated = await Consultation.findOneAndUpdate(
    { _id: consultation._id, status: { $in: ["CONFIRMED", "IN_PROGRESS"] } },
    {
      $set: {
        status: "COMPLETED",
        "session.startedAt": consultation.session?.startedAt || endedAt,
        "session.endedAt": endedAt,
        "session.durationSeconds": sessionDurationSeconds(
          consultation.session?.startedAt || endedAt,
          endedAt,
        ),
      },
    },
    { new: true },
  );

  if (!updated) throw conflictError("The session has already been closed.");

  // Signal the peer (if polling) that the room is closing.
  await SignalingMessage.create({
    consultation: consultation._id,
    from: side,
    to: side === "user" ? "expert" : "user",
    type: "bye",
    payload: { reason: reason?.trim() || "Session ended." },
  });

  // Only a session that actually ran counts towards the expert's tally.
  if (updated.session?.durationSeconds > 0) {
    await Expert.updateOne({ _id: consultation.expert }, { $inc: { sessions: 1 } });
  }

  // The user is invited to share their experience.
  sendBookingStatusMail({
    to: consultation.userEmail,
    clientName: consultation.userName,
    expertName: (await Expert.findById(consultation.expert).select("fullName"))?.fullName,
    status: "completed",
    bookingsUrl: (config.frontend.client || "").replace(/\/$/, "") + "/bookings",
  });

  return sessionView(updated, side);
}

/** Force-completes an abandoned session (used by heartbeat + sweeps). */
async function forceComplete(consultation) {
  const endedAt = lastActivityAt(consultation.session);
  const result = await Consultation.updateOne(
    { _id: consultation._id, status: "IN_PROGRESS" },
    {
      $set: {
        status: "COMPLETED",
        "session.endedAt": endedAt,
        "session.durationSeconds": sessionDurationSeconds(
          consultation.session?.startedAt,
          endedAt,
        ),
      },
    },
  );

  if (result.modifiedCount > 0) {
    if (sessionDurationSeconds(consultation.session?.startedAt, endedAt) > 0) {
      await Expert.updateOne({ _id: consultation.expert }, { $inc: { sessions: 1 } });
    }
    logger.info("Stale consultation session force-completed", {
      consultationId: consultation.id,
    });
  }
}

// ---------------------------------------------------------------------------
// Signaling (REST polling)
// ---------------------------------------------------------------------------

/**
 * Posts one signaling message to the peer. Only the two participants of a
 * confirmed/in-progress session can signal, and only to each other.
 */
export async function postSignal({ consultationId, userId, role, type, payload }) {
  const { consultation, side } = await authorizeParticipant({
    consultationId,
    userId,
    role,
  });

  if (!["CONFIRMED", "IN_PROGRESS"].includes(consultation.status)) {
    throw forbiddenError("Signaling is only available during a session.");
  }
  if (!SIGNAL_TYPES.includes(type)) {
    throw validationError(`Signal type must be one of: ${SIGNAL_TYPES.join(", ")}.`);
  }

  const message = await SignalingMessage.create({
    consultation: consultation._id,
    from: side,
    to: side === "user" ? "expert" : "user",
    type,
    payload: payload && typeof payload === "object" ? payload : {},
  });

  return { id: message.id, createdAt: message.createdAt };
}

/** Pulls the peer's signaling messages newer than `after` (a message id). */
export async function pullSignals({ consultationId, userId, role, after }) {
  const { consultation, side } = await authorizeParticipant({
    consultationId,
    userId,
    role,
  });

  const filter = {
    consultation: consultation._id,
    to: side,
  };

  if (after) {
    if (!/^[0-9a-fA-F]{24}$/.test(after)) {
      throw validationError("The `after` cursor must be a message id.");
    }
    filter._id = { $gt: after };
  }

  const messages = await SignalingMessage.find(filter)
    .sort({ _id: 1 })
    .limit(50)
    .lean();

  return {
    messages: messages.map((m) => ({
      id: m._id,
      from: m.from,
      type: m.type,
      payload: m.payload,
      createdAt: m.createdAt,
    })),
    hasMore: messages.length === 50,
  };
}
