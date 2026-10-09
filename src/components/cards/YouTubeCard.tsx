import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
} from 'react-native';
import { MoreVertical, ThumbsUp, ThumbsDown, Share2, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, YouTubeCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
  extractMetrics,
} from '../../utils/helpers';
import { VideoPlayOverlay } from '../ui/VideoPlayOverlay';
import { SafeImage } from '../ui/SafeImage';

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

  const [thumbSrc, setThumbSrc] = useState<string | null>(() => {
    if (cardData?.video_thumbnail) return cardData.video_thumbnail;
    if (bookmark.snapshot_url) return bookmark.snapshot_url;
    if (cardData?.video_id) return `https://i.ytimg.com/vi/${cardData.video_id}/maxresdefault.jpg`;
    return null;
  });

  const handleThumbError = () => {
    if (cardData?.video_id && thumbSrc?.includes('maxresdefault.jpg')) {
      setThumbSrc(`https://i.ytimg.com/vi/${cardData.video_id}/hqdefault.jpg`);
    } else if (cardData?.video_id && thumbSrc?.includes('hqdefault.jpg')) {
      setThumbSrc(`https://i.ytimg.com/vi/${cardData.video_id}/mqdefault.jpg`);
    } else {
      setThumbSrc(bookmark.snapshot_url || null);
    }
  };

  const handleOpenVideo = async () => {
    const clean = sanitizeUrl(bookmark.url);
    if (!clean) return;
    if (cardData?.video_id) {
      const appUrl = `vnd.youtube://${cardData.video_id}`;
      try {
        const canOpen = await Linking.canOpenURL(appUrl);
        if (canOpen) {
          await Linking.openURL(appUrl);
          return;
        }
      } catch {}
    }
    Linking.openURL(clean).catch(() => {});
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
      {thumbSrc && (
        <View style={[styles.thumbnailContainer, { backgroundColor: isDark ? '#000000' : '#F1EFEA' }]}>
          <SafeImage
            url={thumbSrc}
            style={styles.thumbnailImage}
            onError={handleThumbError}
            resizeMode="contain"
          />
          <VideoPlayOverlay size={50} iconSize={22} />
        </View>
      )}

      {/* Video Info */}
      <View style={styles.body}>
        <View style={styles.channelRow}>
          {channel.avatar_url ? (
            <SafeImage url={channel.avatar_url} style={styles.avatar} />
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
    height: 220,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
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

