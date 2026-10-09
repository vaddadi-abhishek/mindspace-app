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
import {
  Heart,
  MessageCircle,
  Repeat,
  Bookmark as BookmarkIcon,
  Share2,
  MoreVertical,
  Calendar,
  Check,
  FileText,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, XCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
  formatDetailDate,
  extractMetrics,
  isVideoBookmark,
  extractMediaDetails,
} from '../../utils/helpers';
import { XBrandLogo, VerifiedBadge } from './SocialCardIcons';
import { VideoPlayOverlay } from '../ui/VideoPlayOverlay';
import { SafeImage } from '../ui/SafeImage';
import { SafeVideo } from '../ui/SafeVideo';

function isTwitterProfileUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const formatted = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(formatted);
    if (!parsed.hostname.includes('twitter.com') && !parsed.hostname.includes('x.com')) {
      return false;
    }
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 1) {
      const systemPaths = new Set([
        'home', 'explore', 'notifications', 'messages', 'settings', 'search',
        'tos', 'privacy', 'login', 'signup', 'i', 'intent'
      ]);
      return !systemPaths.has(segments[0].toLowerCase());
    }
    return false;
  } catch {
    return false;
  }
}

interface TwitterCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
}

export const TwitterCard: React.FC<TwitterCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
}) => {
  const { colors, isDark } = useTheme();
  const cardData = parseCardData<XCardData>(bookmark.card_data);

  const author = cardData?.author || {
    name: bookmark.site_name || 'X / Twitter',
    handle: 'twitter',
    avatar_url: bookmark.logo,
    verified: false,
  };

  const isProfile = Boolean(
    cardData?.is_profile ||
    isTwitterProfileUrl(bookmark.url) ||
    isTwitterProfileUrl((bookmark as any).canonical_url)
  );

  const metrics = extractMetrics(cardData, bookmark);
  const postedAt = cardData?.posted_at || bookmark.created_at;
  const [avatarError, setAvatarError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const mediaDetails = useMemo(() => {
    return extractMediaDetails(bookmark, cardData);
  }, [bookmark, cardData]);

  const handleOpenTweet = () => {
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
    const name = author.name || bookmark.title || 'X User';
    const handle = author.handle.startsWith('@') ? author.handle : `@${author.handle}`;
    const verified = Boolean(author.verified);
    const displayBio = cardData?.bio || bookmark.description || '';
    const joinedDate = cardData?.joined_date || null;
    const following = formatNumber(metrics.following ?? cardData?.metrics?.following) || null;
    const followers = formatNumber(metrics.followers ?? cardData?.metrics?.followers) || null;

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handleOpenTweet}
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {/* 1. Header Banner with 𝕏 logo and menu */}
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
              colors={isDark ? ['#1A1A1A', '#2A2A2A', '#1A1A1A'] : ['#334155', '#1E293B', '#0F172A']}
              style={styles.bannerGradient}
            />
          )}

          {/* Top-left: X Logo */}
          <View style={styles.bannerLogoBadge}>
            <XBrandLogo size={16} color="#FFFFFF" />
          </View>

          {/* Top-right: Menu */}
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

        {/* 2. Avatar & Action Row */}
        <View style={styles.avatarActionRow}>
          <View style={styles.avatarOuter}>
            {avatarUrl && !avatarError ? (
              <SafeImage
                url={avatarUrl}
                style={[styles.profileAvatar, { borderColor: colors.card }]}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={[styles.profileAvatarFallback, { backgroundColor: isDark ? '#26221E' : '#EBE5DC', borderColor: colors.card }]}>
                <Text style={[styles.profileAvatarInitial, { color: colors.textHeading }]}>
                  {(name || 'X')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Following checkmark button */}
          <View style={[styles.followingCheckBtn, { borderColor: colors.border }]}>
            <Check size={14} color={colors.textHeading} strokeWidth={2.5} />
          </View>
        </View>

        {/* 3. Name, Badges & Handle */}
        <View style={styles.profileInfoSection}>
          <View style={styles.nameBadgeRow}>
            <Text style={[styles.profileName, { color: colors.textHeading }]} numberOfLines={1}>
              {name}
            </Text>
            {verified && <VerifiedBadge size={16} />}
            <View style={styles.xAffiliationBadge}>
              <Text style={styles.xAffiliationText}>𝕏</Text>
            </View>
          </View>
          <Text style={[styles.profileHandle, { color: colors.textMuted }]}>{handle}</Text>

          {/* 4. Bio */}
          {Boolean(displayBio) && (
            <Text style={[styles.profileBio, { color: colors.textHeading }]} numberOfLines={4}>
              {displayBio}
            </Text>
          )}

          {/* 5. Joined Date */}
          {Boolean(joinedDate) && (
            <View style={styles.joinedDateRow}>
              <Calendar size={13} color={colors.textMuted} />
              <Text style={[styles.joinedDateText, { color: colors.textMuted }]}>
                {joinedDate}
              </Text>
            </View>
          )}

          {/* 6. Following & Followers row */}
          {(following || followers) && (
            <View style={styles.statsRow}>
              {following && (
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.textHeading }]}>{following}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Following</Text>
                </View>
              )}
              {followers && (
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.textHeading }]}>{followers}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Followers</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // STANDARD POST CARD VIEW
  const viewsCount = formatNumber(metrics.views);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleOpenTweet}
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
            <View style={[styles.avatarFallback, { backgroundColor: isDark ? '#26221E' : '#EBE5DC' }]}>
              <Text style={[styles.avatarInitial, { color: colors.textHeading }]}>
                {(author.name || 'X')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.authorNames}>
            <View style={styles.nameVerifiedRow}>
              <Text
                style={[styles.authorName, { color: colors.textHeading }]}
                numberOfLines={1}
              >
                {author.name}
              </Text>
              {author.verified && <VerifiedBadge size={14} />}
            </View>
            <Text style={[styles.handleText, { color: colors.textMuted }]} numberOfLines={1}>
              {(author.handle.startsWith('@') ? author.handle : `@${author.handle}`)} · {formatRelativeDate(postedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <XBrandLogo size={16} color={colors.textHeading} />
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

      {/* X Article Badge if article */}
      {bookmark.is_article && (
        <View style={styles.articleBadgeWrap}>
          <View style={[styles.articleBadge, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
            <FileText size={11} color={colors.primary} />
            <Text style={[styles.articleBadgeText, { color: colors.primary }]}>X ARTICLE</Text>
          </View>
        </View>
      )}

      {/* Tweet Text */}
      <Text style={[styles.tweetText, { color: colors.textHeading }]}>
        {bookmark.description || bookmark.title}
      </Text>

      {/* Media: Video or Images */}
      {mediaDetails.isVideo && (mediaDetails.videoUrl || mediaDetails.posterUrl) ? (
        <View style={styles.mediaWrap}>
          <SafeVideo
            videoUrl={mediaDetails.videoUrl}
            posterUrl={mediaDetails.posterUrl}
            height={210}
            onFallbackOpen={handleOpenTweet}
          />
        </View>
      ) : mediaDetails.imageUrls.length > 0 ? (
        <View style={styles.mediaWrap}>
          <SafeImage
            url={mediaDetails.imageUrls[0]}
            style={styles.mediaImage}
            resizeMode="cover"
          />
          {mediaDetails.imageUrls.length > 1 && (
            <View style={styles.carouselBadge}>
              <Text style={styles.carouselBadgeText}>1/{mediaDetails.imageUrls.length}</Text>
            </View>
          )}
        </View>
      ) : mediaDetails.posterUrl ? (
        <View style={styles.mediaWrap}>
          <SafeImage
            url={mediaDetails.posterUrl}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* Date & Views Row */}
      {Boolean(formatDetailDate(postedAt) || viewsCount) && (
        <View style={styles.dateViewsRow}>
          {formatDetailDate(postedAt) && (
            <Text style={[styles.dateViewsText, { color: colors.textMuted }]}>
              {formatDetailDate(postedAt)}
            </Text>
          )}
          {Boolean(formatDetailDate(postedAt) && viewsCount) && (
            <Text style={[styles.dotSep, { color: colors.textMuted }]}>·</Text>
          )}
          {Boolean(viewsCount) && (
            <Text style={[styles.viewsHighlight, { color: colors.textHeading }]}>
              {viewsCount} <Text style={{ fontWeight: '400', color: colors.textMuted }}>Views</Text>
            </Text>
          )}
        </View>
      )}

      {/* Metrics Action Row */}
      <View style={[styles.metricsRow, { borderTopColor: colors.borderLight }]}>
        <View style={styles.metricItem}>
          <MessageCircle size={14} color={colors.textMuted} />
          <Text style={[styles.metricText, { color: colors.textMuted }]}>
            {formatNumber(metrics.replies) || 0}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Repeat size={14} color={colors.textMuted} />
          <Text style={[styles.metricText, { color: colors.textMuted }]}>
            {formatNumber(metrics.reposts) || 0}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Heart size={14} color={colors.textMuted} />
          <Text style={[styles.metricText, { color: colors.textMuted }]}>
            {formatNumber(metrics.likes) || 0}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <BookmarkIcon size={14} color={colors.textMuted} />
          <Text style={[styles.metricText, { color: colors.textMuted }]}>
            {formatNumber(metrics.bookmarks) || 0}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleShare}
          style={styles.metricItem}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Share2 size={14} color={colors.textMuted} />
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
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  authorNames: {
    flex: 1,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  handleText: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBtn: {
    padding: 2,
  },
  articleBadgeWrap: {
    marginBottom: 8,
  },
  articleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  articleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tweetText: {
    fontSize: 14.5,
    lineHeight: 21,
    marginBottom: 10,
  },
  mediaWrap: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#EBE5DC',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  carouselBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  carouselBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dateViewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  dateViewsText: {
    fontSize: 11.5,
  },
  dotSep: {
    fontSize: 11.5,
  },
  viewsHighlight: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: '#1E293B',
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
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -42,
    paddingHorizontal: 14,
  },
  avatarOuter: {
    position: 'relative',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3.5,
  },
  profileAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarInitial: {
    fontSize: 28,
    fontWeight: '800',
  },
  followingCheckBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  profileInfoSection: {
    paddingHorizontal: 14,
    marginTop: 8,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
  },
  xAffiliationBadge: {
    backgroundColor: '#16181C',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 2,
  },
  xAffiliationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  profileHandle: {
    fontSize: 13,
    marginTop: 1,
  },
  profileBio: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 8,
  },
  joinedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  joinedDateText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
  },
});
