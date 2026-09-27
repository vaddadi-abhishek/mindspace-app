import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sun, Moon, Settings, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { UserPlanInfo, AuthUser } from '../../types/bookmark';

interface HeaderProps {
  user: AuthUser | null;
  planInfo: UserPlanInfo | null;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  planInfo,
  onOpenSettings,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.borderLight,
        },
      ]}
    >
      <View style={styles.leftRow}>
        <View
          style={[
            styles.logoBadge,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        >
          <Text style={styles.logoText}>M</Text>
        </View>
        <View style={styles.brandInfo}>
          <Text
            style={[styles.brandName, { color: colors.textHeading }]}
            numberOfLines={1}
          >
            mindspace
          </Text>
          {planInfo && (
            <View style={styles.creditsRow}>
              <Sparkles size={10} color={colors.primary} />
              <Text
                style={[styles.creditsText, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {planInfo.is_paid ? 'Pro Plan' : `${planInfo.credits_remaining ?? 0} credits`}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightRow}>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[
            styles.iconButton,
            {
              backgroundColor: isDark ? 'rgba(40, 34, 28, 0.7)' : 'rgba(240, 235, 227, 0.7)',
              borderColor: colors.border,
            },
          ]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityLabel="Toggle Theme"
        >
          {isDark ? (
            <Sun size={16} color={colors.secondary} />
          ) : (
            <Moon size={16} color={colors.textBody} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenSettings}
          style={[
            styles.iconButton,
            {
              backgroundColor: isDark ? 'rgba(40, 34, 28, 0.7)' : 'rgba(240, 235, 227, 0.7)',
              borderColor: colors.border,
            },
          ]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityLabel="Settings"
        >
          <Settings size={16} color={colors.textBody} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    color: '#FAF8F5',
    fontWeight: '800',
    fontSize: 16,
  },
  brandInfo: {
    flexShrink: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  creditsText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
