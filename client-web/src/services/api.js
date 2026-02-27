import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies
});

// Flag tránh redirect nhiều lần cùng lúc
let isRedirectingToMaintenance = false;

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    // Nếu đang redirect về maintenance → hủy tất cả request đang chờ
    if (isRedirectingToMaintenance) {
      return Promise.reject(new axios.Cancel('Maintenance mode active'));
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 503 Maintenance Mode
      if (error.response.status === 503 && error.response.data?.maintenance) {
        const path = window.location.pathname;
        const isPublicPath = ['/maintenance', '/login', '/register', '/forgot-password', '/reset-password', '/pricing']
          .some(p => path.startsWith(p));
        // Không redirect nếu đang ở trang public hoặc admin
        if (!isPublicPath && !path.startsWith('/admin')) {
          if (!isRedirectingToMaintenance) {
            isRedirectingToMaintenance = true;
            window.location.href = '/maintenance?from=api';
          }
        }
        return Promise.reject(error);
      }
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
