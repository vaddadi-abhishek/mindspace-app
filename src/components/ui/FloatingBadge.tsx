import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface FloatingBadgeProps {
  visible: boolean;
  text: string;
  icon?: 'alert' | 'sparkles';
}

export const FloatingBadge: React.FC<FloatingBadgeProps> = ({
  visible,
  text,
  icon = 'alert',
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 8,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, translateYAnim]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom + 84, 96),
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.badge,
          {
            opacity: opacityAnim,
            transform: [{ translateY: translateYAnim }],
            backgroundColor: isDark ? '#1C1916' : '#FFFFFF',
            borderColor: isDark ? 'rgba(217, 159, 80, 0.45)' : 'rgba(181, 129, 76, 0.35)',
            shadowColor: isDark ? '#000000' : '#8A5D2C',
          },
        ]}
      >
        {icon === 'alert' ? (
          <AlertCircle size={15} color={isDark ? '#F59E0B' : '#D97706'} strokeWidth={2.4} />
        ) : (
          <Sparkles size={15} color={isDark ? '#F59E0B' : '#D97706'} strokeWidth={2.4} />
        )}
        <Text style={[styles.badgeText, { color: isDark ? '#F59E0B' : '#B45309' }]}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 9999,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  badgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

