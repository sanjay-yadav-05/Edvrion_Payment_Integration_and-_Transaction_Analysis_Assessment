import axios from 'axios';
import type { AuthResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth storage helpers
const AUTH_KEY = 'edv_auth';

export const getStoredAuth = (): AuthResponse | null => {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const setStoredAuth = (auth: AuthResponse): void => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
};

export const clearStoredAuth = (): void => {
  localStorage.removeItem(AUTH_KEY);
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const auth = getStoredAuth();
    if (auth?.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const auth = getStoredAuth();
      if (auth?.refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken: auth.refreshToken,
          });

          const newAuth = { ...auth, ...response.data };
          setStoredAuth(newAuth);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAuth.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear auth and redirect to login
          clearStoredAuth();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, clear auth and redirect to login
        clearStoredAuth();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;