import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, AlertCircle, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'error';
}

interface ToastHudProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastHud: React.FC<ToastHudProps> = ({ toasts, onDismiss }) => {
  const { colors, isDark } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => {
        const isError =
          toast.type === 'error' || /failed|error|unreachable/i.test(toast.message);

        return (
          <View
            key={toast.id}
            style={[
              styles.toastPill,
              {
                backgroundColor: isDark ? '#181512' : '#FAF8F5',
                borderColor: isDark ? 'rgba(200, 142, 62, 0.4)' : 'rgba(181, 129, 76, 0.35)',
                shadowColor: isDark ? '#000000' : '#B5814C',
              },
            ]}
          >
            {isError ? (
              <AlertCircle size={16} color={isDark ? '#F87171' : '#DC2626'} />
            ) : (
              <CheckCircle2 size={16} color={colors.primary} />
            )}
            <Text
              style={[
                styles.toastText,
                { color: colors.textHeading },
              ]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
            <TouchableOpacity
              onPress={() => onDismiss(toast.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
            >
              <X size={13} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 85,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    maxWidth: '100%',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    gap: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  closeBtn: {
    padding: 2,
    marginLeft: 4,
  },
});
