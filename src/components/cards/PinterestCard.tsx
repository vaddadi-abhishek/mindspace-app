import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Bookmark as SaveIcon, MessageCircle, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, PinterestCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  extractMetrics,
  isVideoBookmark,
  extractMediaDetails,
} from '../../utils/helpers';
import { VideoPlayOverlay } from '../ui/VideoPlayOverlay';
import { SafeImage } from '../ui/SafeImage';
import { SafeVideo } from '../ui/SafeVideo';

interface PinterestCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
}

export const PinterestCard: React.FC<PinterestCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
}) => {
  const { colors } = useTheme();
  const cardData = parseCardData<PinterestCardData>(bookmark.card_data);

  const mediaDetails = useMemo(() => {
    return extractMediaDetails(bookmark, cardData);
  }, [bookmark, cardData]);
  const metrics = extractMetrics(cardData, bookmark);

  const handleOpenPin = () => {
    const clean = sanitizeUrl(bookmark.url);
    if (clean) Linking.openURL(clean).catch(() => {});
  };

  const savesCount = formatNumber(metrics.saves);
  const commentsCount = formatNumber(metrics.comments);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleOpenPin}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {mediaDetails.isVideo && (mediaDetails.videoUrl || mediaDetails.posterUrl) ? (
        <View style={styles.imageContainer}>
          <SafeVideo
            videoUrl={mediaDetails.videoUrl}
            posterUrl={mediaDetails.posterUrl}
            height={220}
            onFallbackOpen={handleOpenPin}
          />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu(bookmark);
            }}
            style={styles.floatingMenu}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (mediaDetails.imageUrls.length > 0 || mediaDetails.posterUrl) ? (
        <View style={styles.imageContainer}>
          <SafeImage
            url={mediaDetails.imageUrls[0] || mediaDetails.posterUrl}
            style={styles.pinImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu(bookmark);
            }}
            style={styles.floatingMenu}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.textHeading }]} numberOfLines={2}>
          {bookmark.title || bookmark.url}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.sourceRow}>
            {bookmark.logo ? (
              <SafeImage url={bookmark.logo} style={styles.logo} />
            ) : null}
            <Text style={[styles.sourceText, { color: colors.textMuted }]}>
              {cardData?.author?.name || bookmark.site_name || 'Pinterest'}
            </Text>
          </View>

          <View style={styles.metricsGroup}>
            {Boolean(commentsCount) && (
              <View style={styles.metricItem}>
                <MessageCircle size={12} color={colors.textMuted} />
                <Text style={[styles.metricText, { color: colors.textMuted }]}>
                  {commentsCount}
                </Text>
              </View>
            )}

            {Boolean(savesCount) && (
              <View style={styles.savesRow}>
                <SaveIcon size={12} color="#E60023" />
                <Text style={[styles.savesText, { color: colors.textHeading }]}>
                  {savesCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  imageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#EBE5DC',
    position: 'relative',
  },
  pinImage: {
    width: '100%',
    height: '100%',
  },
  floatingMenu: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 14,
    padding: 6,
  },
  body: {
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  logo: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  savesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savesText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});

