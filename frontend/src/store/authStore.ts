import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/axios';
import { ErrorCodes } from '../constants/errorCodes';

type User = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthStore = {
  user: User | null;
  token: string | null;
  error: string | null;
  hasRefreshToken: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  setHasRefreshToken: (value: boolean) => void;
  hydrateAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      error: null,
      hasRefreshToken: false,

      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data;

          set({ user, token, error: null, hasRefreshToken: true });
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (err: any) {
          const errorCode = err?.response?.data?.error?.errorCode;
          const errorMsg = err?.response?.data?.error?.message || 'Login failed';

          if (errorCode === ErrorCodes.VALIDATION_REQUIRED_FIELD) {
            get().logout();
          }

          set({ error: errorMsg });
          throw err;
        }
      },

      logout: async () => {
        set({ user: null, token: null, error: null, hasRefreshToken: false });
        delete api.defaults.headers.common['Authorization'];

        try {
          const logoutResponse = await api.post('/auth/logout', null, { withCredentials: true });
          if (logoutResponse.status === 200) {
            console.log('Logout success');
          }
        } catch (error) {
          console.warn('Logout failed', error);
        }
      },

      setToken: (token: string) => {
        set((state) => ({ ...state, token }));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      setHasRefreshToken: (value: boolean) => {
        set({ hasRefreshToken: value });
      },

      hydrateAuth: async () => {
        const { user, token, logout, setToken } = get();
        console.log(user, token);
        if (!token) {
          try {
            const refreshResponse = await api.post('/auth/refresh', null, { withCredentials: true });
            const newToken = refreshResponse.data.token;
            setToken(newToken);
            set({ hasRefreshToken: true });
            console.info('Token refreshed successfully.');
          } catch (err) {
            console.error('Failed to refresh token:', err);
            set({ hasRefreshToken: false });
            logout();
            return;
          }
        }

        if (!user) {
          try {
            const userResponse = await api.get('/users/me');
            set({ user: userResponse.data.user });
            console.info('User fetched successfully.');
          } catch (err) {
            console.error('Failed to fetch user data:', err);
            logout();
            return;
          }
        }
      },
    }),
    {
      name: 'auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
