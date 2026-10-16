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
import { SlidableMedia } from '../ui/SlidableMedia';

interface PinterestCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
  onOpenMedia?: (bookmark: Bookmark, initialIndex?: number) => void;
}

export const PinterestCard: React.FC<PinterestCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
  onOpenMedia,
}) => {
  const { colors, isDark } = useTheme();
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
        <View style={[styles.imageContainer, { backgroundColor: isDark ? '#000000' : '#F1EFEA' }]}>
          <SafeVideo
            videoUrl={mediaDetails.videoUrl}
            posterUrl={mediaDetails.posterUrl}
            height={350}
            onPressMedia={() => onOpenMedia ? onOpenMedia(bookmark, 0) : undefined}
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
            <MoreVertical size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : mediaDetails.imageUrls.length > 1 ? (
        <View style={styles.imageContainer}>
          <SlidableMedia
            images={mediaDetails.imageUrls}
            height={350}
            onPressItem={(idx) => onOpenMedia ? onOpenMedia(bookmark, idx) : handleOpenPin()}
            onFallbackOpen={handleOpenPin}
            dotActiveColor="#E60023"
          />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu(bookmark);
            }}
            style={styles.floatingMenu}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (mediaDetails.imageUrls.length > 0 || mediaDetails.posterUrl) ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onOpenMedia ? onOpenMedia(bookmark, 0) : handleOpenPin()}
          style={[styles.imageContainer, { backgroundColor: isDark ? '#000000' : '#F1EFEA' }]}
        >
          <SafeImage
            url={mediaDetails.imageUrls[0] || mediaDetails.posterUrl}
            style={styles.pinImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu(bookmark);
            }}
            style={styles.floatingMenu}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
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
                <MessageCircle size={16} color={colors.textMuted} />
                <Text style={[styles.metricText, { color: colors.textMuted }]}>
                  {commentsCount}
                </Text>
              </View>
            )}

            {Boolean(savesCount) && (
              <View style={styles.savesRow}>
                <SaveIcon size={16} color="#E60023" />
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
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinImage: {
    width: '100%',
    height: '100%',
  },
  floatingMenu: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 18,
    padding: 8,
  },
  body: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logo: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  savesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  savesText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});

