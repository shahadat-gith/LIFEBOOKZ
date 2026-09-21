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

// Shows a chapter in the lifebook. A chapter is a slot in the life story
// structure, so the only thing a caller can say about it is where it goes.
export async function addChapter(storyId, order) {
  const res = await api.post(`/stories/${storyId}/chapters`, { order });
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

// Stories inside chapters — the text, media and visibility of a lifebook
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

// Media upload was moved to presigned direct-to-R2 uploads — see
// components/story/AddMediaStep.jsx (photos & videos only, no server pass-through).

export default api;
