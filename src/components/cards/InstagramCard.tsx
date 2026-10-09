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
  Send,
  Bookmark as BookmarkIcon,
  MoreVertical,
  LayoutGrid,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, InstagramCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
  extractMetrics,
  isVideoBookmark,
  extractMediaDetails,
} from '../../utils/helpers';
import { InstagramBrandLogo, VerifiedBadge } from './SocialCardIcons';
import { VideoPlayOverlay } from '../ui/VideoPlayOverlay';
import { SafeImage } from '../ui/SafeImage';
import { SafeVideo } from '../ui/SafeVideo';
import { SlidableMedia } from '../ui/SlidableMedia';

function isInstagramProfileUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const formatted = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(formatted);
    if (!parsed.hostname.includes('instagram.com')) return false;

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 1) {
      const systemPaths = new Set([
        'p', 'reel', 'reels', 'tv', 'stories', 'explore', 'direct',
        'accounts', 'developer', 'about', 'legal', 'help', 'privacy'
      ]);
      return !systemPaths.has(segments[0].toLowerCase());
    }
    return false;
  } catch {
    return false;
  }
}

interface InstagramCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
}

export const InstagramCard: React.FC<InstagramCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
}) => {
  const { colors, isDark } = useTheme();
  const cardData = parseCardData<InstagramCardData>(bookmark.card_data);

  const author = cardData?.author || {
    username: 'instagram',
    name: 'Instagram',
    avatar_url: bookmark.logo,
    verified: false,
  };

  const isProfile = Boolean(
    cardData?.is_profile ||
    isInstagramProfileUrl(bookmark.url) ||
    isInstagramProfileUrl((bookmark as any).canonical_url)
  );

  const metrics = extractMetrics(cardData, bookmark);
  const mediaDetails = useMemo(() => {
    return extractMediaDetails(bookmark, cardData);
  }, [bookmark, cardData]);

  const profileStats = useMemo(() => {
    if (!isProfile) return null;
    const raw = bookmark.description || '';
    const followers = raw.match(/([\d,.]+[KMBkmb]?)\s+Followers/i)?.[1];
    const following = raw.match(/([\d,.]+[KMBkmb]?)\s+Following/i)?.[1];
    const posts = raw.match(/([\d,.]+[KMBkmb]?)\s+Posts/i)?.[1];

    if (!followers && !following && !posts) return null;
    return { followers, following, posts };
  }, [isProfile, bookmark.description]);

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
    const gridMedia = mediaDetails.imageUrls.slice(0, 6);

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
        {/* 1. Header: Username, Verified Badge, IG Logo & Menu */}
        <View style={[styles.header, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight }]}>
          <View style={styles.profileHeaderLeft}>
            <Text style={[styles.profileUsername, { color: colors.textHeading }]} numberOfLines={1}>
              {author.username}
            </Text>
            {author.verified && <VerifiedBadge size={14} color="#3B82F6" />}
          </View>

          <View style={styles.headerRight}>
            <InstagramBrandLogo size={18} />
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

        {/* 2. Profile Info: Avatar with gradient ring, Name & Stats */}
        <View style={styles.profileBody}>
          <View style={styles.profileRow}>
            {/* Avatar with IG gradient ring */}
            <LinearGradient
              colors={['#f09433', '#dc2743', '#bc1888']}
              style={styles.profileRing}
            >
              <View style={[styles.profileAvatarContainer, { backgroundColor: colors.card }]}>
                {author.avatar_url ? (
                  <SafeImage url={author.avatar_url} style={styles.profileAvatarImg} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.accentBg }]}>
                    <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                      {(author.username || 'I')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Display Name & Stats */}
            <View style={styles.profileStatsWrap}>
              {author.name ? (
                <Text style={[styles.authorDisplayName, { color: colors.textHeading }]} numberOfLines={1}>
                  {author.name}
                </Text>
              ) : null}

              {profileStats ? (
                <View style={styles.statsColumns}>
                  {profileStats.posts && (
                    <View style={styles.statCol}>
                      <Text style={[styles.statColNum, { color: colors.textHeading }]}>{profileStats.posts}</Text>
                      <Text style={[styles.statColLabel, { color: colors.textMuted }]}>posts</Text>
                    </View>
                  )}
                  {profileStats.followers && (
                    <View style={styles.statCol}>
                      <Text style={[styles.statColNum, { color: colors.textHeading }]}>{profileStats.followers}</Text>
                      <Text style={[styles.statColLabel, { color: colors.textMuted }]}>followers</Text>
                    </View>
                  )}
                  {profileStats.following && (
                    <View style={styles.statCol}>
                      <Text style={[styles.statColNum, { color: colors.textHeading }]}>{profileStats.following}</Text>
                      <Text style={[styles.statColLabel, { color: colors.textMuted }]}>following</Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          </View>

          {/* Action Button: View Profile */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenPost}
            style={[styles.viewProfileBtn, { backgroundColor: isDark ? '#262626' : '#F1EFEA' }]}
          >
            <Text style={[styles.viewProfileBtnText, { color: colors.textHeading }]}>
              View Profile on Instagram
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Grid Tab Header (Posts) */}
        {gridMedia.length > 0 && (
          <>
            <View style={[styles.gridTabHeader, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight }]}>
              <LayoutGrid size={13} color={colors.textHeading} />
              <Text style={[styles.gridTabText, { color: colors.textHeading }]}>POSTS</Text>
            </View>

            {/* 4. 3x2 Grid */}
            <View style={styles.gridContainer}>
              {gridMedia.map((uri, idx) => {
                return (
                  <View key={idx} style={styles.gridItem}>
                    <SafeImage url={uri} style={styles.gridImage} resizeMode="cover" />
                  </View>
                );
              })}
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  }

  // STANDARD POST CARD VIEW
  const likesCount = formatNumber(metrics.likes);
  const commentsCount = formatNumber(metrics.comments);
  const repostsCount = formatNumber(metrics.reposts);

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
        <View style={styles.authorRow}>
          {/* Avatar with IG gradient ring */}
          <LinearGradient
            colors={['#f09433', '#dc2743', '#bc1888']}
            style={styles.postRing}
          >
            <View style={[styles.postAvatarInner, { backgroundColor: colors.card }]}>
              {author.avatar_url ? (
                <SafeImage url={author.avatar_url} style={styles.postAvatarImg} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.accentBg }]}>
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                    {(author.username || 'I')[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <View style={styles.authorInfo}>
            <View style={styles.usernameRow}>
              <Text style={[styles.username, { color: colors.textHeading }]} numberOfLines={1}>
                {author.username}
              </Text>
              {author.verified && <VerifiedBadge size={13} color="#3B82F6" />}
            </View>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatRelativeDate(cardData?.posted_at || bookmark.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <InstagramBrandLogo size={18} />
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

      {/* Main Media: Video, Carousel, or Single Image */}
      {mediaDetails.isVideo && (mediaDetails.videoUrl || mediaDetails.posterUrl) ? (
        <View style={styles.mediaContainer}>
          <SafeVideo
            videoUrl={mediaDetails.videoUrl}
            posterUrl={mediaDetails.posterUrl}
            height={280}
            onFallbackOpen={handleOpenPost}
          />
        </View>
      ) : mediaDetails.imageUrls.length > 0 ? (
        <View style={styles.carouselContainer}>
          <SlidableMedia
            images={mediaDetails.imageUrls}
            height={280}
            onFallbackOpen={handleOpenPost}
            dotActiveColor="#0095F6"
          />
        </View>
      ) : mediaDetails.posterUrl ? (
        <View style={styles.mediaContainer}>
          <SafeImage
            url={mediaDetails.posterUrl}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* Content & Metrics */}
      <View style={styles.body}>
        {/* Engagement Action Bar */}
        <View style={styles.engagementRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionBtn}>
              <Heart size={20} color={colors.textHeading} />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionWithCount}>
              <MessageCircle size={20} color={colors.textHeading} />
              {Boolean(commentsCount) && (
                <Text style={[styles.actionCountText, { color: colors.textHeading }]}>
                  {commentsCount}
                </Text>
              )}
            </TouchableOpacity>

            {Boolean(repostsCount) && (
              <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionWithCount}>
                <Repeat size={19} color={colors.textHeading} />
                <Text style={[styles.actionCountText, { color: colors.textHeading }]}>
                  {repostsCount}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.actionBtn}>
              <Send size={19} color={colors.textHeading} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionBtn}>
            <BookmarkIcon size={20} color={colors.textHeading} />
          </TouchableOpacity>
        </View>

        {/* Likes Count Row */}
        {Boolean(likesCount) && (
          <Text style={[styles.likesText, { color: colors.textHeading }]}>
            {likesCount} likes
          </Text>
        )}

        {/* Caption */}
        {Boolean(bookmark.description || bookmark.title) && (
          <Text style={[styles.caption, { color: colors.textHeading }]} numberOfLines={3}>
            <Text style={styles.captionUsername}>{author.username} </Text>
            {bookmark.description || bookmark.title}
          </Text>
        )}

        {/* View all comments link */}
        {Boolean(commentsCount) && (
          <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost}>
            <Text style={[styles.commentsLink, { color: colors.textMuted }]}>
              View all {commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  profileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  profileUsername: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  postRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  postAvatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
  },
  menuBtn: {
    padding: 2,
  },
  mediaContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  carouselContainer: {
    width: '100%',
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
  body: {
    padding: 12,
    gap: 6,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 2,
  },
  actionWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 2,
  },
  actionCountText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  likesText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  caption: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  captionUsername: {
    fontWeight: '700',
  },
  commentsLink: {
    fontSize: 12,
    marginTop: 2,
  },

  // Profile Card Specific
  profileBody: {
    padding: 12,
    gap: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },
  profileStatsWrap: {
    flex: 1,
    gap: 4,
  },
  authorDisplayName: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
  },
  statColNum: {
    fontSize: 13,
    fontWeight: '700',
  },
  statColLabel: {
    fontSize: 10.5,
    marginTop: 1,
  },
  viewProfileBtn: {
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gridTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  gridTabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridItem: {
    width: '32.8%',
    aspectRatio: 1,
    backgroundColor: '#334155',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});
