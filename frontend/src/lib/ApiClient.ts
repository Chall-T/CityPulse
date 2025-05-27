import axios, { AxiosHeaders, AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { ErrorCodes } from '../constants/errorCodes';
import config from './config';

interface AxiosRequestConfigWithMeta extends InternalAxiosRequestConfig {
  meta?: {
    authRequired?: boolean;
  };
}

class ApiClient {
  private api = axios.create({
    baseURL: config.apiUrl,
    withCredentials: false,
  });

  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.setupInterceptors();
  }

  private processQueue(error: AxiosError | null, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) prom.reject(error);
      else prom.resolve(token);
    });
    this.failedQueue = [];
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config: AxiosRequestConfigWithMeta): AxiosRequestConfigWithMeta => {
        const authStore = useAuthStore.getState();

        if (
          config.meta?.authRequired &&
          !authStore.hasRefreshToken &&
          !authStore.firstAuthCheck
        ) {
          throw new axios.Cancel('Auth not ready');
        }

        if (!(config.headers instanceof AxiosHeaders)) {
          config.headers = new AxiosHeaders(config.headers);
        }

        if (authStore.token) {
          config.headers.set('Authorization', `Bearer ${authStore.token}`);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const authStore = useAuthStore.getState();
        const originalRequest = error.config as AxiosRequestConfigWithMeta & { _retry?: boolean };

        const errorCode = (error.response?.data as any)?.error?.errorCode;

        if (
          error.response?.status === 401 &&
          errorCode === ErrorCodes.AUTH_TOKEN_EXPIRED &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/logout') &&
          (authStore.hasRefreshToken || authStore.firstAuthCheck)
        ) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (token && originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
              }
              return this.api(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const { data } = await this.api.post('/auth/refresh', null, { withCredentials: true });
            authStore.setToken(data.token);
            this.api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            this.processQueue(null, data.token);
            return this.api(originalRequest);
          } catch (err) {
            this.processQueue(err as AxiosError, null);
            authStore.logout();
            return Promise.reject(err);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // API calls:

  async login(email: string, password: string) {
    return await this.api.post('/auth/login', { email, password });
  }

  async logout() {
    return await this.api.post('/auth/logout', null, { withCredentials: true });
  }

  async getCurrentUser() {
    const response = await this.api.get('/users/me');
    return response.data.user;
  }
  async refreshToken() {
    return await this.api.post('/auth/refresh', null, { withCredentials: true, meta: { authRequired: true } });
  }

}

export const apiClient = new ApiClient();
