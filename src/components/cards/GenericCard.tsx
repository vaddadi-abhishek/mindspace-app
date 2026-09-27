import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { MoreVertical, Sparkles, BookOpen, ExternalLink } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark, GlobalWebCardData } from '../../types/bookmark';
import {
  sanitizeUrl,
  getFaviconUrl,
  parseCardData,
  formatRelativeDate,
} from '../../utils/helpers';

interface GenericCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onReadArticle?: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
}

export const GenericCard: React.FC<GenericCardProps> = ({
  bookmark,
  onOpenMenu,
  onReadArticle,
  onViewAiContext,
}) => {
  const { colors, isDark } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const cardData = parseCardData<GlobalWebCardData>(bookmark.card_data);
  const snapshotUrl =
    cardData?.snapshot ||
    bookmark.snapshot_url ||
    (bookmark as { snapshot?: string | null }).snapshot ||
    null;

  const mediaUrl = !imageError && snapshotUrl ? snapshotUrl : null;
  const favicon = getFaviconUrl(bookmark.url);
  const logoSrc = !logoError && bookmark.logo ? bookmark.logo : favicon;

  const handleCardPress = async () => {
    if (bookmark.is_article && onReadArticle) {
      onReadArticle(bookmark);
      return;
    }
    const clean = sanitizeUrl(bookmark.url);
    if (clean) {
      Linking.openURL(clean).catch(() => {});
    }
  };

  const hasAi = Boolean(bookmark.ai_context || (bookmark.ai_category && bookmark.ai_category.length > 0));

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleCardPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Media Image */}
      {mediaUrl && (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.mediaImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
          {bookmark.is_article && (
            <View style={styles.articleBadge}>
              <BookOpen size={11} color="#FFFFFF" />
              <Text style={styles.articleBadgeText}>Article</Text>
            </View>
          )}
        </View>
      )}

      {/* Card Content */}
      <View style={styles.body}>
        {/* Source info & 3-dots */}
        <View style={styles.topMetaRow}>
          <View style={styles.sourceGroup}>
            {logoSrc ? (
              <Image
                source={{ uri: logoSrc }}
                style={styles.logoIcon}
                onError={() => setLogoError(true)}
              />
            ) : null}
            <Text
              style={[styles.siteNameText, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {bookmark.site_name || 'Web'}
            </Text>
            {bookmark.created_at && (
              <>
                <Text style={[styles.dotSep, { color: colors.textMuted }]}>·</Text>
                <Text style={[styles.dateText, { color: colors.textMuted }]}>
                  {formatRelativeDate(bookmark.created_at)}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu(bookmark);
            }}
            style={styles.menuBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text
          style={[styles.title, { color: colors.textHeading }]}
          numberOfLines={2}
        >
          {bookmark.title || bookmark.url}
        </Text>

        {/* Description */}
        {Boolean(bookmark.description) && (
          <Text
            style={[styles.description, { color: colors.textBody }]}
            numberOfLines={2}
          >
            {bookmark.description}
          </Text>
        )}

        {/* Bottom AI Status / Categories / Tags */}
        <View style={styles.bottomRow}>
          {hasAi && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onViewAiContext?.(bookmark);
              }}
              style={[
                styles.aiPill,
                {
                  backgroundColor: colors.accentBg,
                  borderColor: colors.accentBorder,
                },
              ]}
            >
              <Sparkles size={11} color={colors.primary} />
              <Text style={[styles.aiPillText, { color: colors.primary }]}>
                {bookmark.ai_category && bookmark.ai_category[0]
                  ? bookmark.ai_category[0]
                  : 'AI Context'}
              </Text>
            </TouchableOpacity>
          )}

          {bookmark.ai_status === 'no_credits' && (
            <View
              style={[
                styles.aiPill,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                },
              ]}
            >
              <Text style={[styles.aiPillText, { color: colors.error }]}>
                No credits
              </Text>
            </View>
          )}

          {bookmark.is_article && !mediaUrl && (
            <View
              style={[
                styles.aiPill,
                {
                  backgroundColor: isDark ? 'rgba(40, 34, 28, 0.8)' : 'rgba(235, 229, 220, 0.8)',
                  borderColor: colors.border,
                },
              ]}
            >
              <BookOpen size={10} color={colors.textMuted} />
              <Text style={[styles.aiPillText, { color: colors.textBody }]}>
                Read Mode
              </Text>
            </View>
          )}
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
  mediaContainer: {
    height: 160,
    width: '100%',
    backgroundColor: '#EBE5DC',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  articleBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  articleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  body: {
    padding: 14,
    gap: 6,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sourceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  logoIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  siteNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dotSep: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 11,
  },
  menuBtn: {
    padding: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  aiPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
