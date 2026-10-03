import api from '../config/api';

// Consultations assigned to the signed-in expert (lifecycle actions live in
// api/consultation.js — accept/decline/session)
export async function getMyBookings() {
  const res = await api.get('/experts/me/bookings');
  return res.data.data;
}

export async function getExpertProfile(expertId) {
  const res = await api.get(`/experts/${expertId}`);
  return res.data.data;
}

export default api;
