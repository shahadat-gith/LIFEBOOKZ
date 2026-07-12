import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track refresh state to avoid multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// Request interceptor – attach access token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authorAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry refresh endpoint itself or login/register
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const authorRefreshToken = localStorage.getItem('authorRefreshToken');
      const token = refreshToken || authorRefreshToken;

      if (!token) throw new Error('No refresh token');

      const role = authorRefreshToken ? 'author' : 'user';
      const { data } = await axios.post(
        `${API_BASE}/auth/refresh`,
        { refreshToken: token },
        { withCredentials: true }
      );

      const newToken = data.accessToken;
      if (role === 'author') {
        localStorage.setItem('authorAccessToken', newToken);
      } else {
        localStorage.setItem('accessToken', newToken);
      }

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Clear auth state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authorAccessToken');
      localStorage.removeItem('authorRefreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('author');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
