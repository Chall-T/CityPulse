import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ErrorCodes } from '../constants/errorCodes';
import type { SafeUser } from '../types';
import { apiClient } from '../lib/ApiClient';

type AuthStore = {
  user: SafeUser | null;
  token: string | null;
  error: string | null;
  hasRefreshToken: boolean;
  firstAuthCheck: boolean;
  isLoggingOut: boolean,
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  setHasRefreshToken: (value: boolean) => void;
  hydrateAuth: () => Promise<void>;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      error: null,
      hasRefreshToken: true,
      firstAuthCheck: true,
      isLoggingOut: false,

      login: async (email, password) => {
        const { setHasRefreshToken } = get();
        try {
          const response = await apiClient.login(email, password);
          const { user, token } = response.data;
          const safeUser: SafeUser = {
            id: user.id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };
          set({ user: safeUser, token, error: null, hasRefreshToken: true });
          setHasRefreshToken(true);
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
        try {
            set({ user: null, token: null, error: null, hasRefreshToken: false, firstAuthCheck: false, isLoggingOut: true });
            setTimeout(() => set({ isLoggingOut: false }), 500);
            const logoutResponse = await apiClient.logout();
            if (logoutResponse.status === 200) {
              console.log('Logout success');
            }
            
        } catch (error) {
          console.warn('Logout failed', error);
        }
      },

      setToken: (token: string) => {
        set((state) => ({ ...state, token, firstAuthCheck: false }));
      },

      setHasRefreshToken: (value: boolean) => {
        set({ hasRefreshToken: value });
      },

      hydrateAuth: async () => {
        const { user, token, hasRefreshToken, logout, setToken, isLoggingOut } = get();
        if (isLoggingOut) {
          console.log('Skipping hydrateAuth because we are logging out.');
          return;
        }
        if (!token) {
          try {
            const refreshResponse = await apiClient.refreshToken();
            const newToken = refreshResponse.data.token;
            setToken(newToken);
            set({ hasRefreshToken: true });
            console.info('Token refreshed successfully.');
          } catch (err) {
            console.error('Failed to refresh token:', err);
            if (hasRefreshToken) {
              logout();
            }
            set({ hasRefreshToken: false });
            return;
          }
        }

        if (!user) {
          try {
            const userResponse = await apiClient.getCurrentUser();
            set({ user: userResponse.data.user });
            console.info('User fetched successfully.');
          } catch (err) {
            console.error('Failed to fetch user data:', err);
            if (hasRefreshToken) {
              logout();
            }
            return;
          }
        }
      },
      isAuthenticated: () => {
        const { user, token } = get();
        return !!user && !!token;
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);