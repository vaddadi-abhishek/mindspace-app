import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
} from 'react-native';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, RedditCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
  extractMetrics,
  isVideoBookmark,
  extractMediaDetails,
} from '../../utils/helpers';
import { RedditBrandLogo } from './SocialCardIcons';
import { VideoPlayOverlay } from '../ui/VideoPlayOverlay';
import { SafeImage } from '../ui/SafeImage';
import { SafeVideo } from '../ui/SafeVideo';
import { SlidableMedia } from '../ui/SlidableMedia';

interface RedditCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
  onOpenMedia?: (bookmark: Bookmark, initialIndex?: number) => void;
}

export const RedditCard: React.FC<RedditCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
  onOpenMedia,
}) => {
  const { colors, isDark } = useTheme();
  const cardData = parseCardData<RedditCardData>(bookmark.card_data);

  const subreddit = cardData?.subreddit || {
    name: bookmark.site_name || 'reddit',
    icon_url: bookmark.logo,
  };

  const metrics = extractMetrics(cardData, bookmark);
  const mediaDetails = useMemo(() => {
    return extractMediaDetails(bookmark, cardData);
  }, [bookmark, cardData]);

  const hasMedia = Boolean(mediaDetails.isVideo || mediaDetails.imageUrls.length > 0 || mediaDetails.posterUrl);

  const handleOpenPost = () => {
    const clean = sanitizeUrl(bookmark.url);
    if (clean) Linking.openURL(clean).catch(() => {});
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: bookmark.title ? `${bookmark.title}\n${bookmark.url}` : bookmark.url,
        url: bookmark.url,
      });
    } catch {}
  };

  const upvotesCount = formatNumber(metrics.upvotes);
  const commentsCount = formatNumber(metrics.comments);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleOpenPost}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.subRow}>
          {subreddit.icon_url ? (
            <SafeImage url={subreddit.icon_url} style={styles.icon} />
          ) : (
            <View style={styles.iconFallback}>
              <Text style={styles.iconInitial}>r/</Text>
            </View>
          )}
          <View style={styles.subMeta}>
            <Text style={[styles.subName, { color: colors.textHeading }]}>
              {subreddit.name.startsWith('r/') ? subreddit.name : `r/${subreddit.name}`}
            </Text>
            <Text style={[styles.postMeta, { color: colors.textMuted }]}>
              {cardData?.author ? `u/${cardData.author} · ` : ''}
              {formatRelativeDate(cardData?.posted_at || bookmark.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <RedditBrandLogo size={22} />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu(bookmark);
            }}
            style={styles.menuBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Title */}
      <Text style={[styles.title, { color: colors.textHeading }]} numberOfLines={2}>
        {bookmark.title || bookmark.url}
      </Text>

      {/* Description text (only when NO media) */}
      {!hasMedia && Boolean(bookmark.description && bookmark.description.trim() !== bookmark.title?.trim()) && (
        <Text style={[styles.bodyText, { color: colors.textBody }]} numberOfLines={3}>
          {bookmark.description}
        </Text>
      )}

      {/* Media: Video, Carousel, or Single Image */}
      {mediaDetails.isVideo && (mediaDetails.videoUrl || mediaDetails.posterUrl) ? (
        <View style={[styles.mediaWrap, { backgroundColor: isDark ? '#000000' : '#F1EFEA' }]}>
          <SafeVideo
            videoUrl={mediaDetails.videoUrl}
            posterUrl={mediaDetails.posterUrl}
            height={350}
            onPressMedia={() => onOpenMedia ? onOpenMedia(bookmark, 0) : undefined}
            onFallbackOpen={handleOpenPost}
          />
        </View>
      ) : mediaDetails.imageUrls.length > 0 ? (
        <View style={styles.carouselWrap}>
          <SlidableMedia
            images={mediaDetails.imageUrls}
            height={350}
            onPressItem={(idx) => onOpenMedia ? onOpenMedia(bookmark, idx) : handleOpenPost()}
            onFallbackOpen={handleOpenPost}
            dotActiveColor="#FF4500"
          />
        </View>
      ) : mediaDetails.posterUrl ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onOpenMedia ? onOpenMedia(bookmark, 0) : handleOpenPost()}
          style={[styles.mediaWrap, { backgroundColor: isDark ? '#000000' : '#F1EFEA' }]}
        >
          <SafeImage
            url={mediaDetails.posterUrl}
            style={styles.mediaImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ) : null}

      {/* Metrics Row - Reddit Pill Container & Share */}
      <View style={[styles.metricsRow, { borderTopColor: colors.borderLight }]}>
        <View style={styles.leftPills}>
          {/* Vote Container */}
          <View style={[styles.pillContainer, { backgroundColor: isDark ? '#272729' : '#F1EFEA', borderColor: colors.borderLight }]}>
            <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.voteArrowBtn}>
              <ArrowBigUp size={22} color="#FF4500" />
            </TouchableOpacity>
            <Text style={[styles.voteCountText, { color: colors.textHeading }]}>
              {upvotesCount || 'Vote'}
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.voteArrowBtn}>
              <ArrowBigDown size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Comment Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenPost}
            style={[styles.singlePill, { backgroundColor: isDark ? '#272729' : '#F1EFEA', borderColor: colors.borderLight }]}
          >
            <MessageSquare size={18} color={colors.textMuted} />
            <Text style={[styles.pillText, { color: colors.textHeading }]}>
              {commentsCount || 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Share Pill */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleShare}
          style={[styles.singlePill, { backgroundColor: isDark ? '#272729' : '#F1EFEA', borderColor: colors.borderLight }]}
        >
          <Share2 size={18} color={colors.textMuted} />
          <Text style={[styles.pillText, { color: colors.textHeading }]}>Share</Text>
        </TouchableOpacity>
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
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF4500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInitial: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  subMeta: {
    flex: 1,
    gap: 2,
  },
  subName: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  postMeta: {
    fontSize: 13.5,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    padding: 4,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 8,
    letterSpacing: -0.15,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaWrap: {
    height: 350,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselWrap: {
    width: '100%',
    marginBottom: 12,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  carouselBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  carouselBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  leftPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  voteArrowBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteCountText: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  singlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});

