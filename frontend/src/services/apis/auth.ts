import api from '../../lib/axios';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export const authApi = {
  /** User login */
  login: (data: LoginData) => api.post('/auth/login', data),

  /** User register */
  register: (data: RegisterData) => api.post('/auth/register', data),

  /** Refresh access token */
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),

  /** Logout */
  logout: () => api.post('/auth/logout'),

  /** Get current user */
  getMe: () => api.get('/auth/me'),

  /** Google OAuth URL */
  googleAuth: () => api.get('/auth/google'),

  /** Author login */
  authorLogin: (data: LoginData) => api.post('/authors/login', data),

  /** Author register */
  authorRegister: (data: Record<string, unknown>) => api.post('/authors/register', data),

  /** Admin login */
  adminLogin: (data: LoginData) => api.post('/admin/login', data),
};
