import api from '../../lib/axios';
import type { AuthorUpdateData } from '../../constants/types';

export const authorApi = {
  /** Get current author's profile */
  getMe: () => api.get('/authors/me'),

  /** Update current author's profile */
  updateMe: (data: AuthorUpdateData) => api.patch('/authors/me', data),

  /** Get a public author profile */
  getProfile: (authorId: string) => api.get(`/authors/${authorId}`),
};
