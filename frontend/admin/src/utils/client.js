import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export const adminApi = {
  login: (data) => api.post('/admin/login', data),
  logout: () => api.post('/admin/logout'),
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingAuthors: () => api.get('/admin/authors/pending'),
  getApprovedAuthors: () => api.get('/admin/authors/approved'),
  approveAuthor: (authorId) => api.patch(`/admin/authors/${authorId}/approve`),
  rejectAuthor: (authorId, reason) => api.patch(`/admin/authors/${authorId}/reject`, { reason }),
  getUsers: () => api.get('/admin/users'),
  getStories: () => api.get('/admin/stories'),
};

export default api;
