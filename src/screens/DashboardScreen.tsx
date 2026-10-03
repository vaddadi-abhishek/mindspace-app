import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  AppState,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark as BookmarkIcon, Plus } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { Bookmark, UserPlanInfo } from '../types/bookmark';
import {
  fetchBookmarks,
  createBookmark,
  generateAiContext,
  deleteBookmark,
  getUserPlan,
  CreditExhaustedError,
  validateAndFormatUrl,
} from '../services/api';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useShareIntent } from 'expo-share-intent';
import {
  findDuplicateBookmark,
  extractUrlFromText,
} from '../utils/helpers';
import {
  getPendingBookmarksFromAppGroup,
  clearPendingBookmarksInAppGroup,
} from '../services/appGroupSync';

import { HomeHeader } from '../components/ui/HomeHeader';
import { ToastHud, type ToastItem } from '../components/ui/ToastHud';
import { BookmarkCard } from '../components/cards/BookmarkCard';
import { FloatingNavBar, type FloatingNavTab } from '../components/ui/FloatingNavBar';

import { AddBookmarkModal } from '../components/modals/AddBookmarkModal';
import { CardActionSheet } from '../components/modals/CardActionSheet';
import { AiContextModal } from '../components/modals/AiContextModal';
import { ReaderModal } from '../components/modals/ReaderModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { SearchScreen } from './SearchScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { ProfileScreen } from './ProfileScreen';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Plan info (tokens / credits)
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null);
  const [autoAiContext, setAutoAiContext] = useState(true);

  // Generating AI tracking
  const [generatingAiIds, setGeneratingAiIds] = useState<Set<string>>(new Set());

  // Unified Toasts & Badges
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastCounterRef = useRef(0);

  const addToast = useCallback(
    (message: string, type?: 'success' | 'error' | 'warning' | 'info') => {
      toastCounterRef.current += 1;
      const id = `toast_${toastCounterRef.current}`;
      setToasts((prev) => {
        // Prevent duplicate messages from stacking awkwardly
        const filtered = prev.filter((t) => t.message !== message);
        return [...filtered, { id, message, type }];
      });

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const triggerNoCreditsBadge = useCallback(() => {
    addToast('No credits left', 'warning');
  }, [addToast]);

  const triggerAlreadyExistsBadge = useCallback(() => {
    addToast('Link already exists', 'warning');
  }, [addToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookmarkForMenu, setSelectedBookmarkForMenu] = useState<Bookmark | null>(null);
  const [selectedBookmarkForAi, setSelectedBookmarkForAi] = useState<Bookmark | null>(null);
  const [selectedBookmarkForReader, setSelectedBookmarkForReader] = useState<Bookmark | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Floating Nav Bar active tab (home, notifications, profile)
  const [activeTab, setActiveTab] = useState<FloatingNavTab>('home');

  const handleSelectTab = useCallback(
    (tab: FloatingNavTab) => {
      setActiveTab(tab);
    },
    []
  );

  // Initial Data Fetch
  const loadData = useCallback(async () => {
    try {
      const [fetchedBms, plan] = await Promise.all([
        fetchBookmarks().catch(() => []),
        getUserPlan().catch(() => null),
      ]);
      setBookmarks(fetchedBms);
      if (plan) {
        setPlanInfo(plan);
        setAutoAiContext(plan.auto_ai_context);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addToast(`Failed to load data: ${message}`, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Add Bookmark Handler
  const handleAddBookmark = async (newBookmark: Bookmark) => {
    // 1. Client-Side Duplicate Check
    const existing = findDuplicateBookmark(bookmarks, newBookmark.url);
    if (existing) {
      triggerAlreadyExistsBadge();
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const optimisticBookmark: Bookmark = {
      id: tempId,
      url: newBookmark.url,
      title: newBookmark.url,
      description: 'Extracting metadata...',
      site_name: '',
      logo: null,
      isFetchingMetadata: true,
      created_at: new Date().toISOString(),
    };

    setBookmarks((prev) => [optimisticBookmark, ...prev]);

    try {
      const savedBookmark = await createBookmark(newBookmark.url, autoAiContext);

      if (savedBookmark.already_exists) {
        setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
        triggerAlreadyExistsBadge();
        return;
      }

      setBookmarks((prev) => {
        const withoutOld = prev.filter((b) => b.id !== savedBookmark.id && b.id !== tempId);
        return [{ ...savedBookmark, isFetchingMetadata: false }, ...withoutOld];
      });

      addToast('Bookmark saved successfully!', 'success');

      if (autoAiContext) {
        handleGenerateAi(savedBookmark);
      }
    } catch (err: unknown) {
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
      const message = err instanceof Error ? err.message : 'Failed to save bookmark';
      addToast(`Error adding bookmark: ${message}`, 'error');
    }
  };

  // Generate AI Context Handler
  const handleGenerateAi = async (bm: Bookmark) => {
    // If user already has 0 credits on a free plan, show floating pill immediately
    if (planInfo && !planInfo.is_paid && planInfo.credits_remaining <= 0) {
      setBookmarks((prev) =>
        prev.map((b) => (b.id === bm.id ? { ...b, ai_status: 'no_credits' } : b))
      );
      triggerNoCreditsBadge();
      return;
    }

    setGeneratingAiIds((prev) => new Set(prev).add(bm.id));
    try {
      const updated = await generateAiContext(bm.id);
      setBookmarks((prev) =>
        prev.map((b) => (b.id === bm.id ? { ...b, ...updated } : b))
      );
      addToast('✨ AI Context generated successfully!', 'success');
      // Refresh plan info to update remaining tokens
      getUserPlan().then(setPlanInfo).catch(() => {});
    } catch (err: unknown) {
      if (
        err instanceof CreditExhaustedError ||
        (err instanceof Error &&
          (err.message.includes('No free credits') ||
            err.message.includes('NO_CREDITS_LEFT') ||
            err.message.includes('credits')))
      ) {
        setBookmarks((prev) =>
          prev.map((b) => (b.id === bm.id ? { ...b, ai_status: 'no_credits' } : b))
        );
        setPlanInfo((prev) =>
          prev ? { ...prev, credits_remaining: 0, credits_used: prev.credits_limit } : prev
        );
        triggerNoCreditsBadge();
      } else {
        const message = err instanceof Error ? err.message : 'Failed to generate AI';
        addToast(message, 'error');
      }
    } finally {
      setGeneratingAiIds((prev) => {
        const next = new Set(prev);
        next.delete(bm.id);
        return next;
      });
    }
  };

  // Delete Bookmark Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteBookmark(deleteTargetId);
      setBookmarks((prev) => prev.filter((b) => b.id !== deleteTargetId));
      addToast('Bookmark deleted', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      addToast(`Error: ${message}`, 'error');
    }
  };

  // Check if running inside Expo Go sandbox (native share extension requires standalone/dev build)
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  // Inbound Share Intent listener (Safari, Chrome, X, Instagram, YouTube, etc.)
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    disabled: isExpoGo,
  });

  useEffect(() => {
    if (!hasShareIntent) return;

    const rawCandidate =
      shareIntent.webUrl ||
      extractUrlFromText(shareIntent.text) ||
      (shareIntent.text && /^https?:\/\//i.test(shareIntent.text.trim()) ? shareIntent.text.trim() : null);

    if (rawCandidate) {
      const trimmed = rawCandidate.trim();
      let targetUrl: string;
      try {
        targetUrl = validateAndFormatUrl(trimmed);
      } catch {
        resetShareIntent();
        return;
      }

      let sourceName = 'Shared Link';
      try {
        const parsed = new URL(targetUrl);
        sourceName = parsed.hostname.replace(/^www\./, '');
      } catch {
        // fallback
      }

      const incomingBookmark: Bookmark = {
        id: `bm_${Date.now()}`,
        url: targetUrl,
        title: sourceName,
        description: '',
        logo: null,
        site_name: sourceName,
        created_at: new Date().toISOString(),
        isFetchingMetadata: true,
      };

      handleAddBookmark(incomingBookmark);
      addToast(`Saving shared link from ${sourceName}...`, 'success');
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent, addToast, resetShareIntent]);

  // Sync any bookmarks saved by the Share Extension while app was closed or in background
  useEffect(() => {
    const syncAppGroupBookmarks = () => {
      const pending = getPendingBookmarksFromAppGroup();
      if (pending && pending.length > 0) {
        clearPendingBookmarksInAppGroup();
        loadData();
        addToast(`Synced ${pending.length} link(s) saved via Share Sheet!`, 'success');
      }
    };

    syncAppGroupBookmarks();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncAppGroupBookmarks();
      }
    });
    return () => sub.remove();
  }, [loadData, addToast]);



  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* 1. Home / Bookmark Feed Screen */}
      <View
        style={[
          styles.screenContainer,
          { display: activeTab === 'home' ? 'flex' : 'none' },
        ]}
      >
        <HomeHeader
          onOpenAddModal={() => setIsAddModalOpen(true)}
          planInfo={planInfo}
        />

        <FlatList
          style={styles.feedList}
          data={bookmarks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookmarkCard
              bookmark={item}
              onOpenMenu={(bm) => setSelectedBookmarkForMenu(bm)}
              onReadArticle={(bm) => setSelectedBookmarkForReader(bm)}
              onViewAiContext={(bm) => setSelectedBookmarkForAi(bm)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            bookmarks.length === 0 && styles.listEmptyContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconWrap,
                    { backgroundColor: colors.accentBg },
                  ]}
                >
                  <BookmarkIcon size={32} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textHeading }]}>
                  Your Mindspace is empty
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  Tap "+ Save Link" on the top right to save your first article, video, or social post.
                </Text>

                <TouchableOpacity
                  onPress={() => setIsAddModalOpen(true)}
                  style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
                >
                  <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.emptyAddBtnText}>Save First Link</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      </View>

      {/* 2. Search Screen (Dedicated screen with plain background, live card matching, filter button & badges) */}
      <View
        style={[
          styles.screenContainer,
          { display: activeTab === 'search' ? 'flex' : 'none' },
        ]}
      >
        <SearchScreen
          bookmarks={bookmarks}
          onOpenMenu={(bm) => setSelectedBookmarkForMenu(bm)}
          onReadArticle={(bm) => setSelectedBookmarkForReader(bm)}
          onViewAiContext={(bm) => setSelectedBookmarkForAi(bm)}
          planInfo={planInfo}
        />
      </View>

      {/* 3. Notifications Screen */}
      <View
        style={[
          styles.screenContainer,
          { display: activeTab === 'notifications' ? 'flex' : 'none' },
        ]}
      >
        <NotificationsScreen
          onShowToast={addToast}
          onNavigateHome={() => setActiveTab('home')}
        />
      </View>

      {/* 4. Profile Screen (Settings reside inside Profile) */}
      <View
        style={[
          styles.screenContainer,
          { display: activeTab === 'profile' ? 'flex' : 'none' },
        ]}
      >
        <ProfileScreen
          planInfo={planInfo}
          onPlanUpdated={loadData}
          onShowToast={addToast}
        />
      </View>

      {/* Floating Capsule Navbar */}
      <FloatingNavBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Floating Toast HUD (Single Unified Pill Notification Component) */}
      <ToastHud toasts={toasts} onDismiss={dismissToast} />

      {/* Modals */}
      <AddBookmarkModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBookmark={handleAddBookmark}
        autoAiContext={autoAiContext}
        onToggleAutoAiContext={setAutoAiContext}
        planInfo={planInfo}
        onShowToast={addToast}
      />

      <CardActionSheet
        visible={Boolean(selectedBookmarkForMenu)}
        bookmark={selectedBookmarkForMenu}
        onClose={() => setSelectedBookmarkForMenu(null)}
        onReadArticle={(bm) => {
          setSelectedBookmarkForMenu(null);
          setSelectedBookmarkForReader(bm);
        }}
        onViewAiContext={(bm) => {
          setSelectedBookmarkForMenu(null);
          setSelectedBookmarkForAi(bm);
        }}
        onGenerateAiContext={(bm) => {
          setSelectedBookmarkForMenu(null);
          handleGenerateAi(bm);
        }}
        onRequestDelete={(id) => {
          setSelectedBookmarkForMenu(null);
          setDeleteTargetId(id);
        }}
        onShowToast={addToast}
        isGeneratingAi={
          selectedBookmarkForMenu
            ? generatingAiIds.has(selectedBookmarkForMenu.id)
            : false
        }
      />

      <AiContextModal
        visible={Boolean(selectedBookmarkForAi)}
        bookmark={selectedBookmarkForAi}
        onClose={() => setSelectedBookmarkForAi(null)}
        onShowToast={addToast}
      />

      <ReaderModal
        visible={Boolean(selectedBookmarkForReader)}
        bookmark={selectedBookmarkForReader}
        onClose={() => setSelectedBookmarkForReader(null)}
      />

      <DeleteConfirmModal
        visible={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  feedList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
  emptyResetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  emptyResetBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
