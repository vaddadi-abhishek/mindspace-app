import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
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
} from '../services/api';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useShareIntent } from 'expo-share-intent';
import {
  findDuplicateBookmark,
  matchesPlatform,
  extractUrlFromText,
  PLATFORM_TABS,
  type PlatformType,
} from '../utils/helpers';

import { Header } from '../components/ui/Header';
import { ToastHud, type ToastItem } from '../components/ui/ToastHud';
import { FloatingBadge } from '../components/ui/FloatingBadge';
import { BookmarkCard } from '../components/cards/BookmarkCard';
import { BottomNavBar, type BottomNavTab } from '../components/ui/BottomNavBar';

import { AddBookmarkModal } from '../components/modals/AddBookmarkModal';
import { CardActionSheet } from '../components/modals/CardActionSheet';
import { AiContextModal } from '../components/modals/AiContextModal';
import { ReaderModal } from '../components/modals/ReaderModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import { ProfileModal } from '../components/modals/ProfileModal';

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

  // Search & Multi-select Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(['all']);

  // Generating AI tracking
  const [generatingAiIds, setGeneratingAiIds] = useState<Set<string>>(new Set());

  // Floating Badges (3.2 seconds display)
  const [showNoCreditsBadge, setShowNoCreditsBadge] = useState(false);
  const noCreditsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerNoCreditsBadge = useCallback(() => {
    if (noCreditsTimeoutRef.current) clearTimeout(noCreditsTimeoutRef.current);
    setShowNoCreditsBadge(true);
    noCreditsTimeoutRef.current = setTimeout(() => {
      setShowNoCreditsBadge(false);
    }, 3200);
  }, []);

  const [showAlreadyExistsBadge, setShowAlreadyExistsBadge] = useState(false);
  const alreadyExistsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAlreadyExistsBadge = useCallback(() => {
    if (alreadyExistsTimeoutRef.current) clearTimeout(alreadyExistsTimeoutRef.current);
    setShowAlreadyExistsBadge(true);
    alreadyExistsTimeoutRef.current = setTimeout(() => {
      setShowAlreadyExistsBadge(false);
    }, 3200);
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastCounterRef = useRef(0);

  const addToast = useCallback((message: string, type?: 'success' | 'error') => {
    toastCounterRef.current += 1;
    const id = `toast_${toastCounterRef.current}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookmarkForMenu, setSelectedBookmarkForMenu] = useState<Bookmark | null>(null);
  const [selectedBookmarkForAi, setSelectedBookmarkForAi] = useState<Bookmark | null>(null);
  const [selectedBookmarkForReader, setSelectedBookmarkForReader] = useState<Bookmark | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Bottom Nav Bar active tab
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');

  const handleSelectTab = useCallback(
    (tab: BottomNavTab) => {
      setActiveTab(tab);
      if (tab === 'settings') {
        setIsSettingsOpen(true);
      } else if (tab === 'profile') {
        setIsProfileOpen(true);
      } else if (tab === 'notifications') {
        addToast('All caught up! No new notifications.');
      }
    },
    [addToast]
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
        (err instanceof Error && err.message.includes('No free credits'))
      ) {
        setBookmarks((prev) =>
          prev.map((b) => (b.id === bm.id ? { ...b, ai_status: 'no_credits' } : b))
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
      const targetUrl = rawCandidate.trim();
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

  // Platform Counts
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { all: bookmarks.length };
    bookmarks.forEach((bm) => {
      PLATFORM_TABS.forEach((tab) => {
        if (tab.id !== 'all' && matchesPlatform(bm, tab.id)) {
          counts[tab.id] = (counts[tab.id] || 0) + 1;
        }
      });
    });
    return counts;
  }, [bookmarks]);

  // Multi-select toggle platform
  const handleTogglePlatform = useCallback((platform: PlatformType) => {
    if (platform === 'all') {
      setSelectedPlatforms(['all']);
      return;
    }

    setSelectedPlatforms((prev) => {
      const withoutAll = prev.filter((p) => p !== 'all');
      if (withoutAll.includes(platform)) {
        const next = withoutAll.filter((p) => p !== platform);
        return next.length === 0 ? ['all'] : next;
      } else {
        return [...withoutAll, platform];
      }
    });
  }, []);

  const handleResetPlatforms = useCallback(() => {
    setSelectedPlatforms(['all']);
  }, []);

  // Filter & Search
  const isAllSelected =
    selectedPlatforms.length === 0 || selectedPlatforms.includes('all');

  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    // Platform multi-select filter
    if (!isAllSelected) {
      result = result.filter((bm) =>
        selectedPlatforms.some((platform) => matchesPlatform(bm, platform))
      );
    }

    // Search query
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter((bm) => {
        const titleMatch = (bm.title || '').toLowerCase().includes(q);
        const descMatch = (bm.description || '').toLowerCase().includes(q);
        const urlMatch = (bm.url || '').toLowerCase().includes(q);
        const siteMatch = (bm.site_name || '').toLowerCase().includes(q);
        const catMatch = (bm.ai_category || []).some((c) => c.toLowerCase().includes(q));
        const tagMatch = (bm.ai_tags || []).some((t) => t.toLowerCase().includes(q));
        return titleMatch || descMatch || urlMatch || siteMatch || catMatch || tagMatch;
      });
    }

    return result;
  }, [bookmarks, selectedPlatforms, isAllSelected, searchTerm]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Bookmark Feed with scrollable top search bar, tokens & filters */}
      <FlatList
        style={styles.feedList}
        data={filteredBookmarks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookmarkCard
            bookmark={item}
            onOpenMenu={(bm) => setSelectedBookmarkForMenu(bm)}
            onReadArticle={(bm) => setSelectedBookmarkForReader(bm)}
            onViewAiContext={(bm) => setSelectedBookmarkForAi(bm)}
          />
        )}
        ListHeaderComponent={
          <Header
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedPlatforms={selectedPlatforms}
            onTogglePlatform={handleTogglePlatform}
            onResetPlatforms={handleResetPlatforms}
            platformCounts={platformCounts}
            planInfo={planInfo}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredBookmarks.length === 0 && styles.listEmptyContent,
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
                {searchTerm || !isAllSelected
                  ? 'No matching bookmarks'
                  : 'Your Mindspace is empty'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {searchTerm || !isAllSelected
                  ? 'Try searching for something else or clearing filters.'
                  : 'Tap the "+" button to add your first article, video, or link.'}
              </Text>

              {(searchTerm || !isAllSelected) && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchTerm('');
                    setSelectedPlatforms(['all']);
                  }}
                  style={[styles.emptyResetBtn, { borderColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.emptyResetBtnText, { color: colors.primary }]}>
                    Clear Search & Filters
                  </Text>
                </TouchableOpacity>
              )}

              {!searchTerm && isAllSelected && (
                <TouchableOpacity
                  onPress={() => setIsAddModalOpen(true)}
                  style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
                >
                  <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.emptyAddBtnText}>Save First Link</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />

      {/* Bottom React Native Navbar (Matching Figma) */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Floating Badges */}
      <FloatingBadge visible={showNoCreditsBadge} text="No credits left" />
      <FloatingBadge visible={showAlreadyExistsBadge} text="Link already exists" />

      {/* Floating Toast HUD */}
      <ToastHud toasts={toasts} onDismiss={dismissToast} />

      {/* Modals */}
      <AddBookmarkModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBookmark={handleAddBookmark}
        autoAiContext={autoAiContext}
        onToggleAutoAiContext={setAutoAiContext}
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

      <SettingsModal
        visible={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setActiveTab('home');
        }}
        planInfo={planInfo}
        onPlanUpdated={loadData}
        onShowToast={addToast}
      />

      <ProfileModal
        visible={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setActiveTab('home');
        }}
        onShowToast={addToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  feedList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
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
