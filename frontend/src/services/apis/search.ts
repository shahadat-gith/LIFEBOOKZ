import api from '../../lib/axios';
import type { SearchParams } from '../../constants/types';

export const searchApi = {
  /** Semantic search across stories */
  search: (params: SearchParams) => api.get('/search', { params }),

  /** Get trending stories */
  trending: (limit?: number) =>
    api.get('/search/trending', { params: { limit } }),

  /** Get personalized feed for authenticated user */
  feed: (limit?: number) =>
    api.get('/search/feed', { params: { limit } }),

  /** Get similar stories */
  similar: (storyId: string, limit?: number) =>
    api.get(`/search/similar/${storyId}`, { params: { limit } }),
};
