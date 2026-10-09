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
import { ThumbsUp, MessageSquare, Share2, MoreVertical, Film, Gamepad2, Tag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, FacebookCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
  extractMetrics,
  isVideoBookmark,
  extractMediaDetails,
} from '../../utils/helpers';
import { FacebookBrandLogo, FacebookVerifiedBadge } from './SocialCardIcons';
import { VideoPlayOverlay } from '../ui/VideoPlayOverlay';
import { SafeImage } from '../ui/SafeImage';
import { SafeVideo } from '../ui/SafeVideo';
import { SlidableMedia } from '../ui/SlidableMedia';

function isFacebookProfileUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const formatted = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(formatted);
    if (!parsed.hostname.includes('facebook.com')) return false;

    if (parsed.pathname === '/profile.php' && parsed.searchParams.has('id')) {
      return true;
    }

    if (parsed.pathname.startsWith('/people/')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && !['posts', 'videos', 'photos', 'reels'].includes(parts[parts.length - 1])) {
        return true;
      }
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return false;

    const systemPaths = new Set([
      'watch', 'reel', 'reels', 'stories', 'story.php', 'photo', 'photo.php',
      'photos', 'video', 'videos', 'share', 'permalink.php', 'groups', 'events',
      'gaming', 'marketplace', 'login', 'login.php', 'help', 'settings',
      'policies', 'recover', 'checkpoint', 'hashtag', 'search', 'dialog', 'plugins'
    ]);

    const firstSegment = segments[0].toLowerCase();
    if (systemPaths.has(firstSegment)) return false;

    if (segments.length === 1) return true;

    if (segments.length === 2) {
      const profileSubpages = new Set(['about', 'followers', 'following', 'photos', 'reels', 'videos', 'community']);
      return profileSubpages.has(segments[1].toLowerCase());
    }

    return false;
  } catch {
    return false;
  }
}

function formatProfileCount(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') {
    if (val >= 1_000_000) {
      const m = val / 1_000_000;
      return `${Math.floor(m)}M`;
    }
    if (val >= 1_000) {
      const k = val / 1_000;
      return `${Math.floor(k)}K`;
    }
    return val.toLocaleString();
  }
  return null;
}

interface FacebookCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
  onOpenMedia?: (bookmark: Bookmark, initialIndex?: number) => void;
}

export const FacebookCard: React.FC<FacebookCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
  onOpenMedia,
}) => {
  const { colors, isDark } = useTheme();
  const cardData = parseCardData<FacebookCardData>(bookmark.card_data);

  const author = cardData?.author || {
    name: bookmark.site_name || 'Facebook',
    avatar_url: bookmark.logo,
    verified: false,
  };

  const isProfile = Boolean(
    cardData?.is_profile ||
    isFacebookProfileUrl(bookmark.url) ||
    isFacebookProfileUrl((bookmark as any).canonical_url)
  );

  const metrics = extractMetrics(cardData, bookmark);
  const mediaDetails = useMemo(() => {
    return extractMediaDetails(bookmark, cardData);
  }, [bookmark, cardData]);
  const [avatarError, setAvatarError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

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

  // PROFILE CARD VIEW
  if (isProfile) {
    const bannerUrl = cardData?.banner_url || null;
    const avatarUrl = author.avatar_url;
    const name = author.name || bookmark.title || 'Facebook User';
    const verified = Boolean(author.verified);
    const followers = formatProfileCount(cardData?.followers);
    const following = formatProfileCount(cardData?.following);
    const category = cardData?.category || null;
    const displayBio = bookmark.description || '';

    const isMediaCategory = Boolean(
      category && /cinema|movie|film|video|tv|entertainment|music/i.test(category)
    );
    const isGamingCategory = Boolean(category && /game|gaming/i.test(category));

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handleOpenPost}
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {/* 1. Cover Banner with floating logo and menu */}
        <View style={styles.bannerContainer}>
          {bannerUrl && !bannerError ? (
            <SafeImage
              url={bannerUrl}
              style={styles.bannerImage}
              resizeMode="cover"
              onError={() => setBannerError(true)}
            />
          ) : (
            <LinearGradient
              colors={isDark ? ['#1A1816', '#2D2721', '#1A1816'] : ['#475569', '#334155', '#1E293B']}
              style={styles.bannerGradient}
            />
          )}

          {/* Facebook Brand Logo - Top Left */}
          <View style={styles.bannerLogoBadge}>
            <FacebookBrandLogo size={18} />
          </View>

          {/* Menu Button - Top Right */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu(bookmark);
            }}
            style={styles.bannerMenuBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 2. Overlapping Circular Avatar in Center */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {avatarUrl && !avatarError ? (
              <SafeImage
                url={avatarUrl}
                style={[styles.profileAvatar, { borderColor: colors.card }]}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={[styles.profileAvatarFallback, { backgroundColor: '#1877F2', borderColor: colors.card }]}>
                <Text style={styles.profileAvatarInitial}>
                  {(name || 'F')[0].toUpperCase()}
                </Text>
              </View>
            )}
            {/* Green active status indicator dot on bottom-right of avatar */}
            <View style={[styles.activeDot, { borderColor: colors.card }]} />
          </View>

          {/* 3. Centered Name & Verified Badge */}
          <View style={styles.nameRow}>
            <Text style={[styles.profileName, { color: colors.textHeading }]} numberOfLines={1}>
              {name}
            </Text>
            {verified && <FacebookVerifiedBadge size={18} />}
          </View>

          {/* 4. Followers & Following Row */}
          {Boolean(followers || following) && (
            <Text style={[styles.followStatsText, { color: colors.textMuted }]}>
              {followers ? `${followers} followers` : ''}
              {followers && following ? ' • ' : ''}
              {following ? `${following} following` : ''}
            </Text>
          )}

          {/* 5. Bio / Description */}
          {Boolean(displayBio) && (
            <Text style={[styles.profileBio, { color: colors.textBody }]} numberOfLines={4}>
              {displayBio}
            </Text>
          )}

          {/* 6. Category with Icon */}
          {Boolean(category) && (
            <View style={styles.categoryRow}>
              {isMediaCategory ? (
                <Film size={13} color={colors.textMuted} />
              ) : isGamingCategory ? (
                <Gamepad2 size={13} color={colors.textMuted} />
              ) : (
                <Tag size={13} color={colors.textMuted} />
              )}
              <Text style={[styles.categoryText, { color: colors.textMuted }]}>
                {category}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // STANDARD POST CARD VIEW
  const likesCount = formatNumber(metrics.likes);
  const commentsCount = formatNumber(metrics.comments);
  const sharesCount = formatNumber(metrics.shares);

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
      <View style={styles.header}>
        <View style={styles.authorRow}>
          {author.avatar_url && !avatarError ? (
            <SafeImage
              url={author.avatar_url}
              style={styles.avatar}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: '#1877F2' }]}>
              <Text style={styles.avatarInitial}>
                {(author.name || 'F')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View>
            <View style={styles.authorNameWrap}>
              <Text style={[styles.authorName, { color: colors.textHeading }]} numberOfLines={1}>
                {author.name}
              </Text>
              {author.verified && <FacebookVerifiedBadge size={14} />}
            </View>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatRelativeDate(cardData?.posted_at || bookmark.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <FacebookBrandLogo size={18} />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu(bookmark);
            }}
            style={styles.menuBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

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
            dotActiveColor="#1877F2"
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

      {/* Metrics & Actions Row */}
      <View style={[styles.metricsRow, { borderTopColor: colors.borderLight }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.metricItem}>
          <ThumbsUp size={15} color="#1877F2" />
          <Text style={[styles.metricText, { color: colors.textHeading }]}>
            {likesCount || 'Like'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.metricItem}>
          <MessageSquare size={15} color={colors.textMuted} />
          <Text style={[styles.metricText, { color: colors.textMuted }]}>
            {commentsCount ? `${commentsCount} comments` : 'Comment'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.metricItem}>
          <Share2 size={15} color={colors.textMuted} />
          <Text style={[styles.metricText, { color: colors.textMuted }]}>
            {sharesCount ? `${sharesCount} shares` : 'Share'}
          </Text>
        </TouchableOpacity>
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
    padding: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  authorNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBtn: {
    padding: 2,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  mediaWrap: {
    height: 350,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselWrap: {
    width: '100%',
    marginBottom: 10,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Profile Card Styles
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 6,
    paddingBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: '#334155',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    width: '100%',
    height: '100%',
  },
  bannerLogoBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerMenuBtn: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -46,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3.5,
  },
  profileAvatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  followStatsText: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  profileBio: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
  },
});
