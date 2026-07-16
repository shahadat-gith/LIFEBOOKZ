import api from './client';
export const authApi = { login: (d: { email: string; password: string }) => api.post('/admin/login', d) };
