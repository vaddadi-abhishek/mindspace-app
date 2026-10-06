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
import {
  Heart,
  MessageCircle,
  Repeat,
  Eye,
  Bookmark as BookmarkIcon,
  Share2,
  MoreVertical,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, XCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
  formatDetailDate,
  extractMetrics,
} from '../../utils/helpers';

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

  const metrics = extractMetrics(cardData, bookmark);
  const media = cardData?.media || [];
  const postedAt = cardData?.posted_at || bookmark.created_at;
  const [avatarError, setAvatarError] = useState(false);

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
            <Image
              source={{ uri: author.avatar_url }}
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
              {author.verified && (
                <CheckCircle size={14} color="#1D9BF0" fill="#1D9BF0" />
              )}
            </View>
            <Text style={[styles.handleText, { color: colors.textMuted }]} numberOfLines={1}>
              {(author.handle.startsWith('@') ? author.handle : `@${author.handle}`)} · {formatRelativeDate(postedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.xBrand, { color: colors.textHeading }]}>𝕏</Text>
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

      {/* Tweet Text */}
      <Text style={[styles.tweetText, { color: colors.textHeading }]}>
        {bookmark.description || bookmark.title}
      </Text>

      {/* Media Image if available */}
      {media.length > 0 && media[0]?.url && (
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: media[0].url }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </View>
      )}

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
    gap: 6,
  },
  xBrand: {
    fontSize: 15,
    fontWeight: '800',
  },
  menuBtn: {
    padding: 2,
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
  },
  mediaImage: {
    width: '100%',
    height: '100%',
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
});

