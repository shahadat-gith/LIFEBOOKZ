import api from './client';

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/users/login', data),
  register: (data: { email: string; password: string; fullName: string }) => api.post('/users/register', data),
  getMe: () => api.get('/users/me'),
  logout: () => api.post('/users/logout'),
};
