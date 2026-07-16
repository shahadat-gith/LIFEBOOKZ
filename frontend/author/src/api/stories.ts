import api from "./client";
export const storyApi = {
  create: (d: Record<string, unknown> | FormData) => api.post("/stories", d),

  resubmit: (id: string, d: Record<string, unknown> | FormData) =>
    api.post(`/stories/${id}/resubmit`, d),

  list: (p?: Record<string, string | number>) =>
    api.get("/stories", { params: p }),

  getById: (id: string) => api.get(`/stories/${id}`),

  update: (id: string, d: Record<string, unknown> | FormData) =>
    api.patch(`/stories/${id}`, d),

  remove: (id: string) => api.delete(`/stories/${id}`),

  enhance: (id: string) => api.post(`/stories/${id}/enhance`),

  titleSuggestions: (id: string) =>
    api.post(`/stories/${id}/title-suggestions`),
};
