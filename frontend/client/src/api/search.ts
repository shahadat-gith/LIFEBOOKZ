import api from './client';

export const searchApi = {
  search: (params: Record<string, unknown>) => api.get('/search', { params }),
  trending: (limit?: number) => api.get('/search/trending', { params: { limit } }),
  feed: (limit?: number) => api.get('/search/feed', { params: { limit } }),
  similar: (id: string, limit?: number) => api.get(`/search/similar/${id}`, { params: { limit } }),
};
