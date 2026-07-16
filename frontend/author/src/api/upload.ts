import api from "./client";
export const uploadApi = {
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return api.post("/upload/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadDocument: (file: File) => {
    const fd = new FormData();
    fd.append("document", file);
    return api.post("/upload/document", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
