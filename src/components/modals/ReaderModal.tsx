import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, FileText, Sun, Moon, Type } from 'lucide-react-native';
import { fetchBookmarkArticle } from '../../services/api';
import type { ArticleContent, Bookmark } from '../../types/bookmark';
import { useTheme } from '../../context/ThemeContext';

interface ReaderModalProps {
  visible: boolean;
  bookmark: Bookmark | null;
  onClose: () => void;
}

type ReaderTheme = 'warm' | 'dark' | 'light';
type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl';

export const ReaderModal: React.FC<ReaderModalProps> = ({
  visible,
  bookmark,
  onClose,
}) => {
  const { isDark: appIsDark } = useTheme();
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(appIsDark ? 'dark' : 'warm');
  const [fontSize, setFontSize] = useState<ReaderFontSize>('base');

  useEffect(() => {
    if (!visible || !bookmark) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchBookmarkArticle(bookmark.id)
      .then((data) => {
        if (isMounted) setArticle(data);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to load reader mode.';
          setError(message);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, bookmark]);

  if (!bookmark) return null;

  // Theme palettes for reader
  const themeColors = {
    warm: {
      bg: '#FAF8F5',
      text: '#211D1A',
      muted: '#7E7569',
      border: '#EBE5DC',
      card: '#F3EFEA',
    },
    dark: {
      bg: '#12100E',
      text: '#FAF8F5',
      muted: '#8C8377',
      border: '#28231E',
      card: '#1B1713',
    },
    light: {
      bg: '#FFFFFF',
      text: '#111827',
      muted: '#6B7280',
      border: '#E5E7EB',
      card: '#F9FAFB',
    },
  }[readerTheme];

  const fontSizeMap = {
    sm: { title: 22, body: 15, lineHeight: 24 },
    base: { title: 25, body: 17, lineHeight: 28 },
    lg: { title: 28, body: 19, lineHeight: 32 },
    xl: { title: 32, body: 21, lineHeight: 36 },
  }[fontSize];

  // Helper to strip HTML tags for clean native text rendering
  const cleanHtmlToText = (html?: string): string => {
    if (!html) return '';
    return html
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: themeColors.bg }]}
      >
        {/* Top Control Bar */}
        <View style={[styles.topBar, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={themeColors.text} />
          </TouchableOpacity>

          <View style={styles.controlsRow}>
            {/* Font Size cycle button */}
            <TouchableOpacity
              onPress={() => {
                const nextSize: Record<ReaderFontSize, ReaderFontSize> = {
                  sm: 'base',
                  base: 'lg',
                  lg: 'xl',
                  xl: 'sm',
                };
                setFontSize(nextSize[fontSize]);
              }}
              style={[styles.toolBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            >
              <Type size={16} color={themeColors.text} />
              <Text style={[styles.toolBtnText, { color: themeColors.text }]}>
                {fontSize.toUpperCase()}
              </Text>
            </TouchableOpacity>

            {/* Theme switcher */}
            <TouchableOpacity
              onPress={() => {
                const nextTheme: Record<ReaderTheme, ReaderTheme> = {
                  warm: 'dark',
                  dark: 'light',
                  light: 'warm',
                };
                setReaderTheme(nextTheme[readerTheme]);
              }}
              style={[styles.toolBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            >
              {readerTheme === 'dark' ? (
                <Moon size={16} color="#D99F50" />
              ) : (
                <Sun size={16} color="#B5814C" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#B5814C" />
            <Text style={[styles.loadingText, { color: themeColors.muted }]}>
              Extracting clean reader mode...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
            <TouchableOpacity onPress={onClose} style={styles.dismissBtn}>
              <Text style={styles.dismissBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Metadata Bar */}
            <View style={styles.metaRow}>
              <Text style={[styles.siteName, { color: '#B5814C' }]}>
                {article?.site_name || bookmark.site_name || 'Web Article'}
              </Text>
              {Boolean(article?.reading_time_minutes) && (
                <View style={styles.readingTimePill}>
                  <Clock size={12} color={themeColors.muted} />
                  <Text style={[styles.readingTimeText, { color: themeColors.muted }]}>
                    {article!.reading_time_minutes} min read
                  </Text>
                </View>
              )}
              {Boolean(article?.word_count) && (
                <View style={styles.readingTimePill}>
                  <FileText size={12} color={themeColors.muted} />
                  <Text style={[styles.readingTimeText, { color: themeColors.muted }]}>
                    {article!.word_count} words
                  </Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text
              style={[
                styles.articleTitle,
                {
                  color: themeColors.text,
                  fontSize: fontSizeMap.title,
                },
              ]}
            >
              {article?.title || bookmark.title || bookmark.url}
            </Text>

            {/* Divider */}
            <View style={[styles.contentDivider, { backgroundColor: themeColors.border }]} />

            {/* Body */}
            <Text
              style={[
                styles.articleBody,
                {
                  color: themeColors.text,
                  fontSize: fontSizeMap.body,
                  lineHeight: fontSizeMap.lineHeight,
                },
              ]}
            >
              {cleanHtmlToText(article?.content_html) || bookmark.description || 'No article content available.'}
            </Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
  },
  dismissBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#B5814C',
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  siteName: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  readingTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readingTimeText: {
    fontSize: 12,
  },
  articleTitle: {
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 34,
    marginBottom: 16,
    fontFamily: 'Georgia',
  },
  contentDivider: {
    height: 1,
    marginVertical: 16,
  },
  articleBody: {
    fontFamily: 'Georgia',
    letterSpacing: 0.1,
  },
});
