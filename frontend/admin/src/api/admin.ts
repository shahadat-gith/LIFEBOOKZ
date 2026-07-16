import api from "./client";

export const adminApi = {
  login: (data: { email: string; password: string }) =>
    api.post("/admin/login", data),

  logout: () => api.post("/admin/logout"),

  getDashboard: () => api.get("/admin/dashboard"),

  getPendingAuthors: () => api.get("/admin/authors/pending"),

  approveAuthor: (authorId: string) =>
    api.patch(`/admin/authors/${authorId}/approve`),

  rejectAuthor: (authorId: string, reason: string) =>
    api.patch(`/admin/authors/${authorId}/reject`, { reason }),

  getStories: () => api.get("/admin/stories"),

  getUsers: () => api.get("/admin/users"),
};
