import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
} from 'react-native';
import { Play, MoreVertical, ThumbsUp, ThumbsDown, Share2, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, YouTubeCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
  extractMetrics,
} from '../../utils/helpers';

interface YouTubeCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
}

export const YouTubeCard: React.FC<YouTubeCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
}) => {
  const { colors, isDark } = useTheme();
  const cardData = parseCardData<YouTubeCardData>(bookmark.card_data);

  const channel = cardData?.channel || {
    name: bookmark.site_name || 'YouTube',
    avatar_url: bookmark.logo,
  };

  const metrics = extractMetrics(cardData, bookmark);
  const thumbnail =
    cardData?.video_thumbnail ||
    bookmark.snapshot_url ||
    (cardData?.video_id ? `https://img.youtube.com/vi/${cardData.video_id}/hqdefault.jpg` : null);

  const [thumbError, setThumbError] = useState(false);

  const handleOpenVideo = () => {
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

  const likesCount = formatNumber(metrics.likes);
  const viewsCount = formatNumber(metrics.views);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleOpenVideo}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Video Thumbnail with Play Button */}
      {thumbnail && !thumbError && (
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: thumbnail }}
            style={styles.thumbnailImage}
            onError={() => setThumbError(true)}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
          </View>
        </View>
      )}

      {/* Video Info */}
      <View style={styles.body}>
        <View style={styles.channelRow}>
          {channel.avatar_url ? (
            <Image source={{ uri: channel.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: '#FF0000' }]}>
              <Text style={styles.avatarInitial}>
                {(channel.name || 'Y')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.infoCol}>
            <Text style={[styles.title, { color: colors.textHeading }]} numberOfLines={2}>
              {bookmark.title || bookmark.url}
            </Text>
            <View style={styles.channelMetaRow}>
              <Text style={[styles.channelName, { color: colors.textBody }]} numberOfLines={1}>
                {channel.name}
              </Text>
              <CheckCircle size={11} color={colors.textMuted} style={styles.verifiedIcon} />
              {Boolean(viewsCount) && (
                <>
                  <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
                  <Text style={[styles.viewsText, { color: colors.textMuted }]}>
                    {viewsCount} views
                  </Text>
                </>
              )}
              {Boolean(formatRelativeDate(cardData?.posted_at || bookmark.created_at)) && (
                <>
                  <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {formatRelativeDate(cardData?.posted_at || bookmark.created_at)}
                  </Text>
                </>
              )}
            </View>
          </View>

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

        {/* Video Description Snippet if present */}
        {Boolean(bookmark.description && bookmark.description !== bookmark.title) && (
          <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
            {bookmark.description}
          </Text>
        )}

        {/* Action Pills Row */}
        <View style={[styles.actionsRow, { borderTopColor: colors.borderLight }]}>
          {/* Like & Dislike Joint Pill */}
          <View style={[styles.jointPill, { backgroundColor: isDark ? '#272729' : '#F1EFEA', borderColor: colors.borderLight }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenVideo}
              style={styles.likeSubPill}
            >
              <ThumbsUp size={13} color={colors.textHeading} />
              <Text style={[styles.pillText, { color: colors.textHeading }]}>
                {likesCount || 'Like'}
              </Text>
            </TouchableOpacity>
            <View style={[styles.pillDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenVideo}
              style={styles.dislikeSubPill}
            >
              <ThumbsDown size={13} color={colors.textHeading} />
            </TouchableOpacity>
          </View>

          {/* Share Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleShare}
            style={[styles.singlePill, { backgroundColor: isDark ? '#272729' : '#F1EFEA', borderColor: colors.borderLight }]}
          >
            <Share2 size={13} color={colors.textHeading} />
            <Text style={[styles.pillText, { color: colors.textHeading }]}>Share</Text>
          </TouchableOpacity>
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
  thumbnailContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#000000',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  body: {
    padding: 12,
    gap: 8,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginTop: 2,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 4,
  },
  channelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  channelName: {
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedIcon: {
    marginLeft: 1,
  },
  metaDot: {
    fontSize: 11,
  },
  viewsText: {
    fontSize: 11,
  },
  dateText: {
    fontSize: 11,
  },
  menuBtn: {
    padding: 2,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  jointPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  likeSubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dislikeSubPill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillDivider: {
    width: 1,
    height: 14,
  },
  singlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
});

