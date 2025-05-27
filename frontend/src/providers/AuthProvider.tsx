import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/ApiClient';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, setToken, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        try {
          const { data } = await apiClient.refreshToken()
          setToken(data.token);
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token, setToken, logout]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};


type PrivateRouteProps = {
  children: ReactNode;
};

export function PrivateOnlyRoute({ children }: PrivateRouteProps) {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}


type PublicRouteProps = {
  children: ReactNode;
};

export function PublicOnlyRoute({ children }: PublicRouteProps) {
  const token = useAuthStore((state) => state.token);

  if (token) {
    // User logged in → redirect to home
    return <Navigate to="/" replace />;
  }

  // User NOT logged in → render the component
  return children;
}