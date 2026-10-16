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
  Lock,
  ExternalLink,
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
  onOpenMedia?: (bookmark: Bookmark, initialIndex?: number) => void;
}

export const InstagramCard: React.FC<InstagramCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
  onOpenMedia,
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

  const isRestricted = useMemo(() => {
    if (cardData?.is_restricted || cardData?.restriction_reason) return true;

    const authorUser = (author.username || '').toLowerCase().trim();
    const authorName = (author.name || '').toLowerCase().trim();
    const isUnknown = !authorUser || authorUser === 'unknown' || authorName === 'instagram user' || authorName === 'instagram';

    const desc = (bookmark.description || '').toLowerCase();
    const title = (bookmark.title || '').toLowerCase();
    const content = ((bookmark as any).content || '').toLowerCase();
    const textPool = `${desc} ${title} ${content}`;

    const hasRestrictedText =
      textPool.includes('the account is restricted') ||
      textPool.includes('account is restricted') ||
      textPool.includes('restricted account') ||
      textPool.includes('restricted profile') ||
      textPool.includes('restricted') ||
      textPool.includes('age-restricted') ||
      textPool.includes('age restricted') ||
      textPool.includes('age-gated') ||
      textPool.includes('age gated') ||
      textPool.includes('people under') ||
      textPool.includes('limits on who can see') ||
      textPool.includes('must be 18') ||
      textPool.includes('18 or older') ||
      textPool.includes('18+') ||
      textPool.includes('adult content') ||
      textPool.includes('sensitive content') ||
      textPool.includes('sign in to confirm your age') ||
      textPool.includes('confirm your age') ||
      textPool.includes('content is unavailable') ||
      textPool.includes('content unavailable') ||
      textPool.includes('this content is unavailable') ||
      textPool.includes('post is unavailable') ||
      textPool.includes('reel is unavailable') ||
      textPool.includes('video is unavailable') ||
      textPool.includes('watch on instagram') ||
      textPool.includes('watch this reel on instagram') ||
      textPool.includes('login • instagram') ||
      textPool.includes('log in to instagram');

    if (hasRestrictedText) return true;

    // Check for actual playable media (do not rely on mediaDetails.isVideo since isVideoBookmark returns true for any /reel/ URL)
    const hasPlayableStream = Boolean(mediaDetails.videoUrl);
    const hasImages = mediaDetails.imageUrls.length > 0;
    const hasValidPoster = Boolean(
      mediaDetails.posterUrl &&
      !mediaDetails.posterUrl.includes('favicon') &&
      !mediaDetails.posterUrl.includes('logo') &&
      !mediaDetails.posterUrl.endsWith('.ico')
    );
    const hasRealMedia = hasPlayableStream || hasImages || hasValidPoster;

    const isReelUrl = (bookmark.url || '').toLowerCase().includes('/reel');
    const isGenericTitle =
      !title ||
      title === 'instagram post' ||
      title === 'instagram reel' ||
      title === 'instagram' ||
      title === 'restricted instagram content' ||
      title.includes('watch this reel on instagram');

    // If there is no real playable media extracted for an Instagram reel/post and author is unknown or title is generic
    if (!hasRealMedia && (isUnknown || isReelUrl) && (!desc.trim() || isGenericTitle)) {
      return true;
    }

    return false;
  }, [cardData?.is_restricted, cardData?.restriction_reason, author.username, author.name, mediaDetails, bookmark.description, bookmark.title, (bookmark as any).content, bookmark.url]);

  // RESTRICTED ACCOUNT / AGE-GATED CARD VIEW
  if (isRestricted) {
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
        <View style={[styles.header, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight }]}>
          <View style={styles.authorRow}>
            <LinearGradient
              colors={['#f09433', '#dc2743', '#bc1888']}
              style={styles.postRing}
            >
              <View style={[styles.postAvatarInner, { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
                {author.avatar_url ? (
                  <SafeImage url={author.avatar_url} style={styles.postAvatarImg} />
                ) : (
                  <InstagramBrandLogo size={18} />
                )}
              </View>
            </LinearGradient>

            <View style={styles.authorInfo}>
              <View style={styles.usernameRow}>
                <Text style={[styles.username, { color: colors.textHeading }]} numberOfLines={1}>
                  {author.username && author.username !== 'unknown' ? `@${author.username}` : 'Instagram'}
                </Text>
                {author.verified && <VerifiedBadge size={15} color="#3B82F6" />}
              </View>
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {formatRelativeDate(cardData?.posted_at || bookmark.created_at)}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <InstagramBrandLogo size={22} />
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

        {/* Restricted Notice Body */}
        <View style={styles.restrictedContainer}>
          <View style={[styles.restrictedIconCircle, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.1)' }]}>
            <Lock size={24} color="#D97706" />
          </View>

          <Text style={[styles.restrictedText, { color: colors.textHeading }]}>
            {cardData?.restriction_reason || 'The account is restricted, please view it on Instagram.'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenPost}
            style={styles.restrictedBtnWrap}
          >
            <LinearGradient
              colors={['#f09433', '#dc2743', '#bc1888']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.restrictedBtn}
            >
              <Text style={styles.restrictedBtnText}>View on Instagram</Text>
              <ExternalLink size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

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
            {author.verified && <VerifiedBadge size={16} color="#3B82F6" />}
          </View>

          <View style={styles.headerRight}>
            <InstagramBrandLogo size={22} />
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
              {author.verified && <VerifiedBadge size={15} color="#3B82F6" />}
            </View>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatRelativeDate(cardData?.posted_at || bookmark.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <InstagramBrandLogo size={22} />
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

      {/* Main Media: Video, Carousel, or Single Image */}
      {mediaDetails.isVideo && (mediaDetails.videoUrl || mediaDetails.posterUrl) ? (
        <View style={[styles.mediaContainer, { backgroundColor: isDark ? '#000000' : '#F1EFEA' }]}>
          <SafeVideo
            videoUrl={mediaDetails.videoUrl}
            posterUrl={mediaDetails.posterUrl}
            height={360}
            onPressMedia={() => onOpenMedia ? onOpenMedia(bookmark, 0) : undefined}
            onFallbackOpen={handleOpenPost}
          />
        </View>
      ) : mediaDetails.imageUrls.length > 0 ? (
        <View style={styles.carouselContainer}>
          <SlidableMedia
            images={mediaDetails.imageUrls}
            height={360}
            onPressItem={(idx) => onOpenMedia ? onOpenMedia(bookmark, idx) : handleOpenPost()}
            onFallbackOpen={handleOpenPost}
            dotActiveColor="#0095F6"
          />
        </View>
      ) : mediaDetails.posterUrl ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onOpenMedia ? onOpenMedia(bookmark, 0) : handleOpenPost()}
          style={[styles.mediaContainer, { backgroundColor: isDark ? '#000000' : '#F1EFEA' }]}
        >
          <SafeImage
            url={mediaDetails.posterUrl}
            style={styles.mediaImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ) : null}

      {/* Content & Metrics */}
      <View style={styles.body}>
        {/* Engagement Action Bar */}
        <View style={styles.engagementRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionBtn}>
              <Heart size={24} color={colors.textHeading} />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionWithCount}>
              <MessageCircle size={24} color={colors.textHeading} />
              {Boolean(commentsCount) && (
                <Text style={[styles.actionCountText, { color: colors.textHeading }]}>
                  {commentsCount}
                </Text>
              )}
            </TouchableOpacity>

            {Boolean(repostsCount) && (
              <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionWithCount}>
                <Repeat size={22} color={colors.textHeading} />
                <Text style={[styles.actionCountText, { color: colors.textHeading }]}>
                  {repostsCount}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.actionBtn}>
              <Send size={22} color={colors.textHeading} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionBtn}>
            <BookmarkIcon size={24} color={colors.textHeading} />
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
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  profileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  profileUsername: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  postRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
    gap: 2,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  username: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  timeText: {
    fontSize: 13,
    marginTop: 1,
  },
  menuBtn: {
    padding: 4,
  },
  mediaContainer: {
    width: '100%',
    height: 360,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
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
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  actionBtn: {
    padding: 2,
  },
  actionWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 2,
  },
  actionCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  likesText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: -0.1,
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  captionUsername: {
    fontWeight: '700',
    fontSize: 15,
  },
  commentsLink: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },

  // Profile Card Specific
  profileBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },
  profileStatsWrap: {
    flex: 1,
    gap: 6,
  },
  authorDisplayName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.15,
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
    fontSize: 16,
    fontWeight: '700',
  },
  statColLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  viewProfileBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  gridTabText: {
    fontSize: 12,
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
  restrictedContainer: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  restrictedText: {
    fontSize: 15.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 280,
    marginBottom: 18,
  },
  restrictedBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  restrictedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  restrictedBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
