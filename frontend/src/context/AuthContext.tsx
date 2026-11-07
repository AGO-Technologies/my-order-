import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { User, UserRole } from '../types/auth';
import { apiRequest, getOrCreateDeviceId } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
  login: (userData: User) => void;
  logout: (isSessionTimeout?: boolean) => Promise<void>;
  checkAuth: () => Promise<void>;
  getDashboardPath: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // Exactly 3 minutes (180,000 ms)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const inactivityTimerRef = useRef<number | null>(null);

  const getDashboardPath = useCallback((role?: UserRole): string => {
    const userRole = role || user?.role;
    switch (userRole) {
      case 'CUSTOMER':
        return '/customer/home';
      case 'CAFE_OWNER':
        return '/owner/dashboard';
      case 'CAFE_WORKER':
        return '/worker/orders';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  }, [user?.role]);

  const logout = useCallback(async (isSessionTimeout: boolean = false) => {
    try {
      await apiRequest('/api/auth/logout/', {
        method: 'POST',
        retryOn401: false,
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (isSessionTimeout) {
        setSessionExpired(true);
      }
    }
  }, []);

  // Inactivity timeout handler
  const resetInactivityTimer = useCallback(() => {
    if (!user) return;

    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = window.setTimeout(() => {
      logout(true);
    }, INACTIVITY_TIMEOUT_MS);
  }, [user, logout]);

  // Activity listeners
  useEffect(() => {
    if (!user) {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    // Start timer on login / user presence
    resetInactivityTimer();

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ensure persistent device ID is registered
      getOrCreateDeviceId();
      const res = await apiRequest<{ user: User }>('/api/auth/me/');
      if (res && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (userData: User) => {
    setUser(userData);
    setSessionExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionExpired,
        setSessionExpired,
        login,
        logout,
        checkAuth,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
