import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

// Inject JWT token from localStorage if available (for author form uploads)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Story API methods
export async function create(data) {
  const res = await api.post('/stories', data);
  return res.data.data;
}

export async function update(storyId, data) {
  const res = await api.patch(`/stories/${storyId}`, data);
  return res.data.data;
}

export async function verify(storyId) {
  const res = await api.post(`/stories/${storyId}/verify`);
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
