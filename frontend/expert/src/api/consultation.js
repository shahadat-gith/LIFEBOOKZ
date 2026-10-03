import api from '../config/api';

/**
 * Consultation API for the expert portal — simplified lifecycle:
 * request → confirm → user pays at the room door → session → completed → rating.
 */

// ---------------------------------------------------------------------------
// Consultations
// ---------------------------------------------------------------------------

export async function listMine() {
  const res = await api.get('/consult/expert');
  return res.data.data;
}

export async function getConsultation(id) {
  const res = await api.get(`/consult/${id}`);
  return res.data.data;
}

export async function accept(id) {
  const res = await api.post(`/consult/${id}/accept`);
  return res.data.data;
}

export async function decline(id, reason) {
  const res = await api.post(`/consult/${id}/decline`, reason ? { reason } : {});
  return res.data.data;
}

export async function cancel(id, reason) {
  const res = await api.post(`/consult/${id}/cancel`, reason ? { reason } : {});
  return res.data.data;
}

// ---------------------------------------------------------------------------
// Session
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
  return res.data.data;
}

