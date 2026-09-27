import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Sparkles, Copy, Check, ExternalLink, X, Tag, Eye, FileText } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark } from '../../types/bookmark';
import { sanitizeUrl } from '../../utils/helpers';

interface AiContextModalProps {
  visible: boolean;
  bookmark: Bookmark | null;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const AiContextModal: React.FC<AiContextModalProps> = ({
  visible,
  bookmark,
  onClose,
  onShowToast,
}) => {
  const { colors, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  if (!bookmark) return null;

  const handleCopySummary = async () => {
    if (!bookmark.ai_context) return;
    try {
      await Clipboard.setStringAsync(bookmark.ai_context);
      setCopied(true);
      onShowToast('Summary copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('Failed to copy', 'error');
    }
  };

  const handleOpenSource = async () => {
    const url = sanitizeUrl(bookmark.url);
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      onShowToast('Cannot open URL', 'error');
    }
  };

  const hasCategories = Boolean(bookmark.ai_category && bookmark.ai_category.length > 0);
  const hasContext = Boolean(bookmark.ai_context && bookmark.ai_context.trim().length > 0);
  const hasTags = Boolean(bookmark.ai_tags && bookmark.ai_tags.length > 0);
  const hasEntities = Boolean(bookmark.visual_entities && bookmark.visual_entities.length > 0);
  const hasOcr = Boolean(bookmark.ocr_text && bookmark.ocr_text.trim().length > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.modal,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.headerInfo}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.siteBadge,
                        {
                          backgroundColor: colors.accentBg,
                          borderColor: colors.accentBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.siteBadgeText, { color: colors.primary }]}>
                        {bookmark.site_name || 'Web'}
                      </Text>
                    </View>
                    <View style={styles.aiTag}>
                      <Sparkles size={11} color={colors.secondary} />
                      <Text style={[styles.aiTagText, { color: colors.textMuted }]}>
                        AI Intelligence
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.title, { color: colors.textHeading }]}
                    numberOfLines={2}
                  >
                    {bookmark.title || bookmark.url}
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

              {/* Scrollable Body */}
              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. AI Summary */}
                {hasContext ? (
                  <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                        Context Synthesis
                      </Text>
                      <TouchableOpacity
                        onPress={handleCopySummary}
                        style={[styles.copyBtn, { backgroundColor: colors.accentBg }]}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        {copied ? (
                          <Check size={12} color={colors.primary} />
                        ) : (
                          <Copy size={12} color={colors.primary} />
                        )}
                        <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                          {copied ? 'Copied' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.summaryText, { color: colors.textHeading }]}>
                      {bookmark.ai_context}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', paddingVertical: 24 }]}>
                    <Sparkles size={24} color={colors.primary} style={{ opacity: 0.6, marginBottom: 8 }} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      AI context hasn't been generated for this bookmark yet.
                    </Text>
                  </View>
                )}

                {/* 2. Taxonomy / Categories */}
                {hasCategories && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                      Topic Taxonomy
                    </Text>
                    <View style={styles.tagWrap}>
                      {bookmark.ai_category!.map((cat, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.categoryBadge,
                            {
                              backgroundColor: colors.accentBg,
                              borderColor: colors.accentBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>
                            {cat}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 3. Conceptual Tags */}
                {hasTags && (
                  <View style={styles.section}>
                    <View style={styles.rowTitle}>
                      <Tag size={12} color={colors.textMuted} />
                      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                        Conceptual Tags
                      </Text>
                    </View>
                    <View style={styles.tagWrap}>
                      {bookmark.ai_tags!.map((t, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.tagBadge,
                            {
                              backgroundColor: isDark ? 'rgba(40, 34, 28, 0.7)' : 'rgba(235, 229, 220, 0.7)',
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.tagBadgeText, { color: colors.textBody }]}>
                            #{t}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 4. Visual Entities */}
                {hasEntities && (
                  <View style={styles.section}>
                    <View style={styles.rowTitle}>
                      <Eye size={12} color={colors.textMuted} />
                      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                        Visual Entities
                      </Text>
                    </View>
                    <View style={styles.tagWrap}>
                      {bookmark.visual_entities!.map((entity, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.tagBadge,
                            {
                              backgroundColor: isDark ? 'rgba(30, 26, 22, 0.6)' : 'rgba(240, 235, 228, 0.6)',
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.tagBadgeText, { color: colors.textBody }]}>
                            {entity}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 5. OCR Text */}
                {hasOcr && (
                  <View style={styles.section}>
                    <View style={styles.rowTitle}>
                      <FileText size={12} color={colors.textMuted} />
                      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                        Visual OCR Text
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.ocrBox,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.ocrText, { color: colors.textBody }]}>
                        {bookmark.ocr_text}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Bottom Actions */}
              <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
                <TouchableOpacity
                  onPress={handleOpenSource}
                  style={[
                    styles.openSourceBtn,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <ExternalLink size={15} color="#FFFFFF" />
                  <Text style={styles.openSourceText}>Open Original Link</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  siteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
  },
  siteBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    lineHeight: 22,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 20,
    gap: 18,
  },
  sectionBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 21,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    gap: 8,
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ocrBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  ocrText: {
    fontFamily: 'Menlo',
    fontSize: 11.5,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  openSourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
  },
  openSourceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
