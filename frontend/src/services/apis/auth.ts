import api from '../../lib/axios';
import type { LoginData, RegisterData } from '../../constants/types';

export const authApi = {
  /** User login */
  login: (data: LoginData) => api.post('/auth/login', data),

  /** User register */
  register: (data: RegisterData) => api.post('/auth/register', data),

  /** Get current user */
  getMe: () => api.get('/auth/me'),

  /** Author login */
  authorLogin: (data: LoginData) => api.post('/authors/login', data),

  /** Author register */
  authorRegister: (data: Record<string, unknown>) => api.post('/authors/register', data),


};
