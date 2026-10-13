import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { PLATFORM_TABS, type PlatformType } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import {
  XBrandLogo,
  InstagramBrandLogo,
  FacebookBrandLogo,
  RedditBrandLogo,
  LinkedInBrandLogo,
  YouTubeBrandLogo,
  PinterestBrandLogo,
} from '../cards/SocialCardIcons';

interface FilterPillsProps {
  activePlatform: PlatformType;
  onSelectPlatform: (platform: PlatformType) => void;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  activePlatform,
  onSelectPlatform,
}) => {
  const { colors, isDark } = useTheme();

  const renderTabLogo = (id: PlatformType, isActive: boolean) => {
    const iconSize = 13;
    switch (id) {
      case 'x':
        return (
          <XBrandLogo
            size={iconSize}
            color={isActive ? '#FFFFFF' : isDark ? '#FAF8F5' : '#211D1A'}
          />
        );
      case 'instagram':
        return <InstagramBrandLogo size={iconSize} />;
      case 'facebook':
        return <FacebookBrandLogo size={iconSize} />;
      case 'reddit':
        return <RedditBrandLogo size={iconSize} />;
      case 'linkedin':
        return (
          <LinkedInBrandLogo
            size={iconSize}
            color={isActive ? '#FFFFFF' : '#0A66C2'}
          />
        );
      case 'youtube':
        return <YouTubeBrandLogo size={iconSize} />;
      case 'pinterest':
        return <PinterestBrandLogo size={iconSize} />;
      default:
        return null;
    }
  };

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
          const logo = renderTabLogo(tab.id, isActive);

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
              {logo}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  pillText: {
    fontSize: 12.5,
    letterSpacing: -0.2,
  },
});
