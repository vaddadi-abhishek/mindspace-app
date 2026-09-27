import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface FloatingBadgeProps {
  visible: boolean;
  text: string;
}

export const FloatingBadge: React.FC<FloatingBadgeProps> = ({ visible, text }) => {
  const { isDark } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isDark ? '#1C1916' : '#FAF8F5',
            borderColor: isDark ? 'rgba(217, 159, 80, 0.4)' : 'rgba(181, 129, 76, 0.35)',
            shadowColor: '#000000',
          },
        ]}
      >
        <View style={styles.dot} />
        <Text style={[styles.badgeText, { color: isDark ? '#F59E0B' : '#D97706' }]}>
          {text}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
