import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Play, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, YouTubeCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
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
  const { colors } = useTheme();
  const cardData = parseCardData<YouTubeCardData>(bookmark.card_data);

  const channel = cardData?.channel || {
    name: bookmark.site_name || 'YouTube',
    avatar_url: bookmark.logo,
  };

  const metrics = cardData?.metrics || {};
  const thumbnail =
    cardData?.video_thumbnail ||
    bookmark.snapshot_url ||
    (cardData?.video_id ? `https://img.youtube.com/vi/${cardData.video_id}/hqdefault.jpg` : null);

  const [thumbError, setThumbError] = useState(false);

  const handleOpenVideo = () => {
    const clean = sanitizeUrl(bookmark.url);
    if (clean) Linking.openURL(clean).catch(() => {});
  };

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
            <Text style={[styles.channelMeta, { color: colors.textMuted }]}>
              {channel.name} · {formatNumber(metrics.views) ? `${formatNumber(metrics.views)} views · ` : ''}
              {formatRelativeDate(cardData?.posted_at || bookmark.created_at)}
            </Text>
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
  channelMeta: {
    fontSize: 11.5,
  },
  menuBtn: {
    padding: 2,
  },
});
