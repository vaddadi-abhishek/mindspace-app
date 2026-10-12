import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getActiveApiBaseUrl } from '../constants/config';
import { syncCredentialsToAppGroup } from './appGroupSync';
import type {
  Bookmark,
  ArticleContent,
  MetadataResponse,
  UserPlanInfo,
  AuthUser,
} from '../types/bookmark';

export const AUTH_TOKEN_KEY = 'mindspace_auth_token';
export const AUTH_REFRESH_TOKEN_KEY = 'mindspace_refresh_token';
export const AUTH_USER_KEY = 'mindspace_user';

let cachedMemoryToken: string | null = null;
let cachedMemoryRefreshToken: string | null = null;
let cachedMemoryUser: AuthUser | null = null;

export function getCachedAuthToken(): string | null {
  return cachedMemoryToken;
}

/**
 * Reads token from hardware-backed SecureStore with seamless fallback to persistent
 * AsyncStorage. Keeps in-memory cache warm for immediate synchronous access.
 */
export async function getSecureAuthToken(): Promise<string | null> {
  if (cachedMemoryToken) {
    return cachedMemoryToken;
  }
  try {
    let token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (!token) {
      token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token).catch(() => {});
      }
    }
    cachedMemoryToken = token;
    return token;
  } catch (err) {
    console.warn('[SecureStore] Failed to read auth token, checking AsyncStorage:', err);
    try {
      const fallback = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      cachedMemoryToken = fallback;
      return fallback;
    } catch {
      return null;
    }
  }
}

// Warm in-memory cache eagerly
getSecureAuthToken().catch(() => {});

/**
 * Dual-persistence: writes token to hardware SecureStore AND persistent AsyncStorage
 * so the session survives keychain locks, app restarts, reboots, and updates.
 */
export async function setSecureAuthToken(token: string): Promise<void> {
  cachedMemoryToken = token;
  try {
    await Promise.all([
      SecureStore.setItemAsync(AUTH_TOKEN_KEY, token).catch((e) => {
        console.warn('[SecureStore] Failed to save auth token:', e);
      }),
      AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
    ]);
  } catch (err) {
    console.warn('[Storage] Failed to save auth token:', err);
  }
}

export async function getSecureRefreshToken(): Promise<string | null> {
  if (cachedMemoryRefreshToken) {
    return cachedMemoryRefreshToken;
  }
  try {
    let refreshToken = await SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      refreshToken = await AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, refreshToken).catch(() => {});
      }
    }
    cachedMemoryRefreshToken = refreshToken;
    return refreshToken;
  } catch (err) {
    console.warn('[SecureStore] Failed to read refresh token, checking AsyncStorage:', err);
    try {
      const fallback = await AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
      cachedMemoryRefreshToken = fallback;
      return fallback;
    } catch {
      return null;
    }
  }
}

// Warm refresh token cache eagerly
getSecureRefreshToken().catch(() => {});

export async function setSecureRefreshToken(refreshToken: string): Promise<void> {
  cachedMemoryRefreshToken = refreshToken;
  try {
    await Promise.all([
      SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, refreshToken).catch((e) => {
        console.warn('[SecureStore] Failed to save refresh token:', e);
      }),
      AsyncStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken),
    ]);
  } catch (err) {
    console.warn('[Storage] Failed to save refresh token:', err);
  }
}

/**
 * Retrieves the cached user info from memory or AsyncStorage to avoid cold-start blocking.
 */
export async function getCachedUser(): Promise<AuthUser | null> {
  if (cachedMemoryUser) {
    return cachedMemoryUser;
  }
  try {
    const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string') {
      cachedMemoryUser = parsed as AuthUser;
      return cachedMemoryUser;
    }
    return null;
  } catch {
    return null;
  }
}

// Warm cached user eagerly
getCachedUser().catch(() => {});

export async function setCachedUser(user: AuthUser | null): Promise<void> {
  cachedMemoryUser = user;
  try {
    if (user) {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (err) {
    console.warn('[Storage] Failed to save cached user:', err);
  }
}

export async function removeSecureTokens(): Promise<void> {
  cachedMemoryToken = null;
  cachedMemoryRefreshToken = null;
  cachedMemoryUser = null;
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY).catch(() => {}),
      AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {}),
      AsyncStorage.removeItem(AUTH_REFRESH_TOKEN_KEY).catch(() => {}),
      AsyncStorage.removeItem(AUTH_USER_KEY).catch(() => {}),
    ]);
  } catch (err) {
    console.warn('[Storage] Failed to remove tokens:', err);
  }
}

/**
 * Custom error thrown when the user's AI processing credits have been exhausted.
 */
export class CreditExhaustedError extends Error {
  readonly code = 'NO_CREDITS_LEFT';
  constructor(message: string = 'No free credits remaining') {
    super(message);
    this.name = 'CreditExhaustedError';
  }
}

/**
 * Custom error thrown when a user attempts to log in but their email is not verified yet.
 */
export class EmailNotVerifiedError extends Error {
  email: string;
  constructor(message: string, email: string) {
    super(message);
    this.name = 'EmailNotVerifiedError';
    this.email = email;
  }
}

/**
 * Base64 URL decoding in React Native (pure JS implementation).
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < base64.length) {
    const enc1 = chars.indexOf(base64.charAt(i++));
    const enc2 = chars.indexOf(base64.charAt(i++));
    const enc3 = chars.indexOf(base64.charAt(i++));
    const enc4 = chars.indexOf(base64.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }
  return output;
}

/**
 * Decodes the JWT access token and checks if it is expired or expiring within `bufferSeconds`.
 * Uses multiple fallback strategies (atob, pure JS, regex) to ensure character encoding
 * quirks never cause a valid token to be falsely reported as expired.
 */
export function isTokenExpired(
  token: string | null | undefined,
  bufferSeconds: number = 60
): boolean {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    let jsonPayload = '';
    if (typeof atob === 'function') {
      try {
        jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } catch {
        jsonPayload = atob(base64);
      }
    } else {
      jsonPayload = base64UrlDecode(parts[1]);
    }

    let exp: number | undefined;
    try {
      const payload = JSON.parse(jsonPayload) as { exp?: number };
      exp = payload.exp;
    } catch {
      // Regex fallback if JSON.parse fails due to character encoding
      const expMatch = jsonPayload.match(/"exp"\s*:\s*(\d+)/);
      if (expMatch && expMatch[1]) {
        exp = parseInt(expMatch[1], 10);
      }
    }

    if (typeof exp !== 'number' || isNaN(exp)) return false;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return exp <= nowInSeconds + bufferSeconds;
  } catch {
    return true;
  }
}

/**
 * Returns authentication headers containing Bearer token from SecureStore/AsyncStorage.
 */
async function getAuthHeaders(customHeaders?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders || {}),
  };

  const token = await getSecureAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Validates and formats a URL string, strictly ensuring http/https protocol and
 * rejecting non-standard schemes (file://, content://, javascript:, data:, blob:).
 */
export function validateAndFormatUrl(rawUrl: string): string {
  const cleanUrl = rawUrl.trim();
  if (!cleanUrl) {
    throw new Error('Target URL cannot be empty');
  }

  const lower = cleanUrl.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('content:') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('vbscript:')
  ) {
    throw new Error('Unsupported URL protocol. Only http and https are allowed.');
  }

  const formatted =
    lower.startsWith('http://') || lower.startsWith('https://')
      ? cleanUrl
      : `https://${cleanUrl}`;

  try {
    const parsed = new URL(formatted);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid URL protocol. Only http and https are supported.');
    }
    if (!parsed.hostname || parsed.hostname.trim().length === 0) {
      throw new Error('Invalid URL: missing valid host.');
    }
    return parsed.href;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid URL format';
    throw new Error(msg);
  }
}

// Track ongoing refresh promise to prevent parallel stampeding refresh requests (Single-Flight Mutex)
let refreshPromise: Promise<boolean> | null = null;

export function attemptTokenRefresh(): Promise<boolean> {
  // If a refresh is already in-flight, return the single active promise immediately (synchronous mutex guard)
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await getSecureRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const baseUrl = await getActiveApiBaseUrl();
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // ONLY clear credentials if server explicitly rejected the refresh token as invalid/expired (401 or 400).
        // Temporary server errors (500, 502, 503, 504, 429) must NOT log the user out!
        if (response.status === 401 || response.status === 400) {
          console.warn('[Auth] Refresh token rejected by server, clearing session');
          await removeSecureTokens();
        }
        return false;
      }

      const data = (await response.json()) as {
        token?: string;
        refreshToken?: string;
        user?: AuthUser;
      };

      if (data.token) {
        await setSecureAuthToken(data.token);
        if (data.refreshToken) {
          await setSecureRefreshToken(data.refreshToken);
        }
        if (data.user) {
          await setCachedUser(data.user);
        }
        getActiveApiBaseUrl().then((apiUrl) => {
          syncCredentialsToAppGroup(data.token!, apiUrl, true);
        }).catch(() => {});
        return true;
      }
      return false;
    } catch (err) {
      // Network error or backend waking up: keep session intact and retry later
      console.warn('[Auth] Network error during token refresh:', err);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Public endpoints that must not trigger automatic token refresh upon 401
const AUTH_NO_RETRY_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/signup',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/forgot-password',
];

/**
 * Centralized fetch wrapper providing standard authentication, automatic token refresh,
 * and strongly typed error propagation strictly through the Node Backend.
 */
async function request<T>(
  path: string,
  options: RequestInit & { customHeaders?: Record<string, string>; _isRetry?: boolean } = {}
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const shouldBypassAuthRefresh = AUTH_NO_RETRY_PATHS.includes(normalizedPath);

  // Proactive refresh if access token is missing or expired, but refresh token exists
  if (!shouldBypassAuthRefresh) {
    const currentToken = await getSecureAuthToken();
    const refreshToken = await getSecureRefreshToken();
    if ((!currentToken || isTokenExpired(currentToken, 60)) && refreshToken) {
      await attemptTokenRefresh();
    }
  }

  const { customHeaders, _isRetry, ...init } = options;
  const headers = await getAuthHeaders(customHeaders);
  const baseUrl = await getActiveApiBaseUrl();

  const response = await fetch(`${baseUrl}${normalizedPath}`, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  // Reactive fallback: Handle 401 Unauthorized with silent token refresh
  if (response.status === 401 && !_isRetry && !shouldBypassAuthRefresh) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, _isRetry: true });
    }
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      ai_status?: string;
      requireVerification?: boolean;
      email?: string;
    };
    const errorMessage =
      errorData.error || errorData.message || `Request failed (Status ${response.status})`;

    if (response.status === 402 || errorData.error === 'NO_CREDITS_LEFT') {
      throw new CreditExhaustedError(errorMessage);
    }

    if (response.status === 403 && errorData.requireVerification) {
      throw new EmailNotVerifiedError(errorMessage, errorData.email || '');
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

// ==========================================
// Authentication Methods (Strictly Node Backend)
// ==========================================

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const data = await request<{ token?: string; refreshToken?: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (data.token) {
    await setSecureAuthToken(data.token);
    getActiveApiBaseUrl().then((apiUrl) => {
      syncCredentialsToAppGroup(data.token!, apiUrl, true);
    }).catch(() => {});
  }
  if (data.refreshToken) {
    await setSecureRefreshToken(data.refreshToken);
  }
  if (data.user) {
    await setCachedUser(data.user);
  }
  return data.user;
}

export interface SignUpResponse {
  user: AuthUser | null;
  token?: string | null;
  refreshToken?: string | null;
  message?: string;
  requireVerification?: boolean;
  email?: string;
}

export async function signUpUser(
  email: string,
  password: string,
  username?: string
): Promise<SignUpResponse> {
  const data = await request<SignUpResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, username }),
  });

  if (data.token) {
    await setSecureAuthToken(data.token);
    getActiveApiBaseUrl().then((apiUrl) => {
      syncCredentialsToAppGroup(data.token!, apiUrl, true);
    }).catch(() => {});
  }
  if (data.refreshToken) {
    await setSecureRefreshToken(data.refreshToken);
  }
  if (data.user) {
    await setCachedUser(data.user);
  }
  return data;
}

export async function verifyOtpUser(
  email: string,
  token: string,
  type: 'signup' | 'email' = 'signup'
): Promise<{ user: AuthUser; message?: string }> {
  const data = await request<{
    user: AuthUser;
    token?: string | null;
    refreshToken?: string | null;
    message?: string;
  }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, token, type }),
  });

  if (data.token) {
    await setSecureAuthToken(data.token);
  }
  if (data.refreshToken) {
    await setSecureRefreshToken(data.refreshToken);
  }
  if (data.user) {
    await setCachedUser(data.user);
  }
  return data;
}

export async function resendOtpUser(
  email: string,
  type: 'signup' | 'email' = 'signup'
): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email, type }),
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSecureAuthToken();
  const refreshToken = await getSecureRefreshToken();
  const cachedUser = await getCachedUser();

  // If there are no credentials stored at all, user is not logged in
  if (!token && !refreshToken) {
    if (cachedUser) await setCachedUser(null);
    return null;
  }

  // If access token is missing or expired, attempt refresh before requesting /auth/me
  if ((!token || isTokenExpired(token, 60)) && refreshToken) {
    const refreshed = await attemptTokenRefresh();
    if (!refreshed) {
      const remainingRefreshToken = await getSecureRefreshToken();
      if (!remainingRefreshToken) {
        // Refresh token was definitively rejected and cleared by server (401)
        await setCachedUser(null);
        return null;
      }
      // If refresh failed due to offline/network issue or Render cold-start, return cached user
      if (cachedUser) {
        return cachedUser;
      }
    }
  }

  try {
    const data = await request<{ user: AuthUser }>('/auth/me', { method: 'GET' });
    if (data?.user) {
      await setCachedUser(data.user);
      const currentToken = await getSecureAuthToken();
      if (currentToken) {
        getActiveApiBaseUrl().then((apiUrl) => {
          syncCredentialsToAppGroup(currentToken, apiUrl, true);
        }).catch(() => {});
      }
      return data.user;
    }
    return cachedUser;
  } catch (err: unknown) {
    // If request failed due to offline/network issue, return cached user
    if (cachedUser) {
      return cachedUser;
    }

    // Only clear credentials if backend explicitly said unauthorized (401)
    const errorMessage = err instanceof Error ? err.message : '';
    if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
      await removeSecureTokens();
      return null;
    }

    // Otherwise, keep session intact without logging user out
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await removeSecureTokens();
  getActiveApiBaseUrl().then((apiUrl) => {
    syncCredentialsToAppGroup(null, apiUrl, true);
  }).catch(() => {});
}

// ==========================================
// Bookmark Methods (Strictly Node Backend)
// ==========================================

export async function fetchBookmarks(): Promise<Bookmark[]> {
  return request<Bookmark[]>('/bookmarks', { method: 'GET' });
}

export async function createBookmark(url: string, autoAiContext: boolean = true): Promise<Bookmark> {
  const validatedUrl = validateAndFormatUrl(url);
  return request<Bookmark>('/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ url: validatedUrl }),
    customHeaders: {
      'X-Auto-AI-Context': String(autoAiContext),
    },
  });
}

export async function generateAiContext(bookmarkId: string): Promise<Bookmark> {
  return request<Bookmark>(`/bookmarks/${bookmarkId}/ai-context`, {
    method: 'POST',
  });
}

export async function triggerGenerateAi(bookmarkId: string): Promise<Bookmark> {
  return generateAiContext(bookmarkId);
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  return request<void>(`/bookmarks/${bookmarkId}`, {
    method: 'DELETE',
  });
}

export async function getUserPlan(): Promise<UserPlanInfo> {
  return request<UserPlanInfo>('/user/plan', { method: 'GET' });
}

export async function updateUserSettings(settings: { auto_ai_context: boolean }): Promise<void> {
  return request<void>('/user/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function fetchUrlMetadata(url: string): Promise<MetadataResponse> {
  const validatedUrl = validateAndFormatUrl(url);
  return request<MetadataResponse>('/extract', {
    method: 'POST',
    body: JSON.stringify({ url: validatedUrl }),
  });
}

export async function fetchBookmarkArticle(bookmarkId: string): Promise<ArticleContent> {
  return request<ArticleContent>(`/bookmarks/${bookmarkId}/article`, {
    method: 'GET',
  });
}

export async function updateUserProfile(username: string): Promise<{ user: AuthUser; message: string }> {
  return request<{ user: AuthUser; message: string }>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  });
}

export async function changeUserPassword(
  password: string,
  currentPassword?: string
): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify({ password, currentPassword }),
  });
}

export async function verifyCurrentPassword(
  email: string,
  password: string
): Promise<boolean> {
  try {
    const baseUrl = await getActiveApiBaseUrl();
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      return false;
    }
    const data = await res.json();
    return Boolean(data.token);
  } catch {
    return false;
  }
}

export async function deleteUserAccount(): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/account', {
    method: 'DELETE',
  });
}

