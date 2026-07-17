import api from './client';

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/users/login', data),
  register: (data: FormData) => api.post('/users/register', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMe: () => api.get('/users/me'),
  logout: () => api.post('/users/logout'),
};
