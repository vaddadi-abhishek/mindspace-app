import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {
  Sparkles,
  Moon,
  Bot,
  Trash2,
  X,
  Server,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateUserSettings, deleteUserAccount } from '../services/api';
import {
  getActiveApiBaseUrl,
  setActiveApiBaseUrl,
  resetActiveApiBaseUrl,
  DEFAULT_LOCAL_API_URL,
  DEFAULT_PRODUCTION_API_URL,
} from '../constants/config';
import type { UserPlanInfo } from '../types/bookmark';

interface SettingsScreenProps {
  planInfo: UserPlanInfo | null;
  onPlanUpdated: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  planInfo,
  onPlanUpdated,
  onShowToast,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();

  // Auto AI Setting
  const [autoAi, setAutoAi] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Subscribe dialog
  const [showSubscribeInfo, setShowSubscribeInfo] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Advanced backend URL section
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    if (planInfo) {
      setAutoAi(planInfo.auto_ai_context);
    }
  }, [planInfo]);

  useEffect(() => {
    getActiveApiBaseUrl().then((url) => setBackendUrl(url));
  }, []);

  const handleToggleAutoAi = async (val: boolean) => {
    setAutoAi(val);
    setUpdatingSettings(true);
    try {
      await updateUserSettings({ auto_ai_context: val });
      onShowToast(`Auto AI Context ${val ? 'enabled' : 'disabled'}`, 'success');
      onPlanUpdated();
    } catch {
      setAutoAi(!val);
      onShowToast('Failed to update Auto AI setting', 'error');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteUserAccount();
      setShowDeleteConfirm(false);
      onShowToast('Account successfully deleted');
      await logout();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      onShowToast(msg, 'error');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSaveBackendUrl = async () => {
    if (!__DEV__) {
      onShowToast('Server URL cannot be modified in production', 'error');
      return;
    }
    if (!backendUrl.trim()) return;
    setSavingUrl(true);
    try {
      await setActiveApiBaseUrl(backendUrl.trim());
      onShowToast('Backend URL updated', 'success');
      onPlanUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save URL';
      onShowToast(msg, 'error');
    } finally {
      setSavingUrl(false);
    }
  };

  const handleResetBackendUrl = async () => {
    if (!__DEV__) return;
    await resetActiveApiBaseUrl();
    const defaultUrl = await getActiveApiBaseUrl();
    setBackendUrl(defaultUrl);
    onShowToast('Reset to default backend URL', 'success');
    onPlanUpdated();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <Text
          style={[
            styles.screenTitle,
            {
              color: colors.textHeading,
              fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
            },
          ]}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Subscription & Credits with Subscribe Button */}
        <View
          style={[
            styles.sectionBox,
            {
              backgroundColor: colors.card,
              borderColor: isDark
                ? 'rgba(200, 142, 62, 0.3)'
                : 'rgba(181, 129, 76, 0.28)',
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.planTitleWrap}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={[styles.sectionHeading, { color: colors.textHeading }]}>
                Subscription & Credits
              </Text>
            </View>
            <View
              style={[
                styles.planBadge,
                {
                  backgroundColor: planInfo?.is_paid
                    ? colors.primary
                    : isDark
                      ? 'rgba(200, 142, 62, 0.15)'
                      : 'rgba(181, 129, 76, 0.12)',
                },
              ]}
            >
              <Text
                style={[
                  styles.planBadgeText,
                  {
                    color: planInfo?.is_paid ? '#FFFFFF' : colors.primary,
                  },
                ]}
              >
                {planInfo?.is_paid ? 'PRO' : 'FREE TIER'}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.planStatsRow}>
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.primary }]}>
                {planInfo?.credits_remaining ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Remaining
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.textHeading }]}>
                {planInfo?.credits_limit ?? 6}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Total Limit
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.textHeading }]}>
                {planInfo?.is_paid ? 'Priority' : 'Weekly'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Reset Cycle
              </Text>
            </View>
          </View>

          {/* Subscribe / Upgrade Button */}
          <TouchableOpacity
            onPress={() => setShowSubscribeInfo(true)}
            style={[
              styles.subscribeBtn,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
            activeOpacity={0.85}
            accessibilityLabel="Subscribe to Mindspace Pro"
            accessibilityRole="button"
          >
            <Sparkles size={16} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.subscribeBtnText}>
              {planInfo?.is_paid ? 'Manage Pro Plan' : 'Subscribe to Pro'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Auto AI Context Switch */}
        <View
          style={[
            styles.sectionBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.switchRow}>
            <View style={styles.switchIconWrap}>
              <Bot size={18} color={colors.primary} />
            </View>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchTitle, { color: colors.textHeading }]}>
                Auto AI Context
              </Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>
                Generate AI tags, summaries, and categorization on bookmark creation
              </Text>
            </View>
            {updatingSettings ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={autoAi}
                onValueChange={handleToggleAutoAi}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            )}
          </View>
        </View>

        {/* 3. Dark Mode Switch */}
        <View
          style={[
            styles.sectionBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.switchRow}>
            <View style={styles.switchIconWrap}>
              <Moon size={18} color={colors.primary} />
            </View>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchTitle, { color: colors.textHeading }]}>
                Dark Appearance
              </Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>
                Toggle between dark and light themes
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Collapsible Advanced Server Configuration */}
        <View
          style={[
            styles.sectionBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setShowAdvanced((prev) => !prev)}
            style={styles.advancedToggleRow}
            activeOpacity={0.7}
          >
            <View style={styles.titleWithIcon}>
              <Server size={15} color={colors.textMuted} />
              <Text style={[styles.advancedHeading, { color: colors.textMuted }]}>
                Advanced Server Settings
              </Text>
            </View>
            {showAdvanced ? (
              <ChevronUp size={16} color={colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={colors.textMuted} />
            )}
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.advancedContent}>
              <Text style={[styles.serverNote, { color: colors.textMuted }]}>
                Node Backend URL
              </Text>
              <View
                style={[
                  styles.urlInputRow,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.urlInput,
                    { color: colors.textHeading, opacity: __DEV__ ? 1 : 0.6 },
                  ]}
                  value={__DEV__ ? backendUrl : DEFAULT_PRODUCTION_API_URL}
                  onChangeText={setBackendUrl}
                  editable={__DEV__}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="http://localhost:3000/api/v1"
                  placeholderTextColor={colors.textMuted}
                />
                {__DEV__ && (
                  <TouchableOpacity
                    onPress={handleSaveBackendUrl}
                    style={[styles.saveUrlBtn, { backgroundColor: colors.primary }]}
                    disabled={savingUrl}
                  >
                    {savingUrl ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Check size={14} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {__DEV__ ? (
                <View style={styles.presetButtonsRow}>
                  <TouchableOpacity
                    onPress={() => setBackendUrl(DEFAULT_LOCAL_API_URL)}
                    style={[styles.presetBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.presetBtnText, { color: colors.textMuted }]}>
                      Local
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setBackendUrl(DEFAULT_PRODUCTION_API_URL)}
                    style={[styles.presetBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.presetBtnText, { color: colors.textMuted }]}>
                      Production
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleResetBackendUrl}
                    style={[styles.presetBtn, { borderColor: colors.border }]}
                  >
                    <RefreshCw size={11} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.presetBtnText, { color: colors.textMuted }]}>
                      Reset
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.serverNote, { color: colors.textMuted, marginTop: 4 }]}>
                  Locked to hardened production server origin
                </Text>
              )}
            </View>
          )}
        </View>

        {/* 4. Delete Account (Not attractive as sign out, subtle/understated) */}
        <View style={styles.deleteAccountSection}>
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            style={styles.subtleDeleteBtn}
            activeOpacity={0.6}
            accessibilityLabel="Delete Account"
            accessibilityRole="button"
          >
            <Trash2 size={13} color={colors.textMuted} />
            <Text style={[styles.subtleDeleteText, { color: colors.textMuted }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Subscribe Plan Info Modal */}
      <Modal
        visible={showSubscribeInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubscribeInfo(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSubscribeInfo(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.subscribeCard,
                  {
                    backgroundColor: colors.modal,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.subModalHeader, { borderBottomColor: colors.borderLight }]}>
                  <View style={styles.titleWithIcon}>
                    <Sparkles size={18} color={colors.primary} />
                    <Text style={[styles.title, { color: colors.textHeading }]}>
                      Mindspace Pro
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowSubscribeInfo(false)}
                    style={styles.closeBtn}
                  >
                    <X size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.subscribeModalBody}>
                  <Text style={[styles.proFeatureTitle, { color: colors.textHeading }]}>
                    Unlock Full Intelligence
                  </Text>
                  <View style={styles.proFeatureList}>
                    <Text style={[styles.proFeatureItem, { color: colors.textBody }]}>
                      ✨ Unlimited AI visual analyses & summaries
                    </Text>
                    <Text style={[styles.proFeatureItem, { color: colors.textBody }]}>
                      ⚡ Priority OCR entity extraction for screenshots
                    </Text>
                    <Text style={[styles.proFeatureItem, { color: colors.textBody }]}>
                      📖 Clean Reader Mode with distraction-free articles
                    </Text>
                    <Text style={[styles.proFeatureItem, { color: colors.textBody }]}>
                      🏷️ Automatic platform tags and deep multi-tag search
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setShowSubscribeInfo(false);
                      onShowToast('Pro subscriptions opening soon! Enjoy free credits.');
                    }}
                    style={[styles.proCtaBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.proCtaBtnText}>Get Mindspace Pro</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDeleteConfirm(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.confirmCard,
                  {
                    backgroundColor: colors.modal,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.confirmTitle, { color: colors.textHeading }]}>
                  Delete Account?
                </Text>
                <Text style={[styles.confirmSubtitle, { color: colors.textMuted }]}>
                  This will permanently delete your account, bookmarks, and AI summaries. This action cannot be undone.
                </Text>

                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    onPress={() => setShowDeleteConfirm(false)}
                    style={[styles.confirmCancelBtn, { borderColor: colors.border }]}
                    disabled={deletingAccount}
                  >
                    <Text style={[styles.confirmCancelText, { color: colors.textHeading }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDeleteAccount}
                    style={[
                      styles.confirmDeleteBtn,
                      { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.85)' : '#DC2626' },
                    ]}
                    disabled={deletingAccount}
                  >
                    {deletingAccount ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmDeleteText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 36,
  },
  sectionBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  planTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    marginBottom: 14,
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchInfo: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  switchSub: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  advancedToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 4,
  },
  advancedHeading: {
    fontSize: 13,
    fontWeight: '600',
  },
  advancedContent: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  serverNote: {
    fontSize: 11,
    marginBottom: 8,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  urlInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12.5,
  },
  saveUrlBtn: {
    padding: 6,
    borderRadius: 6,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '500',
  },
  deleteAccountSection: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  subtleDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subtleDeleteText: {
    fontSize: 12,
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  subscribeCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  subModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  subscribeModalBody: {
    padding: 20,
    gap: 14,
  },
  proFeatureTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  proFeatureList: {
    gap: 8,
  },
  proFeatureItem: {
    fontSize: 13,
    lineHeight: 18,
  },
  proCtaBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  proCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  confirmSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  confirmCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmDeleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
