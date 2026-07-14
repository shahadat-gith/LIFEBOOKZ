import api from '../../lib/axios';
import type { CreateStoryData, UpdateStoryData, StoryListParams, CommentData } from '../../constants/types';

export const storyApi = {
  /** Create a new story (author only) */
  create: (data: CreateStoryData) => api.post('/stories', data),

  /** Resubmit a story for re-verification (author only) */
  resubmit: (storyId: string, data: UpdateStoryData) =>
    api.post(`/stories/${storyId}/resubmit`, data),

  /** List published stories with cursor pagination */
  list: (params?: StoryListParams) => api.get('/stories', { params }),

  /** Get a single story by ID */
  getById: (storyId: string) => api.get(`/stories/${storyId}`),

  /** Update a story (author only) */
  update: (storyId: string, data: UpdateStoryData) =>
    api.patch(`/stories/${storyId}`, data),

  /** Delete a story (author only) */
  remove: (storyId: string) => api.delete(`/stories/${storyId}`),

  /** Toggle like on a story */
  like: (storyId: string) => api.post(`/stories/${storyId}/like`),

  /** Get story comments with cursor pagination */
  listComments: (storyId: string, params?: { limit?: number; cursor?: string }) =>
    api.get(`/stories/${storyId}/comments`, { params }),

  /** Add a comment to a story */
  addComment: (storyId: string, data: CommentData) =>
    api.post(`/stories/${storyId}/comments`, data),

  /** AI-enhance story content (author only) */
  enhance: (storyId: string) => api.post(`/stories/${storyId}/enhance`),

  /** Get AI title suggestions */
  titleSuggestions: (storyId: string) =>
    api.post(`/stories/${storyId}/title-suggestions`),
};
