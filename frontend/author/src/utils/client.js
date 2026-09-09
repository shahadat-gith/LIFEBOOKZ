import api from '../config/api';

// Story API methods
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

export async function verify(storyId, data = {}) {
  const res = await api.post(`/stories/${storyId}/verify`, data);
  return res.data.data;
}

export async function publish(storyId) {
  const res = await api.post(`/stories/${storyId}/publish`);
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
  return res.data;
}

export async function reorderChapters(storyId, chapterIds) {
  const res = await api.patch(`/stories/${storyId}/chapters/reorder`, { chapterIds });
  return res.data.data;
}

// Author-specific API
export async function getMyStories() {
  const res = await api.get('/authors/me/stories');
  return res.data.data;
}

export async function getMyStory(storyId) {
  const res = await api.get(`/authors/me/stories/${storyId}`);
  return res.data.data;
}

// Image Upload
export async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const res = await api.post('/stories/upload-image', fd);
  return res.data.data;
}

export default api;
