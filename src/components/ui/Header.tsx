import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SlidersHorizontal, ChevronDown, Check, Sparkles, X, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { PLATFORM_TABS, type PlatformType } from '../../utils/helpers';
import type { UserPlanInfo } from '../../types/bookmark';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  selectedPlatforms: PlatformType[];
  onTogglePlatform: (platform: PlatformType) => void;
  onResetPlatforms: () => void;
  platformCounts: Record<string, number>;
  planInfo: UserPlanInfo | null;
  onOpenSettings?: () => void;
  onOpenAddModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  selectedPlatforms,
  onTogglePlatform,
  onResetPlatforms,
  platformCounts,
  planInfo,
  onOpenAddModal,
}) => {
  const { colors, isDark } = useTheme();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(100);
  const filterBtnRef = useRef<View>(null);

  const isFiltered =
    selectedPlatforms.length > 0 && !selectedPlatforms.includes('all');

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

  return (
    <>
      {/* Top Search Bar Row (Matching Frontend & Figma Design) */}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Left: Serif Italic Search Input with Underline */}
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
            onChangeText={onSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search your mind..."
            placeholderTextColor={
              isDark ? 'rgba(126, 117, 105, 0.7)' : 'rgba(140, 131, 119, 0.7)'
            }
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              style={styles.clearBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <X size={15} color={colors.textMuted} strokeWidth={2.2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right Section: + Save Link Button & Platform Filter Button */}
        <View style={styles.headerRightActions}>
          {onOpenAddModal && (
            <TouchableOpacity
              style={styles.saveLinkBtn}
              onPress={onOpenAddModal}
              activeOpacity={0.85}
              accessibilityLabel="Save link"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={isDark ? ['#C88E3E', '#996533'] : ['#B5814C', '#996533']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveLinkGradient}
              >
                <Plus size={15} color="#FAF8F5" strokeWidth={2.6} />
                <Text style={styles.saveLinkText}>Save Link</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Circular Filter Button */}
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
      </View>

      {/* Multi-Select Platform Filter Dropdown Modal */}
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
            {/* Header with Tokens Indicator and Reset */}
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
                  onPress={onResetPlatforms}
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

            {/* Platform items with multi-select checkboxes */}
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
                    onPress={() => onTogglePlatform(tab.id)}
                    activeOpacity={0.7}
                  >
                    {/* Left: Checkbox & Label */}
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

                    {/* Right: Count Badge */}
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

            {/* Footer with Done button */}
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  saveLinkBtn: {
    borderRadius: 20,
    shadowColor: '#B5814C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 4,
    overflow: 'hidden',
  },
  saveLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 11,
    paddingVertical: 7.5,
    borderRadius: 20,
  },
  saveLinkText: {
    color: '#FAF8F5',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.2,
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
