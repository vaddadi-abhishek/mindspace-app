import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { PLATFORM_TABS, type PlatformType } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

interface FilterPillsProps {
  activePlatform: PlatformType;
  onSelectPlatform: (platform: PlatformType) => void;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  activePlatform,
  onSelectPlatform,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        style={styles.scrollView}
      >
        {PLATFORM_TABS.map((tab) => {
          const isActive = activePlatform === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onSelectPlatform(tab.id)}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : isDark
                    ? 'rgba(38, 33, 28, 0.7)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isActive
                    ? colors.primary
                    : isDark
                    ? 'rgba(60, 52, 44, 0.7)'
                    : 'rgba(235, 229, 220, 0.9)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isActive
                      ? '#FFFFFF'
                      : isDark
                      ? colors.textBody
                      : colors.textHeading,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
  },
  scrollView: {
    flexGrow: 0,
    height: 48,
  },
  container: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
  },
  pill: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  pillText: {
    fontSize: 12.5,
    letterSpacing: -0.2,
  },
});
