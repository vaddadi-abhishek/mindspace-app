import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface FloatingBadgeProps {
  visible: boolean;
  text: string;
  icon?: 'alert' | 'sparkles' | 'check';
}

export const FloatingBadge: React.FC<FloatingBadgeProps> = ({
  visible,
  text,
  icon = 'alert',
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(14)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

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
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 10,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.94,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, translateYAnim, scaleAnim]);

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
            transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
            backgroundColor: isDark ? '#1C1917' : '#FAF8F5',
            borderColor: isDark ? 'rgba(200, 142, 62, 0.4)' : 'rgba(181, 129, 76, 0.35)',
            shadowColor: isDark ? '#000000' : '#B5814C',
          },
        ]}
      >
        {icon === 'alert' ? (
          <AlertCircle size={16} color={isDark ? '#F59E0B' : '#D97706'} />
        ) : icon === 'check' ? (
          <CheckCircle2 size={16} color={colors.primary} />
        ) : (
          <Sparkles size={16} color={colors.primary} />
        )}
        <Text style={[styles.badgeText, { color: isDark ? '#FAF8F5' : '#1A1612' }]}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 99999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1.2,
    maxWidth: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    letterSpacing: 0.1,
  },
});
