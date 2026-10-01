import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

interface ToastHudProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const AnimatedToastPill: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(14)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
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
  }, [fadeAnim, translateYAnim, scaleAnim]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
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
    ]).start(() => onDismiss(toast.id));
  };

  const isError = toast.type === 'error' || /failed|error|unreachable/i.test(toast.message);
  const isWarning =
    toast.type === 'warning' || /no credits|already exists/i.test(toast.message);
  const isInfo = toast.type === 'info';

  const renderIcon = () => {
    if (isError) {
      return <AlertCircle size={16} color={isDark ? '#F87171' : '#DC2626'} />;
    }
    if (isWarning) {
      return <AlertCircle size={16} color={isDark ? '#F59E0B' : '#D97706'} />;
    }
    if (isInfo) {
      return <Sparkles size={16} color={colors.primary} />;
    }
    return <CheckCircle2 size={16} color={colors.primary} />;
  };

  return (
    <Animated.View
      style={[
        styles.toastPill,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          backgroundColor: isDark ? '#1C1917' : '#FAF8F5',
          borderColor: isDark ? 'rgba(200, 142, 62, 0.4)' : 'rgba(181, 129, 76, 0.35)',
          shadowColor: isDark ? '#000000' : '#B5814C',
        },
      ]}
    >
      {renderIcon()}
      <Text
        style={[
          styles.toastText,
          { color: isDark ? '#FAF8F5' : '#1A1612' },
        ]}
        numberOfLines={2}
      >
        {toast.message}
      </Text>
      <TouchableOpacity
        onPress={handleDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.closeBtn}
      >
        <X size={13} color={isDark ? 'rgba(250, 248, 245, 0.5)' : 'rgba(26, 22, 18, 0.45)'} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ToastHud: React.FC<ToastHudProps> = ({ toasts, onDismiss }) => {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        { bottom: Math.max(insets.bottom + 84, 96) },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <AnimatedToastPill key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    flexDirection: 'column-reverse',
    gap: 8,
    zIndex: 9999,
  },
  toastPill: {
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
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    letterSpacing: 0.1,
  },
  closeBtn: {
    padding: 2,
    marginLeft: 4,
  },
});
