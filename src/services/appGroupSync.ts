import { Platform } from 'react-native';
import { ShareIntentModule } from 'expo-share-intent';

export interface PendingSharedBookmark {
  id: string;
  url: string;
  title?: string;
  created_at?: string;
}

/**
 * Synchronizes user authentication token, API base URL, and Auto-AI setting
 * to the shared iOS AppGroup container (group.com.mindspace.app).
 * This allows the iOS Share Extension to save links directly in the background
 * without needing the host application to launch or take focus.
 */
export function syncCredentialsToAppGroup(
  token: string | null,
  apiUrl: string,
  autoAi: boolean
): void {
  if (Platform.OS !== 'ios' || !ShareIntentModule) return;
  try {
    if (token) {
      (ShareIntentModule as any).setAppGroupValue?.('mindspace_auth_token', token);
    } else {
      (ShareIntentModule as any).setAppGroupValue?.('mindspace_auth_token', '');
    }
    (ShareIntentModule as any).setAppGroupValue?.('mindspace_api_url', apiUrl);
    (ShareIntentModule as any).setAppGroupValue?.(
      'mindspace_auto_ai',
      autoAi ? 'true' : 'false'
    );
  } catch (err) {
    console.warn('[AppGroupSync] Error syncing credentials:', err);
  }
}

/**
 * Retrieves any pending bookmarks saved by the Share Extension while the app was closed.
 */
export function getPendingBookmarksFromAppGroup(): PendingSharedBookmark[] {
  if (Platform.OS !== 'ios' || !ShareIntentModule) return [];
  try {
    const raw = (ShareIntentModule as any).getAppGroupValue?.('pendingBookmarks');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Clears the pending bookmarks queue in the shared AppGroup.
 */
export function clearPendingBookmarksInAppGroup(): void {
  if (Platform.OS !== 'ios' || !ShareIntentModule) return;
  try {
    (ShareIntentModule as any).setAppGroupValue?.('pendingBookmarks', '[]');
  } catch (err) {
    console.warn('[AppGroupSync] Error clearing pending bookmarks:', err);
  }
}
