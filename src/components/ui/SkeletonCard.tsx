import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const SkeletonCard: React.FC = () => {
  const { colors, isDark } = useTheme();

  const shimmerBg = isDark ? '#26221E' : '#EBE5DC';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={[styles.imagePlaceholder, { backgroundColor: shimmerBg }]} />
      <View style={styles.body}>
        <View style={[styles.line, { width: '80%', backgroundColor: shimmerBg }]} />
        <View style={[styles.line, { width: '60%', backgroundColor: shimmerBg }]} />
        <View style={[styles.line, { width: '95%', height: 10, marginTop: 10, backgroundColor: shimmerBg, opacity: 0.7 }]} />
        <View style={[styles.line, { width: '70%', height: 10, backgroundColor: shimmerBg, opacity: 0.7 }]} />

        <View style={styles.tagRow}>
          <View style={[styles.tagPill, { backgroundColor: shimmerBg }]} />
          <View style={[styles.tagPill, { width: 45, backgroundColor: shimmerBg }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imagePlaceholder: {
    height: 130,
    width: '100%',
    opacity: 0.6,
  },
  body: {
    padding: 14,
    gap: 8,
  },
  line: {
    height: 14,
    borderRadius: 7,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  tagPill: {
    height: 20,
    width: 60,
    borderRadius: 10,
    opacity: 0.6,
  },
});
