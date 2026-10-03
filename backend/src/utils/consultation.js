import crypto from "node:crypto";

/**
 * Consultation lifecycle.
 *
 * PENDING      user request waiting for the expert's decision.
 * CONFIRMED    expert accepted — meeting room exists, user emailed the link;
 *              user pays at the door.
 * IN_PROGRESS  payment verified and user joined. The expert is BUSY — no new
 *              requests reach them until the session ends.
 * COMPLETED    the expert closed the meeting; the user can rate it once.
 * CANCELLED    rejected/cancelled by user or expert, or system-cancelled.
 * EXPIRED      request nobody accepted within its deadline.
 */
export const CONSULTATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
];

/** Statuses that make an expert BUSY (no new requests accepted). */
export const BUSY_STATUSES = ["IN_PROGRESS"];

/** Statuses where the payment flow can run (pay at the room door). */
export const PAYABLE_STATUSES = ["CONFIRMED"];

/** Allowed status transitions (from → set of to). */
export const ALLOWED_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED", "EXPIRED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export function canTransition(from, to) {
  return Boolean(ALLOWED_TRANSITIONS[from]?.includes(to));
}

/**
 * The MongoDB filter that expresses "this consultation may move from `from`
 * to `to`". Applied as an atomic update condition so two racing requests
 * (or a request and a webhook) can never both win.
 */
export function transitionFilter(from, to) {
  if (!canTransition(from, to)) {
    // Never match — the caller has already thrown for the bad transition.
    return { _id: { $exists: false } };
  }
  return { status: from };
}

/**
 * Query that finds consultations currently occupying (busyfying) an expert.
 * An expert is only busy while a session is actually IN_PROGRESS — confirmed
 * bookings that haven't started yet do not block anything.
 */
export function buildExpertOccupiedFilter(expertId, excludeId = null) {
  const filter = {
    expert: expertId,
    status: { $in: BUSY_STATUSES },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return filter;
}

// ---------------------------------------------------------------------------
// Razorpay signatures
// ---------------------------------------------------------------------------

/**
 * Checkout handshake: HMAC-SHA256 of `order_id|payment_id` with the key
 * secret. Returns true only on an exact, timing-safe match.
 */
export function verifyPaymentSignature({ orderId, paymentId, signature, secret }) {
  if (!orderId || !paymentId || !signature || !secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Webhook handshake: HMAC-SHA256 of the raw request body with the webhook
 * secret, compared to the `x-razorpay-signature` header.
 */
export function verifyWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;

  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Decides what a verified webhook event means for a consultation.
 * Pure — the caller performs the database effects, so webhook replays and
 * out-of-order events stay safe.
 *
 * Returns one of:
 *   { action: "markPaid" } — captured payment completes the room-door payment.
 *   { action: "markFailed", reason } — failed payment; the user can retry.
 *   { action: "ignore" }   — nothing this endpoint should do.
 */
export function decideWebhookAction({ event, consultation, payment }) {
  const orderId = payment?.order_id;
  if (!orderId) return { action: "ignore" };

  // The webhook must refer to the order this consultation is actually waiting on.
  if (consultation?.payment?.orderId && consultation.payment.orderId !== orderId) {
    return { action: "ignore" };
  }

  switch (event) {
    case "payment.captured":
    case "order.paid":
      if (consultation?.status !== "CONFIRMED") {
        // Already in session, completed or cancelled — nothing to do.
        return { action: "ignore" };
      }
      if (consultation.payment?.paid) {
        // Idempotent — already paid.
        return { action: "ignore" };
      }
      if (consultation.payment?.paymentId && consultation.payment.paymentId !== payment.id) {
        // A different payment for the same order — never double-mark.
        return { action: "ignore" };
      }
      return { action: "markPaid", paymentId: payment.id };

    case "payment.failed": {
      if (consultation?.status !== "CONFIRMED") {
        return { action: "ignore" };
      }
      return { action: "markFailed", reason: payment?.error_description || "Payment failed." };
    }

    default:
      return { action: "ignore" };
  }
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

export function sessionDurationSeconds(startedAt, endedAt) {
  const start = startedAt ? new Date(startedAt).getTime() : NaN;
  const end = endedAt ? new Date(endedAt).getTime() : NaN;
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.round((end - start) / 1000);
}

/**
 * Whether an IN_PROGRESS session has been abandoned: BOTH participants'
 * heartbeats are older than `staleMs`. One live participant keeps the session
 * open; two gone participants end it.
 */
export function isSessionStale(session, staleMs, now = Date.now()) {
  if (!session?.startedAt) return false;
  const cutoff = now - staleMs;

  const userSeen = session.userHeartbeatAt ? new Date(session.userHeartbeatAt).getTime() : 0;
  const expertSeen = session.expertHeartbeatAt
    ? new Date(session.expertHeartbeatAt).getTime()
    : 0;

  // A participant who never sent a heartbeat counts as present at start time.
  const userLast = Math.max(userSeen, new Date(session.startedAt).getTime());
  const expertLast = Math.max(expertSeen, new Date(session.startedAt).getTime());

  return userLast < cutoff && expertLast < cutoff;
}

/** The later of the two heartbeats — used as endedAt when force-completing. */
export function lastActivityAt(session) {
  const userSeen = session?.userHeartbeatAt ? new Date(session.userHeartbeatAt).getTime() : 0;
  const expertSeen = session?.expertHeartbeatAt ? new Date(session.expertHeartbeatAt).getTime() : 0;
  const started = session?.startedAt ? new Date(session.startedAt).getTime() : 0;
  return new Date(Math.max(userSeen, expertSeen, started));
}

// ---------------------------------------------------------------------------
// ICE / TURN configuration
// ---------------------------------------------------------------------------

const DEFAULT_STUN = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  { urls: ["stun:stun.cloudflare.com:3478"] },
];

/**
 * ICE server list handed to the two participants. Public STUN is always
 * included; a TURN server (required for symmetric-NAT networks) is added
 * only when configured via environment.
 */
export function buildIceServers({ turnUrl, turnUsername, turnCredential, turnUrls } = {}) {
  const servers = DEFAULT_STUN.map((s) => ({ urls: [...s.urls] }));

  const urls = (turnUrls || turnUrl || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  if (urls.length > 0) {
    servers.push({
      urls,
      ...(turnUsername ? { username: turnUsername } : {}),
      ...(turnCredential ? { credential: turnCredential } : {}),
    });
  }

  return servers;
}
