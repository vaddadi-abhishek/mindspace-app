import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CUSTOM_API_URL_KEY = 'mindspace_custom_api_url';

export const DEFAULT_PRODUCTION_API_URL = 'https://mindspace-link-web-scrapper.onrender.com/api/v1';
export const DEFAULT_LOCAL_API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/v1' : 'http://localhost:3000/api/v1';

/**
 * Resolves the initial API base URL:
 * 1. Checks EXPO_PUBLIC_API_URL if set in .env.
 * 2. If pointing to localhost on Android, maps to 10.0.2.2.
 * 3. Fallback to default local or production URL.
 */
export function getDefaultApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (Platform.OS === 'android' && clean.includes('localhost')) {
      clean = clean.replace('localhost', '10.0.2.2');
    }
    return clean;
  }
  return DEFAULT_PRODUCTION_API_URL;
}

let cachedBaseUrl: string | null = null;

export async function getActiveApiBaseUrl(): Promise<string> {
  // Production builds strictly lock to the hardened production origin
  if (!__DEV__) {
    return DEFAULT_PRODUCTION_API_URL;
  }

  if (cachedBaseUrl) return cachedBaseUrl;
  try {
    const custom = await AsyncStorage.getItem(CUSTOM_API_URL_KEY);
    if (custom && custom.trim()) {
      cachedBaseUrl = custom.trim().replace(/\/+$/, '');
      return cachedBaseUrl;
    }
  } catch {
    // fallback
  }
  cachedBaseUrl = getDefaultApiBaseUrl();
  return cachedBaseUrl;
}

export async function setActiveApiBaseUrl(newUrl: string): Promise<void> {
  if (!__DEV__) {
    throw new Error('Changing backend URL is strictly forbidden in production builds.');
  }

  const clean = newUrl.trim().replace(/\/+$/, '');
  const lower = clean.toLowerCase();

  // Enforce strictly http:// or https:// (disallow javascript:, file:, data:, blob:)
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    throw new Error('Server URL must start with http:// or https://');
  }

  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid URL protocol. Only http: and https: are allowed.');
    }
    if (!parsed.hostname || parsed.hostname.trim().length === 0) {
      throw new Error('Invalid URL: missing host.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid URL';
    throw new Error(msg);
  }

  cachedBaseUrl = clean;
  await AsyncStorage.setItem(CUSTOM_API_URL_KEY, clean);
}

export async function resetActiveApiBaseUrl(): Promise<void> {
  if (!__DEV__) {
    return;
  }
  cachedBaseUrl = null;
  await AsyncStorage.removeItem(CUSTOM_API_URL_KEY);
}
