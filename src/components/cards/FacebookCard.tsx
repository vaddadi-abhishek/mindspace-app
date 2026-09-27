import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { ThumbsUp, MessageSquare, Share2, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, FacebookCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
} from '../../utils/helpers';

interface FacebookCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
}

export const FacebookCard: React.FC<FacebookCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
}) => {
  const { colors } = useTheme();
  const cardData = parseCardData<FacebookCardData>(bookmark.card_data);

  const author = cardData?.author || {
    name: bookmark.site_name || 'Facebook',
    avatar_url: bookmark.logo,
  };

  const metrics = cardData?.metrics || {};
  const media = cardData?.media || [];
  const imageUrl = media[0]?.url || cardData?.video_thumbnail || bookmark.snapshot_url;
  const [avatarError, setAvatarError] = useState(false);

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
      <View style={styles.header}>
        <View style={styles.authorRow}>
          {author.avatar_url && !avatarError ? (
            <Image
              source={{ uri: author.avatar_url }}
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
            <Text style={[styles.authorName, { color: colors.textHeading }]} numberOfLines={1}>
              {author.name}
            </Text>
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

      <Text style={[styles.postText, { color: colors.textHeading }]} numberOfLines={3}>
        {bookmark.description || bookmark.title}
      </Text>

      {imageUrl && (
        <View style={styles.mediaWrap}>
          <Image source={{ uri: imageUrl }} style={styles.mediaImage} resizeMode="cover" />
        </View>
      )}

      <View style={[styles.metricsRow, { borderTopColor: colors.borderLight }]}>
        <View style={styles.metricItem}>
          <ThumbsUp size={14} color="#1877F2" />
          <Text style={[styles.metricText, { color: colors.textMuted }]}>
            {formatNumber(metrics.likes) || 0}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <MessageSquare size={14} color={colors.textMuted} />
          <Text style={[styles.metricText, { color: colors.textMuted }]}>
            {formatNumber(metrics.comments) || 0}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Share2 size={14} color={colors.textMuted} />
          <Text style={[styles.metricText, { color: colors.textMuted }]}>
            {formatNumber(metrics.shares) || 0}
          </Text>
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
  menuBtn: {
    padding: 2,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  mediaWrap: {
    height: 170,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#EBE5DC',
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
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
