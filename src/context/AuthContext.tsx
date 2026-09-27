import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrentUser,
  logoutUser,
  loginUser,
  signUpUser,
  isTokenExpired,
  attemptTokenRefresh,
  AUTH_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const refreshAuthUser = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      if (current) {
        setUser(current);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch {
      setUser(null);
      setIsLoggedIn(false);
    }
  }, []);

  // Initialize session on launch
  useEffect(() => {
    refreshAuthUser().finally(() => {
      setInitializing(false);
    });
  }, [refreshAuthUser]);

  // Keep-alive token refresh & AppState resume handling
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkAndRefreshSession = async () => {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
      if (!refreshToken) return;

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
    setUser(authUser);
    setIsLoggedIn(true);
    return authUser;
  };

  const handleSignup = async (email: string, pass: string, name?: string) => {
    const res = await signUpUser(email, pass, name);
    if (res.token && res.user) {
      setUser(res.user);
      setIsLoggedIn(true);
    }
    return res;
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
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
