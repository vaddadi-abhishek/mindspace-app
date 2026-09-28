import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Search,
  SlidersHorizontal,
  X,
  Check,
  Sparkles,
  Bookmark as BookmarkIcon,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { BookmarkCard } from '../components/cards/BookmarkCard';
import type { Bookmark, UserPlanInfo } from '../types/bookmark';
import {
  PLATFORM_TABS,
  matchesPlatform,
  type PlatformType,
} from '../utils/helpers';

interface SearchScreenProps {
  bookmarks: Bookmark[];
  onOpenMenu: (bookmark: Bookmark) => void;
  onReadArticle: (bookmark: Bookmark) => void;
  onViewAiContext: (bookmark: Bookmark) => void;
  planInfo: UserPlanInfo | null;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  bookmarks,
  onOpenMenu,
  onReadArticle,
  onViewAiContext,
  planInfo,
}) => {
  const { colors, isDark } = useTheme();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(['all']);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(100);
  const filterBtnRef = useRef<View>(null);

  const isFiltered =
    selectedPlatforms.length > 0 && !selectedPlatforms.includes('all');
  const hasQuery = searchTerm.trim().length > 0;
  const isSearching = hasQuery || isFiltered;

  // Platform counts
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

  // Toggle platform in multi-select dropdown
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

  // Remove single active filter badge via X icon
  const handleRemovePlatform = useCallback((platform: PlatformType) => {
    setSelectedPlatforms((prev) => {
      const next = prev.filter((p) => p !== platform);
      return next.length === 0 ? ['all'] : next;
    });
  }, []);

  const handleResetPlatforms = useCallback(() => {
    setSelectedPlatforms(['all']);
  }, []);

  const handleOpenDropdown = () => {
    if (filterBtnRef.current) {
      filterBtnRef.current.measureInWindow((_x, y, _width, height) => {
        if (y > 0) {
          setDropdownTop(y + height + 6);
        }
        setIsFilterDropdownOpen(true);
      });
    } else {
      setIsFilterDropdownOpen(true);
    }
  };

  // Filter bookmarks when searching
  const filteredBookmarks = useMemo(() => {
    if (!isSearching) return [];

    let result = bookmarks;

    if (isFiltered) {
      result = result.filter((bm) =>
        selectedPlatforms.some((platform) => matchesPlatform(bm, platform))
      );
    }

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
  }, [bookmarks, isSearching, isFiltered, selectedPlatforms, searchTerm]);

  // Active filter items for badges
  const activeFilterTabs = useMemo(() => {
    if (!isFiltered) return [];
    return PLATFORM_TABS.filter((t) => t.id !== 'all' && selectedPlatforms.includes(t.id));
  }, [isFiltered, selectedPlatforms]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header Row */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          {/* Underlined Italic Serif Search Input */}
          <View
            style={[
              styles.searchInputWrap,
              {
                borderBottomColor: isSearchFocused
                  ? colors.primary
                  : isDark
                  ? 'rgba(200, 142, 62, 0.3)'
                  : 'rgba(181, 129, 76, 0.3)',
              },
            ]}
          >
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: colors.textHeading,
                  fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
                },
              ]}
              value={searchTerm}
              onChangeText={setSearchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search your mind..."
              placeholderTextColor={
                isDark ? 'rgba(126, 117, 105, 0.7)' : 'rgba(140, 131, 119, 0.7)'
              }
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="never"
              autoFocus
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchTerm('')}
                style={styles.clearBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear search"
                accessibilityRole="button"
              >
                <X size={15} color={colors.textMuted} strokeWidth={2.2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Button */}
          <View ref={filterBtnRef} collapsable={false}>
            <TouchableOpacity
              style={[
                styles.filterCircleBtn,
                {
                  backgroundColor: isFiltered
                    ? colors.primary
                    : isDark
                    ? 'rgba(200, 142, 62, 0.15)'
                    : 'rgba(181, 129, 76, 0.12)',
                  borderColor: isFiltered
                    ? colors.primary
                    : isDark
                    ? 'rgba(200, 142, 62, 0.35)'
                    : 'rgba(181, 129, 76, 0.3)',
                },
              ]}
              onPress={handleOpenDropdown}
              activeOpacity={0.82}
              accessibilityLabel="Filter bookmarks by platform"
              accessibilityRole="button"
            >
              <SlidersHorizontal
                size={16}
                color={isFiltered ? '#FFFFFF' : colors.primary}
                strokeWidth={2.2}
              />
              {isFiltered && <View style={styles.activeDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filter Badges with X Close Icon */}
        {activeFilterTabs.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScroll}
          >
            {activeFilterTabs.map((tab) => (
              <View
                key={tab.id}
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(200, 142, 62, 0.16)'
                      : 'rgba(181, 129, 76, 0.12)',
                    borderColor: isDark
                      ? 'rgba(200, 142, 62, 0.4)'
                      : 'rgba(181, 129, 76, 0.35)',
                  },
                ]}
              >
                <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
                  {tab.label}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemovePlatform(tab.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.filterBadgeClose}
                  accessibilityLabel={`Remove filter ${tab.label}`}
                  accessibilityRole="button"
                >
                  <X size={12} color={colors.primary} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              onPress={handleResetPlatforms}
              style={styles.clearAllBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.clearAllText, { color: colors.textMuted }]}>
                Clear all
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Main Content Area */}
      {!isSearching ? (
        /* Plain background with NO cards until user starts typing or filters */
        <View style={styles.plainContainer}>
          <View
            style={[
              styles.plainSearchIconWrap,
              {
                backgroundColor: isDark
                  ? 'rgba(200, 142, 62, 0.12)'
                  : 'rgba(181, 129, 76, 0.09)',
              },
            ]}
          >
            <Search size={30} color={colors.primary} />
          </View>
          <Text
            style={[
              styles.plainSearchTitle,
              {
                color: colors.textHeading,
                fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
              },
            ]}
          >
            Search your mind...
          </Text>
          <Text style={[styles.plainSearchSubtitle, { color: colors.textMuted }]}>
            Type keywords, concepts, or filter by platform to instantly recall your saved bookmarks.
          </Text>
        </View>
      ) : (
        /* Matching cards display */
        <FlatList
          style={styles.resultsList}
          data={filteredBookmarks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookmarkCard
              bookmark={item}
              onOpenMenu={onOpenMenu}
              onReadArticle={onReadArticle}
              onViewAiContext={onViewAiContext}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            filteredBookmarks.length === 0 && styles.listEmptyContent,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: colors.accentBg },
                ]}
              >
                <BookmarkIcon size={30} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textHeading }]}>
                No matching bookmarks
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                No saved items match "{searchTerm}". Try a different search term or remove filters.
              </Text>

              {isFiltered && (
                <TouchableOpacity
                  onPress={handleResetPlatforms}
                  style={[styles.emptyResetBtn, { borderColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.emptyResetBtnText, { color: colors.primary }]}>
                    Reset Platform Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Platform Filter Dropdown Modal */}
      <Modal
        visible={isFilterDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterDropdownOpen(false)}
      >
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => setIsFilterDropdownOpen(false)}
        >
          <View
            style={[
              styles.dropdownCard,
              {
                top: dropdownTop,
                backgroundColor: isDark ? '#161310' : '#FAF8F5',
                borderColor: isDark
                  ? 'rgba(200, 142, 62, 0.25)'
                  : 'rgba(181, 129, 76, 0.25)',
                shadowColor: '#000000',
              },
            ]}
          >
            {/* Dropdown Header */}
            <View style={styles.dropdownHeader}>
              <View style={styles.headerTitleRow}>
                <Text
                  style={[
                    styles.dropdownHeaderText,
                    { color: colors.textMuted },
                  ]}
                >
                  Filter by Platform
                </Text>
                <View
                  style={[
                    styles.tokenChip,
                    {
                      backgroundColor: isDark
                        ? 'rgba(200, 142, 62, 0.12)'
                        : 'rgba(181, 129, 76, 0.08)',
                    },
                  ]}
                >
                  <Sparkles size={10} color={colors.primary} />
                  <Text style={[styles.tokenChipText, { color: colors.primary }]}>
                    {planInfo?.credits_remaining ?? 0} tokens
                  </Text>
                </View>
              </View>

              {isFiltered && (
                <TouchableOpacity
                  onPress={handleResetPlatforms}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text
                    style={[
                      styles.dropdownResetText,
                      { color: colors.primary },
                    ]}
                  >
                    Reset
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View
              style={[
                styles.dropdownDivider,
                {
                  backgroundColor: isDark
                    ? 'rgba(60, 52, 44, 0.6)'
                    : 'rgba(235, 229, 220, 0.8)',
                },
              ]}
            />

            {/* Platform Items */}
            <ScrollView style={styles.dropdownList} bounces={false}>
              {PLATFORM_TABS.map((tab) => {
                const isSelected =
                  tab.id === 'all'
                    ? !isFiltered
                    : selectedPlatforms.includes(tab.id);
                const count = platformCounts[tab.id] ?? 0;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.dropdownItem,
                      isSelected && {
                        backgroundColor: isDark
                          ? 'rgba(200, 142, 62, 0.12)'
                          : 'rgba(181, 129, 76, 0.08)',
                      },
                    ]}
                    onPress={() => handleTogglePlatform(tab.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isSelected
                              ? colors.primary
                              : isDark
                              ? 'rgba(255, 255, 255, 0.3)'
                              : 'rgba(0, 0, 0, 0.25)',
                            backgroundColor: isSelected
                              ? colors.primary
                              : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && (
                          <Check
                            size={10.5}
                            color="#FFFFFF"
                            strokeWidth={3}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          {
                            color: isSelected
                              ? colors.primary
                              : colors.textHeading,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.countBadge,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.countBadgeText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textMuted,
                          },
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View
              style={[
                styles.dropdownDivider,
                {
                  backgroundColor: isDark
                    ? 'rgba(60, 52, 44, 0.6)'
                    : 'rgba(235, 229, 220, 0.8)',
                },
              ]}
            />
            <View style={styles.dropdownFooter}>
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setIsFilterDropdownOpen(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.applyButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    paddingBottom: 4,
    minHeight: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    fontStyle: 'italic',
    paddingVertical: 2,
    letterSpacing: -0.2,
  },
  clearBtn: {
    padding: 3,
    marginLeft: 4,
  },
  filterCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  activeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B5814C',
  },
  badgesScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterBadgeClose: {
    padding: 2,
  },
  clearAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  plainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 12,
  },
  plainSearchIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  plainSearchTitle: {
    fontSize: 22,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  plainSearchSubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
  resultsList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  emptyResetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 6,
  },
  emptyResetBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  dropdownCard: {
    position: 'absolute',
    right: 16,
    width: 235,
    maxHeight: 440,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  headerTitleRow: {
    flexDirection: 'column',
    gap: 3,
  },
  dropdownHeaderText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tokenChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dropdownResetText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  dropdownDivider: {
    height: 1,
    marginVertical: 4,
  },
  dropdownList: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontSize: 13,
  },
  countBadge: {
    paddingHorizontal: 6.5,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownFooter: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 2,
  },
  applyButton: {
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
