import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/ApiClient';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, setToken, logout, hasRefreshToken, firstAuthCheck, isLoggingOut } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        try {
          if (!firstAuthCheck && !hasRefreshToken && !isLoggingOut) {
            const { data } = await apiClient.refreshToken()
            setToken(data.token);
          }
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
    return <Navigate to="/" replace />;
  }

  return children;
}

type RoleRouteProps = {
  children: ReactNode;
  allowedRoles: string[];
};

/**
 * Restricts access based on user role
 */
export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}