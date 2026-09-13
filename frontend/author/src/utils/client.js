import api from '../config/api';

// Story (lifebook) API methods
export async function create(data) {
  // data can be a plain object (JSON) or FormData
  const res = await api.post('/stories', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return res.data.data;
}

export async function update(storyId, data) {
  const res = await api.patch(`/stories/${storyId}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return res.data.data;
}

export async function publish(storyId, data = {}) {
  const res = await api.post(`/stories/${storyId}/publish`, data);
  return res.data.data;
}

export async function unpublish(storyId) {
  const res = await api.post(`/stories/${storyId}/unpublish`);
  return res.data.data;
}

export async function remove(storyId) {
  const res = await api.delete(`/stories/${storyId}`);
  return res.data;
}

// Chapter API methods
export async function addChapter(storyId, data) {
  const res = await api.post(`/stories/${storyId}/chapters`, data);
  return res.data.data;
}

export async function updateChapter(storyId, chapterId, data) {
  const res = await api.patch(`/stories/${storyId}/chapters/${chapterId}`, data);
  return res.data.data;
}

export async function deleteChapter(storyId, chapterId) {
  const res = await api.delete(`/stories/${storyId}/chapters/${chapterId}`);
  return res.data.data;
}

export async function reorderChapters(storyId, chapterIds) {
  const res = await api.patch(`/stories/${storyId}/chapters/reorder`, { chapterIds });
  return res.data.data;
}

// Stories inside chapters
export async function addChapterStory(storyId, chapterId, data) {
  const res = await api.post(`/stories/${storyId}/chapters/${chapterId}/stories`, data);
  return res.data.data;
}

export async function updateChapterStory(storyId, chapterId, storyEntryId, data) {
  const res = await api.patch(
    `/stories/${storyId}/chapters/${chapterId}/stories/${storyEntryId}`,
    data,
  );
  return res.data.data;
}

export async function deleteChapterStory(storyId, chapterId, storyEntryId) {
  const res = await api.delete(
    `/stories/${storyId}/chapters/${chapterId}/stories/${storyEntryId}`,
  );
  return res.data.data;
}

// Author-specific API
export async function getMyStories() {
  const res = await api.get('/authors/me/stories');
  return res.data.data;
}

export async function getMyStats() {
  const res = await api.get('/authors/me/stats');
  return res.data.data;
}

export async function getMyStory(storyId) {
  const res = await api.get(`/authors/me/stories/${storyId}`);
  return res.data.data;
}

// Media Upload (photos / videos / audio)
export async function uploadMedia(file) {
  const fd = new FormData();
  fd.append('media', file);
  const res = await api.post('/stories/upload-media', fd);
  return res.data.data;
}

export default api;
