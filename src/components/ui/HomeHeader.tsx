import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Plus, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { MindspaceLogo } from './MindspaceLogo';
import type { UserPlanInfo } from '../../types/bookmark';

interface HomeHeaderProps {
  onOpenAddModal: () => void;
  planInfo?: UserPlanInfo | null;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ onOpenAddModal, planInfo }) => {
  const { colors, isDark } = useTheme();

  const isPro = planInfo?.is_paid || planInfo?.plan === 'pro';
  const creditsRemaining = planInfo?.credits_remaining ?? 0;
  const isZeroCredits = !isPro && planInfo !== null && creditsRemaining <= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Left: Mindspace Logo & Title with Credits Indicator */}
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <MindspaceLogo size={24} color="#000000" />
        </View>

        <View style={styles.brandTextCol}>
          <Text
            style={[
              styles.brandTitle,
              {
                color: colors.textHeading,
                fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
              },
            ]}
          >
            Mindspace
          </Text>

          <View style={styles.creditsRow}>
            <Sparkles
              size={10.5}
              color={
                isPro
                  ? colors.primary
                  : isZeroCredits
                  ? isDark
                    ? '#F59E0B'
                    : '#D97706'
                  : colors.primary
              }
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.creditsText,
                {
                  color: isPro
                    ? colors.primary
                    : isZeroCredits
                    ? isDark
                      ? '#F59E0B'
                      : '#B45309'
                    : colors.textMuted,
                },
              ]}
            >
              {isPro
                ? 'Unlimited AI credits'
                : planInfo !== null
                ? isZeroCredits
                  ? 'No credits available'
                  : `${creditsRemaining} credits available`
                : '... credits available'}
            </Text>
          </View>
        </View>
      </View>

      {/* Top Right: Only Save Link Button */}
      <TouchableOpacity
        style={styles.saveLinkBtn}
        onPress={onOpenAddModal}
        activeOpacity={0.85}
        accessibilityLabel="Save link"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={isDark ? ['#C88E3E', '#996533'] : ['#B5814C', '#996533']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.saveLinkGradient}
        >
          <Plus size={15} color="#FAF8F5" strokeWidth={2.6} />
          <Text style={styles.saveLinkText}>Save Link</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3DA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  brandTextCol: {
    justifyContent: 'center',
    gap: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 23,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creditsText: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  saveLinkBtn: {
    borderRadius: 20,
    shadowColor: '#B5814C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 4,
    overflow: 'hidden',
  },
  saveLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 12,
    paddingVertical: 7.5,
    borderRadius: 20,
  },
  saveLinkText: {
    color: '#FAF8F5',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

