import api from '../config/api';

// Bookings assigned to the signed-in expert
export async function getMyBookings() {
  const res = await api.get('/experts/me/bookings');
  return res.data.data;
}

// pending | confirmed | completed | cancelled
export async function updateBookingStatus(bookingId, status) {
  const res = await api.patch(`/experts/me/bookings/${bookingId}`, { status });
  return res.data.data;
}

export async function getExpertProfile(expertId) {
  const res = await api.get(`/experts/${expertId}`);
  return res.data.data;
}

export default api;
