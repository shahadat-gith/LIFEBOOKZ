import api from './client';

export const userApi = {
  updateMe: (data: Record<string, unknown> | FormData) => api.patch('/users/me', data),
  updatePreferences: (prefs: Record<string, unknown>) => api.put('/users/me/preferences', prefs),
};
