import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Heart, MessageCircle, MoreVertical, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, InstagramCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
} from '../../utils/helpers';

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

  const metrics = cardData?.metrics || {};
  const media = cardData?.media || [];
  const imageUrl =
    media[0]?.url ||
    (cardData?.images && typeof cardData.images[0] === 'string' ? cardData.images[0] : null) ||
    cardData?.video_thumbnail ||
    bookmark.snapshot_url ||
    bookmark.logo;

  const [imageError, setImageError] = useState(false);

  const handleOpenPost = () => {
    const clean = sanitizeUrl(bookmark.url);
    if (clean) Linking.openURL(clean).catch(() => {});
  };

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
          {author.avatar_url ? (
            <Image source={{ uri: author.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.accentBg }]}>
              <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                {(author.username || 'I')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <View style={styles.usernameRow}>
              <Text style={[styles.username, { color: colors.textHeading }]} numberOfLines={1}>
                {author.username}
              </Text>
              {author.verified && (
                <CheckCircle size={13} color="#3B82F6" fill="#3B82F6" />
              )}
            </View>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatRelativeDate(cardData?.posted_at || bookmark.created_at)}
            </Text>
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

      {/* Main Image */}
      {imageUrl && !imageError && (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.mediaImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Content & Metrics */}
      <View style={styles.body}>
        {/* Engagement Icons */}
        <View style={styles.engagementRow}>
          <View style={styles.metricGroup}>
            <Heart size={16} color={colors.textBody} />
            <Text style={[styles.metricText, { color: colors.textHeading }]}>
              {formatNumber(metrics.likes) || 'Like'}
            </Text>
          </View>
          <View style={styles.metricGroup}>
            <MessageCircle size={16} color={colors.textBody} />
            <Text style={[styles.metricText, { color: colors.textHeading }]}>
              {formatNumber(metrics.comments) || 'Comment'}
            </Text>
          </View>
        </View>

        {/* Caption */}
        {Boolean(bookmark.description || bookmark.title) && (
          <Text style={[styles.caption, { color: colors.textHeading }]} numberOfLines={3}>
            <Text style={styles.captionUsername}>{author.username} </Text>
            {bookmark.description || bookmark.title}
          </Text>
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    height: 220,
    backgroundColor: '#EBE5DC',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: 12,
    gap: 6,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },
  metricGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  captionUsername: {
    fontWeight: '700',
  },
});
