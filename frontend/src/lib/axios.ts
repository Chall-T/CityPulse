import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { ErrorCodes } from '../constants/errorCodes';
import config from './config';

declare module 'axios' {
  export interface AxiosRequestConfig {
    authRequired?: boolean;
  }
}

export const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: false,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore.getState();

    const needsAuth = (config as any).authRequired ?? false;

    console.log(!authStore.hasRefreshToken, !authStore.firstAuthCheck, needsAuth)
    if (!authStore.hasRefreshToken && !authStore.firstAuthCheck && needsAuth) {
      console.warn('Skipping request: no refresh token and auth check is done.');
      // Cancel the request
      return Promise.reject({
        message: 'Request cancelled: no refresh token and first auth check is done.',
        config,
        __CANCEL__: true,
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const authStore = useAuthStore.getState();

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    const errorCode = (error.response?.data as any)?.error?.errorCode;

    // Handle token refresh on expiration
    if (
      error.response?.status === 401 &&
      errorCode === ErrorCodes.AUTH_TOKEN_EXPIRED &&
      !originalRequest._retry &&
      !originalRequest?.url?.includes('/auth/logout') &&
      (authStore.hasRefreshToken || authStore.firstAuthCheck)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch(Promise.reject);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh', null, { withCredentials: true, authRequired: true });
        authStore.setToken(data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        processQueue(null, data.token);
        return api(originalRequest);
      } catch (err) {
        processQueue(err as AxiosError, null);
        authStore.logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }

    }

    if (!authStore.token && !authStore.hasRefreshToken) {
      return Promise.reject(error);
    }
  }
);