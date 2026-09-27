import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Linking,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Sparkles,
  BookOpen,
  ExternalLink,
  Copy,
  Trash2,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark } from '../../types/bookmark';
import { sanitizeUrl } from '../../utils/helpers';

interface CardActionSheetProps {
  visible: boolean;
  bookmark: Bookmark | null;
  onClose: () => void;
  onViewAiContext: (bookmark: Bookmark) => void;
  onGenerateAiContext?: (bookmark: Bookmark) => void;
  onReadArticle?: (bookmark: Bookmark) => void;
  onRequestDelete: (id: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
  isGeneratingAi?: boolean;
}

export const CardActionSheet: React.FC<CardActionSheetProps> = ({
  visible,
  bookmark,
  onClose,
  onViewAiContext,
  onGenerateAiContext,
  onReadArticle,
  onRequestDelete,
  onShowToast,
  isGeneratingAi = false,
}) => {
  const { colors, isDark } = useTheme();

  if (!bookmark) return null;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(bookmark.url);
      onShowToast('Link copied to clipboard!', 'success');
    } catch {
      onShowToast('Failed to copy link', 'error');
    }
    onClose();
  };

  const handleOpenExternal = async () => {
    const url = sanitizeUrl(bookmark.url);
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      onShowToast('Cannot open URL', 'error');
    }
    onClose();
  };

  const hasAiContext = Boolean(bookmark.ai_context || (bookmark.ai_category && bookmark.ai_category.length > 0));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.modal,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.headerInfo}>
                  <Text
                    style={[styles.headerTitle, { color: colors.textHeading }]}
                    numberOfLines={1}
                  >
                    {bookmark.title || bookmark.site_name || bookmark.url}
                  </Text>
                  <Text
                    style={[styles.headerSubtitle, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {bookmark.url}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Actions */}
              <View style={styles.actionsList}>
                {hasAiContext && (
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => {
                      onClose();
                      onViewAiContext(bookmark);
                    }}
                  >
                    <Sparkles size={18} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.textHeading }]}>
                      View AI Context
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onGenerateAiContext?.(bookmark);
                  }}
                  disabled={isGeneratingAi}
                >
                  {isGeneratingAi ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Sparkles size={18} color={colors.secondary} />
                  )}
                  <Text style={[styles.actionText, { color: colors.textHeading }]}>
                    {hasAiContext ? 'Regenerate AI Context' : 'Generate AI Context'}
                  </Text>
                </TouchableOpacity>

                {Boolean(bookmark.is_article) && (
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => {
                      onClose();
                      onReadArticle?.(bookmark);
                    }}
                  >
                    <BookOpen size={18} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.textHeading }]}>
                      Read Article Mode
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.actionItem} onPress={handleOpenExternal}>
                  <ExternalLink size={18} color={colors.textBody} />
                  <Text style={[styles.actionText, { color: colors.textHeading }]}>
                    Open in Browser
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={handleCopyLink}>
                  <Copy size={18} color={colors.textBody} />
                  <Text style={[styles.actionText, { color: colors.textHeading }]}>
                    Copy Link
                  </Text>
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onRequestDelete(bookmark.id);
                  }}
                >
                  <Trash2 size={18} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error, fontWeight: '600' }]}>
                    Delete Bookmark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingBottom: 36,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Menlo',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  actionsList: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  actionText: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
