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
import { ThumbsUp, MessageSquare, Repeat, Share2, MoreVertical, FileText } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, LinkedInCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  parseCardData,
  formatNumber,
  formatRelativeDate,
  extractMetrics,
} from '../../utils/helpers';

interface LinkedInCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
}

export const LinkedInCard: React.FC<LinkedInCardProps> = ({
  bookmark,
  onOpenMenu,
  onViewAiContext,
}) => {
  const { colors, isDark } = useTheme();
  const cardData = parseCardData<LinkedInCardData>(bookmark.card_data);

  const author = cardData?.author || {
    name: bookmark.site_name || 'LinkedIn Member',
    avatar_url: bookmark.logo,
  };

  const metrics = extractMetrics(cardData, bookmark);
  const media = cardData?.media || [];
  const [avatarError, setAvatarError] = useState(false);

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

  const reactionsCount = formatNumber(metrics.reactions);
  const commentsCount = formatNumber(metrics.comments);
  const repostsCount = formatNumber(metrics.reposts);
  const hasMetrics = Boolean(reactionsCount || commentsCount || repostsCount);

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
            <View style={[styles.avatarFallback, { backgroundColor: '#0A66C2' }]}>
              <Text style={styles.avatarInitial}>
                {(author.name || 'L')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.authorNames}>
            <Text style={[styles.authorName, { color: colors.textHeading }]} numberOfLines={1}>
              {author.name}
            </Text>
            {Boolean(cardData?.page_intent) && (
              <Text style={[styles.pageIntent, { color: colors.textMuted }]} numberOfLines={1}>
                {cardData?.page_intent}
              </Text>
            )}
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

      {/* Post Text */}
      <Text style={[styles.postText, { color: colors.textHeading }]} numberOfLines={3}>
        {bookmark.description || bookmark.title}
      </Text>

      {/* Document attachment if available */}
      {cardData?.document && (
        <View style={[styles.docBox, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
          <FileText size={20} color={colors.primary} />
          <View style={styles.docInfo}>
            <Text style={[styles.docTitle, { color: colors.textHeading }]} numberOfLines={1}>
              {cardData.document.title || 'Document Attachment'}
            </Text>
            {Boolean(cardData.document.page_count) && (
              <Text style={[styles.docPages, { color: colors.textMuted }]}>
                {cardData.document.page_count} pages
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Media Image */}
      {media.length > 0 && media[0]?.url && (
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: media[0].url }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Metrics Summary Row (if metrics exist) */}
      {hasMetrics && (
        <View style={styles.metricsSummaryRow}>
          <View style={styles.reactionsBadgeRow}>
            {Boolean(reactionsCount) && (
              <>
                <View style={styles.reactionCircle}>
                  <ThumbsUp size={10} color="#FFFFFF" />
                </View>
                <Text style={[styles.reactionCountText, { color: colors.textMuted }]}>
                  {reactionsCount}
                </Text>
              </>
            )}
          </View>

          <View style={styles.commentsRepostsRow}>
            {Boolean(commentsCount) && (
              <Text style={[styles.metricDetailText, { color: colors.textMuted }]}>
                {commentsCount} comments
              </Text>
            )}
            {Boolean(commentsCount && repostsCount) && (
              <Text style={[styles.metricDetailText, { color: colors.textMuted }]}>·</Text>
            )}
            {Boolean(repostsCount) && (
              <Text style={[styles.metricDetailText, { color: colors.textMuted }]}>
                {repostsCount} reposts
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons Row */}
      <View style={[styles.actionsRow, { borderTopColor: colors.borderLight }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionBtn}>
          <ThumbsUp size={15} color={colors.textMuted} />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionBtn}>
          <MessageSquare size={15} color={colors.textMuted} />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenPost} style={styles.actionBtn}>
          <Repeat size={15} color={colors.textMuted} />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>Repost</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.actionBtn}>
          <Share2 size={15} color={colors.textMuted} />
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>Send</Text>
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  authorNames: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  pageIntent: {
    fontSize: 11,
    marginTop: 1,
  },
  timeText: {
    fontSize: 10.5,
    marginTop: 1,
  },
  menuBtn: {
    padding: 2,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  docBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 10,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  docPages: {
    fontSize: 11,
    marginTop: 2,
  },
  mediaWrap: {
    height: 170,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#EBE5DC',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  metricsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
  },
  reactionsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0A66C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionCountText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  commentsRepostsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricDetailText: {
    fontSize: 11.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  actionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
});

