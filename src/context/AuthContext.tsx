import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  getCurrentUser,
  logoutUser,
  loginUser,
  signUpUser,
  isTokenExpired,
  attemptTokenRefresh,
  getSecureAuthToken,
  getSecureRefreshToken,
  getCachedUser,
  setCachedUser,
} from '../services/api';
import type { AuthUser, SignUpResponse } from '../types/bookmark';

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  initializing: boolean;
  login: (email: string, pass: string) => Promise<AuthUser>;
  signup: (email: string, pass: string, name?: string) => Promise<SignUpResponse>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  refreshAuthUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Synchronize user updates to storage whenever setUser is called
  const setUser: React.Dispatch<React.SetStateAction<AuthUser | null>> = useCallback((updater) => {
    setUserState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setCachedUser(next).catch(() => {});
      return next;
    });
  }, []);

  const refreshAuthUser = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      if (current) {
        setUserState(current);
        setIsLoggedIn(true);
      } else {
        const token = await getSecureAuthToken();
        const refreshToken = await getSecureRefreshToken();
        if (!token && !refreshToken) {
          setUserState(null);
          setIsLoggedIn(false);
        }
      }
    } catch {
      // Keep existing session on transient network errors
    }
  }, []);

  // Initialize session on launch - immediately restore cached user to eliminate cold-start delay
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const [cachedUser, token, refreshToken] = await Promise.all([
          getCachedUser(),
          getSecureAuthToken(),
          getSecureRefreshToken(),
        ]);

        // If credentials exist in storage, immediately restore logged-in state without blocking UI
        if (cachedUser && (token || refreshToken)) {
          if (isMounted) {
            setUserState(cachedUser);
            setIsLoggedIn(true);
            setInitializing(false);
          }
        }

        // Verify and refresh session in the background
        const verifiedUser = await getCurrentUser();
        if (isMounted) {
          if (verifiedUser) {
            setUserState(verifiedUser);
            setIsLoggedIn(true);
          } else {
            const currentToken = await getSecureAuthToken();
            const currentRefresh = await getSecureRefreshToken();
            if (!currentToken && !currentRefresh) {
              setUserState(null);
              setIsLoggedIn(false);
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Failed to initialize auth session:', err);
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Keep-alive token refresh & AppState resume handling
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkAndRefreshSession = async () => {
      const token = await getSecureAuthToken();
      const refreshToken = await getSecureRefreshToken();
      if (!refreshToken) return;

      // Silently refresh if token is within safety buffer (5 minutes) of expiring or already expired
      if (isTokenExpired(token, 300)) {
        await attemptTokenRefresh();
      }
    };

    // Periodic check every 60s
    const interval = setInterval(checkAndRefreshSession, 60 * 1000);

    // Refresh when user foregrounds the app
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkAndRefreshSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isLoggedIn]);

  const handleLogin = async (email: string, pass: string) => {
    const authUser = await loginUser(email, pass);
    setUserState(authUser);
    setIsLoggedIn(true);
    return authUser;
  };

  const handleSignup = async (email: string, pass: string, name?: string) => {
    const res = await signUpUser(email, pass, name);
    if (res.token && res.user) {
      setUserState(res.user);
      setIsLoggedIn(true);
    }
    return res;
  };

  const handleLogout = async () => {
    await logoutUser();
    setUserState(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        initializing,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        setUser,
        setIsLoggedIn,
        refreshAuthUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
