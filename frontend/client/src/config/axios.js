import axios from "axios";
import { nanoid } from "nanoid";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Inject JWT token + idempotency key (unique per mutating request) so
// network-level retries can never duplicate writes on the backend.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    if (
      ["post", "patch", "put", "delete"].includes(
        (config.method || "").toLowerCase(),
      ) &&
      !config.headers["Idempotency-Key"]
    ) {
      config.headers["Idempotency-Key"] = nanoid();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Clear stale token on 401 (expired/invalid session)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  },
);

export default api;
