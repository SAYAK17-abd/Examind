import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { UserSummary, LoginRequest, RegisterRequest } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserSummary | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(() => {
    try {
      const stored = localStorage.getItem('examind_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('examind_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize on mount and handle expired sessions
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('examind_token');
      if (savedToken) {
        try {
          const profile = await authService.getCurrentUser();
          const userSummary: UserSummary = {
            id: profile.id,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: profile.fullName,
            role: profile.role,
            status: profile.status,
          };
          setUser(userSummary);
          localStorage.setItem('examind_user', JSON.stringify(userSummary));
        } catch {
          // If token was invalid or expired, check if refresh worked, otherwise cleared by interceptor
          const freshToken = localStorage.getItem('examind_token');
          if (!freshToken) {
            setUser(null);
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('examind:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('examind:session_expired', handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      localStorage.setItem('examind_token', res.accessToken);
      localStorage.setItem('examind_refresh_token', res.refreshToken);
      localStorage.setItem('examind_user', JSON.stringify(res.user));
      setToken(res.accessToken);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      localStorage.setItem('examind_token', res.accessToken);
      localStorage.setItem('examind_refresh_token', res.refreshToken);
      localStorage.setItem('examind_user', JSON.stringify(res.user));
      setToken(res.accessToken);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('examind_refresh_token') || undefined;
    await authService.logout(refreshToken);
    setToken(null);
    setUser(null);
  }, []);

  const roleNormalized = user?.role?.toUpperCase() || '';
  const isStudent = roleNormalized === 'ROLE_STUDENT' || roleNormalized === 'STUDENT';
  const isTeacher = roleNormalized === 'ROLE_TEACHER' || roleNormalized === 'TEACHER';
  const isAdmin = roleNormalized === 'ROLE_ADMIN' || roleNormalized === 'ADMIN';

  const hasRole = useCallback(
    (roleToCheck: string) => {
      const normalized = roleToCheck.toUpperCase();
      const current = user?.role?.toUpperCase() || '';
      return (
        current === normalized ||
        current === `ROLE_${normalized}` ||
        `ROLE_${current}` === normalized
      );
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      isStudent,
      isTeacher,
      isAdmin,
      hasRole,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, isStudent, isTeacher, isAdmin, hasRole, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
