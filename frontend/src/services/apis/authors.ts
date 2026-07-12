import api from '../../lib/axios';

export interface AuthorUpdateData {
  fullName?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  socialLinks?: {
    x?: string;
    github?: string;
    linkedin?: string;
  };
}

export const authorApi = {
  /** Get current author's profile */
  getMe: () => api.get('/authors/me'),

  /** Update current author's profile */
  updateMe: (data: AuthorUpdateData) => api.patch('/authors/me', data),

  /** Get a public author profile */
  getProfile: (authorId: string) => api.get(`/authors/${authorId}`),
};
