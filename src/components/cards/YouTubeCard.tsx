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
  onOpenMedia?: (bookmark: Bookmark, initialIndex?: number) => void;
}

export const YouTubeCard: React.FC<YouTubeCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
  onOpenMedia,
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
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onOpenMedia ? onOpenMedia(bookmark, 0) : handleOpenVideo()}
          style={[styles.thumbnailContainer, { backgroundColor: isDark ? '#000000' : '#F1EFEA' }]}
        >
          <SafeImage
            url={thumbSrc}
            style={styles.thumbnailImage}
            onError={handleThumbError}
            resizeMode="contain"
          />
          <VideoPlayOverlay size={50} iconSize={22} />
        </TouchableOpacity>
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
              <CheckCircle size={14} color={colors.textMuted} style={styles.verifiedIcon} />
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
            <MoreVertical size={20} color={colors.textMuted} />
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
              <ThumbsUp size={17} color={colors.textHeading} />
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
              <ThumbsDown size={17} color={colors.textHeading} />
            </TouchableOpacity>
          </View>

          {/* Share Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleShare}
            style={[styles.singlePill, { backgroundColor: isDark ? '#272729' : '#F1EFEA', borderColor: colors.borderLight }]}
          >
            <Share2 size={17} color={colors.textHeading} />
            <Text style={[styles.pillText, { color: colors.textHeading }]}>Share</Text>
          </TouchableOpacity>
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
    padding: 16,
    gap: 10,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 2,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  channelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedIcon: {
    marginLeft: 1,
  },
  metaDot: {
    fontSize: 13,
  },
  viewsText: {
    fontSize: 13,
  },
  dateText: {
    fontSize: 13,
  },
  menuBtn: {
    padding: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  jointPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  likeSubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dislikeSubPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillDivider: {
    width: 1,
    height: 16,
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

