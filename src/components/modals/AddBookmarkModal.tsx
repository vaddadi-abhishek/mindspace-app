import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Bookmark as BookmarkIcon, ClipboardPaste, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { Bookmark } from '../../types/bookmark';

interface AddBookmarkModalProps {
  visible: boolean;
  onClose: () => void;
  onAddBookmark: (newBookmark: Bookmark) => void;
  autoAiContext: boolean;
  onToggleAutoAiContext: (val: boolean) => void;
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  visible,
  onClose,
  onAddBookmark,
  autoAiContext,
  onToggleAutoAiContext,
}) => {
  const { colors, isDark } = useTheme();
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim()) {
        setUrl(text.trim());
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    let formatted = trimmed;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `https://${formatted}`;
    }

    let sourceName = 'Web';
    try {
      const parsed = new URL(formatted);
      sourceName = parsed.hostname.replace(/^www\./, '');
    } catch {
      // fallback
    }

    const isImageUrl = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(formatted);

    const newBookmark: Bookmark = {
      id: `bm_${Date.now()}`,
      url: formatted,
      title: sourceName,
      description: '',
      logo: null,
      site_name: sourceName,
      created_at: new Date().toISOString(),
      isFetchingMetadata: true,
      card_data: isImageUrl
        ? {
            snapshot: formatted,
            author: null,
            published_at: null,
            site_name: sourceName,
            type: 'image',
          }
        : undefined,
    };

    setUrl('');
    onClose();
    onAddBookmark(newBookmark);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.modal,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
                  <View style={styles.headerLeft}>
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: colors.accentBg },
                      ]}
                    >
                      <BookmarkIcon size={18} color={colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.textHeading }]}>
                      Save Link
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

                {/* Input with Paste */}
                <View style={styles.body}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    URL
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: colors.textHeading }]}
                      placeholder="https://example.com or social link..."
                      placeholderTextColor={colors.textMuted}
                      value={url}
                      onChangeText={setUrl}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                    <TouchableOpacity
                      onPress={handlePaste}
                      style={[
                        styles.pasteBtn,
                        { backgroundColor: colors.accentBg },
                      ]}
                    >
                      <ClipboardPaste size={14} color={colors.primary} />
                      <Text style={[styles.pasteText, { color: colors.primary }]}>
                        Paste
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Auto AI Context Toggle */}
                  <View
                    style={[
                      styles.switchRow,
                      {
                        backgroundColor: colors.accentBg,
                        borderColor: colors.accentBorder,
                      },
                    ]}
                  >
                    <View style={styles.switchInfo}>
                      <Text style={[styles.switchTitle, { color: colors.textHeading }]}>
                        Auto AI Context
                      </Text>
                      <Text style={[styles.switchSubtitle, { color: colors.textMuted }]}>
                        Generate summary & tags automatically
                      </Text>
                    </View>
                    <Switch
                      value={autoAiContext}
                      onValueChange={onToggleAutoAiContext}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!url.trim() || submitting}
                    style={[
                      styles.submitBtn,
                      {
                        backgroundColor: colors.primary,
                        opacity: !url.trim() || submitting ? 0.6 : 1,
                      },
                    ]}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Save Bookmark</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    marginTop: -8,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 0,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pasteText: {
    fontSize: 12,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  switchInfo: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  submitBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
