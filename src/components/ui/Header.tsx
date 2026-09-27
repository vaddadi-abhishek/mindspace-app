import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidersHorizontal, ChevronDown, Check, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SearchBar } from './SearchBar';
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
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  selectedPlatforms,
  onTogglePlatform,
  onResetPlatforms,
  platformCounts,
  planInfo,
  onOpenSettings,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(110);
  const filterBtnRef = useRef<View>(null);

  const isFiltered =
    selectedPlatforms.length > 0 && !selectedPlatforms.includes('all');

  const filterButtonLabel = !isFiltered
    ? 'Filter'
    : selectedPlatforms.length === 1
    ? PLATFORM_TABS.find((t) => t.id === selectedPlatforms[0])?.label || 'Filter'
    : `Filters (${selectedPlatforms.length})`;

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
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        {/* Row 1: Search Bar (Full Width) */}
        <View style={styles.searchRow}>
          <SearchBar value={searchTerm} onChangeText={onSearchChange} />
        </View>

        {/* Row 2: Tokens (Left) and Multi-Select Filter Button (Right) */}
        <View style={styles.controlsRow}>
          {/* Left: Remaining AI Tokens */}
          <TouchableOpacity
            style={[
              styles.tokenBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(200, 142, 62, 0.12)'
                  : 'rgba(181, 129, 76, 0.08)',
                borderColor: isDark
                  ? 'rgba(200, 142, 62, 0.25)'
                  : 'rgba(181, 129, 76, 0.22)',
              },
            ]}
            onPress={onOpenSettings}
            activeOpacity={0.7}
            accessibilityLabel="Remaining AI tokens"
          >
            <Sparkles size={12} color={colors.primary} />
            <Text style={[styles.tokenText, { color: colors.primary }]}>
              {planInfo?.credits_remaining ?? 0} AI tokens
            </Text>
          </TouchableOpacity>

          {/* Right: Multi-Select Filter Button */}
          <View ref={filterBtnRef} collapsable={false}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: isFiltered
                    ? isDark
                      ? 'rgba(200, 142, 62, 0.18)'
                      : 'rgba(181, 129, 76, 0.14)'
                    : isDark
                    ? 'rgba(38, 33, 28, 0.65)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isFiltered
                    ? colors.primary
                    : isDark
                    ? 'rgba(60, 52, 44, 0.7)'
                    : 'rgba(235, 229, 220, 0.9)',
                },
              ]}
              onPress={handleOpenDropdown}
              activeOpacity={0.75}
              accessibilityLabel="Filter bookmarks by platform"
              accessibilityRole="button"
            >
              <SlidersHorizontal
                size={13}
                color={isFiltered ? colors.primary : colors.textBody}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: isFiltered ? colors.primary : colors.textHeading,
                    fontWeight: isFiltered ? '700' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {filterButtonLabel}
              </Text>
              <ChevronDown
                size={12}
                color={isFiltered ? colors.primary : colors.textMuted}
                strokeWidth={2.2}
              />
              {isFiltered && (
                <View
                  style={[
                    styles.filterActiveDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Multi-Select Filter Dropdown Modal */}
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
            {/* Header */}
            <View style={styles.dropdownHeader}>
              <Text
                style={[
                  styles.dropdownHeaderText,
                  { color: colors.textMuted },
                ]}
              >
                Filter by Platform
              </Text>
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
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  searchRow: {
    width: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  tokenText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12.5,
    maxWidth: 90,
  },
  filterActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 1,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  dropdownCard: {
    position: 'absolute',
    right: 16,
    width: 230,
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
  dropdownHeaderText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
