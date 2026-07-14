import api from '../../lib/axios';
import type { UserUpdatePreferences } from '../../constants/types';

export const userApi = {
  /** Get current user's profile */
  getMe: () => api.get('/users/me'),

  /** Update current user's profile */
  updateMe: (data: Record<string, unknown>) => api.patch('/users/me', data),

  /** Delete current user's account */
  deleteMe: () => api.delete('/users/me'),

  /** Update user preferences */
  updatePreferences: (prefs: UserUpdatePreferences) => api.put('/users/me/preferences', prefs),

  /** Get user stats */
  getMyStats: () => api.get('/users/me/stats'),

  /** Get a user's public profile */
  getUserProfile: (userId: string) => api.get(`/users/${userId}`),
};
