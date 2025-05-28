import axios, { AxiosHeaders, AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';
import { ErrorCodes } from '../constants/errorCodes';
import config from './config';

interface AxiosRequestConfigWithMeta extends InternalAxiosRequestConfig {
  meta?: {
    authRequired?: boolean;
  };
}

type CachedResponse = {
  timestamp: number;
  response: AxiosResponse | any;
  success: boolean;
};

const CACHE_TTL = 5000; // 5 seconds

class ApiClient {
  private api = axios.create({
    baseURL: config.apiUrl,
    withCredentials: false,
  });

  private cache = new Map<string, CachedResponse>();
  private pendingRequests = new Map<string, Promise<AxiosResponse>>();
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
  // --- Caching logic ---

  private getRequestKey(method: string, url: string, params?: any, data?: any): string {
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
  }

  private async requestWithCache<T = any>(
  method: 'get' | 'post',
  url: string,
  options: {
    params?: any;
    data?: any;
    config?: any;
    cacheable?: boolean;
  } = {}
): Promise<AxiosResponse<T>> {
  const { params, data, config, cacheable = true } = options;

  const key = this.getRequestKey(method, url, params, data);
  const cached = this.cache.get(key);
  const now = Date.now();

  // ✅ Return cached response if valid
  if (
    cacheable &&
    cached &&
    now - cached.timestamp < CACHE_TTL &&
    cached.success
  ) {
    return cached.response as AxiosResponse<T>;
  }

  // ✅ If identical request is in-flight, return its Promise
  if (cacheable && this.pendingRequests.has(key)) {
    return this.pendingRequests.get(key)! as Promise<AxiosResponse<T>>;
  }

  // 🚀 Make the request and store its Promise
  const requestPromise = (async () => {
    try {
      const res: AxiosResponse<T> =
        method === 'get'
          ? await this.api.get(url, { params, ...config })
          : await this.api.post(url, data, config);

      if (cacheable) {
        this.cache.set(key, {
          timestamp: Date.now(),
          response: res,
          success: true,
        });
      }

      return res;
    } catch (err) {
      if (cacheable) {
        this.cache.set(key, {
          timestamp: Date.now(),
          response: err,
          success: false,
        });
      }
      throw err;
    } finally {
      // ❌ Clean up after it's done
      this.pendingRequests.delete(key);
    }
  })();

  if (cacheable) {
    this.pendingRequests.set(key, requestPromise);
  }

  return requestPromise;
}

  // API calls:

  // Auth
  async login(email: string, password: string) {
    return this.requestWithCache('post', '/auth/login', {
      data: { email, password },
      cacheable: false,
    });
  }

  async register(email: string, password: string) {
    return this.requestWithCache('post', '/auth/register', {
      data: { email, password },
      cacheable: false,
    });
  }

  async logout() {
    return this.api.post('/auth/logout', null, { withCredentials: true });
  }

  async getCurrentUser() {
    return this.requestWithCache('get', '/users/me', {
      config: { meta: { authRequired: true } },
    });
  }

  async refreshToken() {
    return await this.api.post('/auth/refresh', null, {
      withCredentials: true,
      meta: { authRequired: true },
    });
  }

  async getEvents(params: { cursor?: string; limit?: number } = {}) {
    return this.requestWithCache('get', '/events', { params });
  }

  async getCategories() {
    return this.requestWithCache('get', '/categories');
  }
}

export const apiClient = new ApiClient();
