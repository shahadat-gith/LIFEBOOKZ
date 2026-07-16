import api from './client';

export const searchApi = {
  search: (params: Record<string, unknown>) => api.get('/stories', { params }),
};
