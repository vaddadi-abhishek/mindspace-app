import React, { useState } from 'react';
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
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SearchBar } from './SearchBar';
import { PLATFORM_TABS, type PlatformType } from '../../utils/helpers';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  activePlatform: PlatformType;
  onSelectPlatform: (platform: PlatformType) => void;
  platformCounts: Record<string, number>;
  isScrolled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  activePlatform,
  onSelectPlatform,
  platformCounts,
  isScrolled,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const isFiltered = activePlatform !== 'all';
  const activeTabLabel =
    PLATFORM_TABS.find((tab) => tab.id === activePlatform)?.label || 'Filter';

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 8) + 6,
            backgroundColor: isScrolled
              ? isDark
                ? 'rgba(11, 9, 7, 0.88)'
                : 'rgba(250, 248, 245, 0.92)'
              : 'transparent',
            borderBottomColor: isScrolled
              ? isDark
                ? 'rgba(60, 52, 44, 0.7)'
                : 'rgba(235, 229, 220, 0.85)'
              : 'transparent',
            shadowColor: isScrolled
              ? isDark
                ? '#000000'
                : '#211D1A'
              : 'transparent',
            shadowOpacity: isScrolled ? (isDark ? 0.45 : 0.08) : 0,
            elevation: isScrolled ? 4 : 0,
          },
        ]}
      >
        <View style={styles.contentRow}>
          {/* Web-Style Search Bar */}
          <SearchBar value={searchTerm} onChangeText={onSearchChange} />

          {/* Platform Filter Button */}
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
            onPress={() => setIsFilterDropdownOpen(true)}
            activeOpacity={0.75}
            accessibilityLabel="Filter by platform"
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
              {isFiltered ? activeTabLabel : 'Filter'}
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
                top: Math.max(insets.top, 8) + 54,
                backgroundColor: isDark ? '#161310' : '#FAF8F5',
                borderColor: isDark
                  ? 'rgba(200, 142, 62, 0.25)'
                  : 'rgba(181, 129, 76, 0.25)',
                shadowColor: '#000000',
              },
            ]}
          >
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
                  onPress={() => {
                    onSelectPlatform('all');
                    setIsFilterDropdownOpen(false);
                  }}
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

            <ScrollView style={styles.dropdownList} bounces={false}>
              {PLATFORM_TABS.map((tab) => {
                const isSelected = activePlatform === tab.id;
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
                    onPress={() => {
                      onSelectPlatform(tab.id);
                      setIsFilterDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
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

                    <View style={styles.dropdownItemRight}>
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

                      {isSelected && (
                        <Check
                          size={14}
                          color={colors.primary}
                          strokeWidth={2.5}
                          style={styles.checkIcon}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12.5,
    maxWidth: 75,
  },
  filterActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 1,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  dropdownCard: {
    position: 'absolute',
    right: 16,
    width: 215,
    maxHeight: 380,
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
    maxHeight: 320,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8.5,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  dropdownItemText: {
    fontSize: 13,
  },
  dropdownItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  checkIcon: {
    marginLeft: 6,
  },
});
