import api from './client';

export const userApi = {
  updateMe: (data: Record<string, unknown> | FormData) => api.patch('/users/me', data),
};
