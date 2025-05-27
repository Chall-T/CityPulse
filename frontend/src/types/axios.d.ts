import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    meta?: {
      authRequired?: boolean;
    };
  }
}