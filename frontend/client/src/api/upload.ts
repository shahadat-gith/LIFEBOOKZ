import api from './client';

export const uploadApi = {
  uploadImage: (file: File) => {
    const fd = new FormData(); fd.append('image', file);
    return api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadAvatar: (file: File) => {
    const fd = new FormData(); fd.append('avatar', file);
    return api.post('/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
