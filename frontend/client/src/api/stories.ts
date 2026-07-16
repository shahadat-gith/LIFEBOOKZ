import api from './client';

export const storyApi = {
  list: (params?: Record<string, unknown>) => api.get('/stories', { params }),
  getById: (id: string) => api.get(`/stories/${id}`),
  like: (id: string) => api.post(`/stories/${id}/like`),
  listComments: (id: string, params?: Record<string, unknown>) => api.get(`/stories/${id}/comments`, { params }),
  addComment: (id: string, data: { content: string }) => api.post(`/stories/${id}/comments`, data),
};
