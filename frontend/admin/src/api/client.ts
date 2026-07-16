import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { "Content-Type": "application/json" },
});


api.interceptors.request.use((c) => {
  const t = localStorage.getItem("accessToken");
  if (t) c.headers.Authorization = "Bearer " + t;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  async (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem("admin");
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    return Promise.reject(e);
  },
);
export default api;
