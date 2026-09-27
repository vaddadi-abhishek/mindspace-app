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
import { SlidersHorizontal, ChevronDown, Check, Sparkles, X } from 'lucide-react-native';
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
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  selectedPlatforms,
  onTogglePlatform,
  onResetPlatforms,
  platformCounts,
  planInfo,
}) => {
  const { colors, isDark } = useTheme();
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
      {/* Top Search Bar Row (Matching Figma Design) */}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Left: Serif Italic Search Input */}
        <View style={styles.searchInputWrap}>
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
            placeholder="Search your mind..."
            placeholderTextColor={
              isDark ? 'rgba(126, 117, 105, 0.65)' : 'rgba(140, 131, 119, 0.65)'
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
              <X size={16} color={colors.textMuted} strokeWidth={2.2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right: Circular Filter Button (from Figma) */}
        <View ref={filterBtnRef} collapsable={false}>
          <TouchableOpacity
            style={[
              styles.filterCircleBtn,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
            onPress={handleOpenDropdown}
            activeOpacity={0.82}
            accessibilityLabel="Filter bookmarks by platform"
            accessibilityRole="button"
          >
            <SlidersHorizontal size={17} color="#FFFFFF" strokeWidth={2.3} />
            {isFiltered && <View style={styles.activeDot} />}
          </TouchableOpacity>
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
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 22,
    fontStyle: 'italic',
    paddingVertical: 2,
    letterSpacing: -0.3,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 6,
  },
  filterCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  activeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
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
