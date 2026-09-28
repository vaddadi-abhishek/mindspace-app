import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Bell, User } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export type FloatingNavTab = 'home' | 'search' | 'notifications' | 'profile';
export type BottomNavTab = FloatingNavTab; // alias for backwards compatibility

interface FloatingNavBarProps {
  activeTab: FloatingNavTab;
  onSelectTab: (tab: FloatingNavTab) => void;
  unreadCount?: number;
}

export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({
  activeTab,
  onSelectTab,
  unreadCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom + 8, 16),
        },
      ]}
    >
      <View
        style={[
          styles.dock,
          {
            backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
            borderColor: isDark ? '#2E2822' : '#E7E0D8',
            shadowColor: isDark ? '#000000' : '#211D1A',
            shadowOpacity: isDark ? 0.45 : 0.12,
          },
        ]}
      >
        {/* 1. Home Tab */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'home' && [
              styles.activeTabItem,
              {
                backgroundColor: isDark
                  ? 'rgba(200, 142, 62, 0.18)'
                  : 'rgba(181, 129, 76, 0.12)',
              },
            ],
          ]}
          onPress={() => onSelectTab('home')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityLabel="Home"
          accessibilityState={{ selected: activeTab === 'home' }}
        >
          <Home
            size={17}
            color={activeTab === 'home' ? colors.primary : colors.textMuted}
            strokeWidth={activeTab === 'home' ? 2.4 : 1.8}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'home' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'home' ? '700' : '500',
              },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Search Tab */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'search' && [
              styles.activeTabItem,
              {
                backgroundColor: isDark
                  ? 'rgba(200, 142, 62, 0.18)'
                  : 'rgba(181, 129, 76, 0.12)',
              },
            ],
          ]}
          onPress={() => onSelectTab('search')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityLabel="Search"
          accessibilityState={{ selected: activeTab === 'search' }}
        >
          <Search
            size={17}
            color={activeTab === 'search' ? colors.primary : colors.textMuted}
            strokeWidth={activeTab === 'search' ? 2.4 : 1.8}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'search' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'search' ? '700' : '500',
              },
            ]}
          >
            Search
          </Text>
        </TouchableOpacity>

        {/* 3. Notifications Tab */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'notifications' && [
              styles.activeTabItem,
              {
                backgroundColor: isDark
                  ? 'rgba(200, 142, 62, 0.18)'
                  : 'rgba(181, 129, 76, 0.12)',
              },
            ],
          ]}
          onPress={() => onSelectTab('notifications')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityLabel="Notifications"
          accessibilityState={{ selected: activeTab === 'notifications' }}
        >
          <View style={styles.iconWrap}>
            <Bell
              size={17}
              color={activeTab === 'notifications' ? colors.primary : colors.textMuted}
              strokeWidth={activeTab === 'notifications' ? 2.4 : 1.8}
            />
            {unreadCount > 0 && (
              <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'notifications' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'notifications' ? '700' : '500',
              },
            ]}
          >
            Notifications
          </Text>
        </TouchableOpacity>

        {/* 4. Profile Tab */}
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'profile' && [
              styles.activeTabItem,
              {
                backgroundColor: isDark
                  ? 'rgba(200, 142, 62, 0.18)'
                  : 'rgba(181, 129, 76, 0.12)',
              },
            ],
          ]}
          onPress={() => onSelectTab('profile')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityLabel="Profile"
          accessibilityState={{ selected: activeTab === 'profile' }}
        >
          <User
            size={17}
            color={activeTab === 'profile' ? colors.primary : colors.textMuted}
            strokeWidth={activeTab === 'profile' ? 2.4 : 1.8}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'profile' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'profile' ? '700' : '500',
              },
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 22,
    borderWidth: 1,
    minWidth: 280,
    maxWidth: 298,
    width: '75%',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3.5,
    paddingHorizontal: 2,
    borderRadius: 15,
    gap: 2,
  },
  activeTabItem: {},
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -1,
    right: -2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tabLabel: {
    fontSize: 9.5,
    letterSpacing: -0.2,
  },
});
