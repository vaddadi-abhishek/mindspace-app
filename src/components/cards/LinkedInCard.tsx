import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
} from 'react-native';
import { ThumbsUp, MessageSquare, Repeat, Share2, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, LinkedInCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
  extractMetrics,
  isVideoBookmark,
  extractMediaDetails,
} from '../../utils/helpers';
import { VideoPlayOverlay } from '../ui/VideoPlayOverlay';
import { SafeImage } from '../ui/SafeImage';
import { SafeVideo } from '../ui/SafeVideo';
import { SlidableMedia } from '../ui/SlidableMedia';
import { LinkedInBrandLogo } from './SocialCardIcons';

interface LinkedInCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
  onOpenMedia?: (bookmark: Bookmark, initialIndex?: number) => void;
}

export const LinkedInCard: React.FC<LinkedInCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
  onOpenMedia,
}) => {
  const { colors, isDark } = useTheme();
  const cardData = parseCardData<LinkedInCardData>(bookmark.card_data);

  const author = cardData?.author || {
    name: bookmark.site_name || 'LinkedIn Member',
    avatar_url: bookmark.logo,
  };

  const metrics = extractMetrics(cardData, bookmark);
  const mediaDetails = useMemo(() => {
    return extractMediaDetails(bookmark, cardData);
  }, [bookmark, cardData]);
  const [avatarError, setAvatarError] = useState(false);

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

  const reactionsCount = formatNumber(metrics.reactions);
  const commentsCount = formatNumber(metrics.comments);
  const repostsCount = formatNumber(metrics.reposts);
  const hasMetrics = Boolean(reactionsCount || commentsCount || repostsCount);

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
      {/* Author Header */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          {author.avatar_url && !avatarError ? (
            <SafeImage
              url={author.avatar_url}
              style={styles.avatar}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: '#0A66C2' }]}>
              <Text style={styles.avatarInitial}>
                {(author.name || 'L')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.authorNames}>
            <Text style={[styles.authorName, { color: colors.textHeading }]} numberOfLines={1}>
              {author.name}
            </Text>
            {Boolean(cardData?.page_intent) && (
              <Text style={[styles.pageIntent, { color: colors.textMuted }]} numberOfLines={1}>
                {cardData?.page_intent}
              </Text>
            )}
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatRelativeDate(cardData?.posted_at || bookmark.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <LinkedInBrandLogo size={22} />
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

      {/* Post Text */}
      <Text style={[styles.postText, { color: colors.textHeading }]} numberOfLines={3}>
        {bookmark.description || bookmark.title}
      </Text>

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
            dotActiveColor="#0A66C2"
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

      {/* Metrics Summary Row (if metrics exist) */}
      {hasMetrics && (
        <View style={styles.metricsSummaryRow}>
          <View style={styles.reactionsBadgeRow}>
            {Boolean(reactionsCount) && (
              <>
                <View style={styles.reactionCircle}>
                  <ThumbsUp size={10} color="#FFFFFF" />
                </View>
                <Text style={[styles.reactionCountText, { color: colors.textMuted }]}>
                  {reactionsCount}
                </Text>
              </>
            )}
          </View>

          <View style={styles.commentsRepostsRow}>
            {Boolean(commentsCount) && (
              <Text style={[styles.metricDetailText, { color: colors.textMuted }]}>
                {commentsCount} comments
              </Text>
            )}
            {Boolean(commentsCount && repostsCount) && (
              <Text style={[styles.metricDetailText, { color: colors.textMuted }]}>·</Text>
            )}
            {Boolean(repostsCount) && (
              <Text style={[styles.metricDetailText, { color: colors.textMuted }]}>
                {repostsCount} reposts
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons Row */}
      <View style={[styles.actionsRow, { borderTopColor: colors.borderLight }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionBtn}>
          <ThumbsUp size={19} color={colors.textMuted} />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionBtn}>
          <MessageSquare size={19} color={colors.textMuted} />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionBtn}>
          <Repeat size={19} color={colors.textMuted} />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>Repost</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.actionBtn}>
          <Share2 size={19} color={colors.textMuted} />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>Send</Text>
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
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  authorNames: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  pageIntent: {
    fontSize: 13.5,
    marginTop: 1,
  },
  timeText: {
    fontSize: 13,
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
  postText: {
    fontSize: 15.5,
    lineHeight: 23,
    marginBottom: 12,
    letterSpacing: -0.15,
  },
  mediaWrap: {
    height: 350,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
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
  metricsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 4,
  },
  reactionsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0A66C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionCountText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  commentsRepostsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricDetailText: {
    fontSize: 13.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});

