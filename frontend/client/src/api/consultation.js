import api from "../config/api";

/**
 * Consultation API — simplified lifecycle.
 *
 * Request → expert confirms → room link emailed → user pays at the room
 * door → one-to-one video session → completed → rating.
 */

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

export async function matchExperts({ problem, category, limit }) {
  const res = await api.post("/consult/match", { problem, category, limit });
  return res.data.data;
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export async function createRequest({ expertId, problem, category, notes }) {
  const res = await api.post("/consult/requests", {
    expertId,
    problem,
    category,
    notes,
  });
  return res.data.data;
}

export async function listMine() {
  const res = await api.get("/consult/mine");
  return res.data.data;
}

export async function getConsultation(id) {
  const res = await api.get(`/consult/${id}`);
  return res.data.data;
}

export async function cancel(id, reason) {
  const res = await api.post(`/consult/${id}/cancel`, reason ? { reason } : {});
  return res.data.data;
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export async function createPaymentOrder(id) {
  const res = await api.post(`/consult/${id}/payment/order`);
  return res.data.data; // { keyId, orderId, amount, currency }
}

export async function verifyPayment(id, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const res = await api.post(`/consult/${id}/payment/verify`, {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  return res.data.data;
}

// ---------------------------------------------------------------------------
// Video session
// ---------------------------------------------------------------------------

export async function getSession(id) {
  const res = await api.get(`/consult/${id}/session`);
  return res.data.data;
}

export async function joinSession(id) {
  const res = await api.post(`/consult/${id}/session/join`);
  return res.data.data;
}

export async function heartbeat(id) {
  const res = await api.post(`/consult/${id}/session/heartbeat`);
  return res.data.data;
}

export async function endSession(id, reason) {
  const res = await api.post(`/consult/${id}/session/end`, reason ? { reason } : {});
  return res.data.data;
}

export async function postSignal(id, type, payload) {
  const res = await api.post(`/consult/${id}/session/signal`, { type, payload });
  return res.data.data;
}

export async function pullSignals(id, after) {
  const res = await api.get(`/consult/${id}/session/messages`, {
    params: after ? { after } : {},
  });
  return res.data.data; // { messages, hasMore }
}

// ---------------------------------------------------------------------------
// Rating
// ---------------------------------------------------------------------------

export async function rate(id, score, review) {
  const res = await api.post(`/consult/${id}/rating`, { score, review });
  return res.data.data;
}
