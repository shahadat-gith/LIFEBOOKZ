import api from '../config/api';

export const adminApi = {
  login: (data) => api.post('/admin/login', data),
  logout: () => api.post('/admin/logout'),
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingAuthors: () => api.get('/admin/authors/pending'),
  getApprovedAuthors: () => api.get('/admin/authors/approved'),
  approveAuthor: (authorId) => api.patch(`/admin/authors/${authorId}/approve`),
  rejectAuthor: (authorId, reason) => api.patch(`/admin/authors/${authorId}/reject`, { reason }),
  getPendingExperts: () => api.get('/admin/experts/pending'),
  getApprovedExperts: () => api.get('/admin/experts/approved'),
  approveExpert: (expertId) => api.patch(`/admin/experts/${expertId}/approve`),
  rejectExpert: (expertId, reason) => api.patch(`/admin/experts/${expertId}/reject`, { reason }),
  getUsers: () => api.get('/admin/users'),
  getStories: () => api.get('/admin/stories'),
};

export default api;
