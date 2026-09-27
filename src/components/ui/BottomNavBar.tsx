import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Bell, Plus, Settings, User } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export type BottomNavTab = 'home' | 'notifications' | 'settings' | 'profile';

interface BottomNavBarProps {
  activeTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
  onOpenAddModal: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#14110E' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(60, 52, 44, 0.6)' : 'rgba(235, 229, 220, 0.9)',
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {/* 1. Home Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Home"
        accessibilityState={{ selected: activeTab === 'home' }}
      >
        <Home
          size={21}
          color={activeTab === 'home' ? colors.primary : colors.textMuted}
          strokeWidth={activeTab === 'home' ? 2.4 : 1.8}
        />
        <Text
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
        {activeTab === 'home' && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>

      {/* 2. Notifications Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('notifications')}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Notifications"
        accessibilityState={{ selected: activeTab === 'notifications' }}
      >
        <Bell
          size={21}
          color={activeTab === 'notifications' ? colors.primary : colors.textMuted}
          strokeWidth={activeTab === 'notifications' ? 2.4 : 1.8}
        />
        <Text
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
        {activeTab === 'notifications' && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>

      {/* 3. Center Elevated Floating Plus Button */}
      <View style={styles.centerButtonSlot}>
        <TouchableOpacity
          style={[
            styles.centerButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
          onPress={onOpenAddModal}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Save Link"
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>

      {/* 4. Settings Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('settings')}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Settings"
        accessibilityState={{ selected: activeTab === 'settings' }}
      >
        <Settings
          size={21}
          color={activeTab === 'settings' ? colors.primary : colors.textMuted}
          strokeWidth={activeTab === 'settings' ? 2.4 : 1.8}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: activeTab === 'settings' ? colors.primary : colors.textMuted,
              fontWeight: activeTab === 'settings' ? '700' : '500',
            },
          ]}
        >
          Settings
        </Text>
        {activeTab === 'settings' && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>

      {/* 5. Profile Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('profile')}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Profile"
        accessibilityState={{ selected: activeTab === 'profile' }}
      >
        <User
          size={21}
          color={activeTab === 'profile' ? colors.primary : colors.textMuted}
          strokeWidth={activeTab === 'profile' ? 2.4 : 1.8}
        />
        <Text
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
        {activeTab === 'profile' && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 8,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: -0.2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  centerButtonSlot: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 7,
  },
});
