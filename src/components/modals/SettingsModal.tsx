import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  Sparkles,
  Server,
  LogOut,
  X,
  Check,
  RefreshCw,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { updateUserSettings } from '../../services/api';
import {
  getActiveApiBaseUrl,
  setActiveApiBaseUrl,
  resetActiveApiBaseUrl,
  DEFAULT_LOCAL_API_URL,
  DEFAULT_PRODUCTION_API_URL,
} from '../../constants/config';
import type { UserPlanInfo } from '../../types/bookmark';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  planInfo: UserPlanInfo | null;
  onPlanUpdated: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  planInfo,
  onPlanUpdated,
  onShowToast,
}) => {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();

  const [autoAi, setAutoAi] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const [backendUrl, setBackendUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    if (planInfo) {
      setAutoAi(planInfo.auto_ai_context);
    }
  }, [planInfo]);

  useEffect(() => {
    if (visible) {
      getActiveApiBaseUrl().then((url) => setBackendUrl(url));
    }
  }, [visible]);

  const handleToggleAutoAi = async (val: boolean) => {
    setAutoAi(val);
    setUpdatingSettings(true);
    try {
      await updateUserSettings({ auto_ai_context: val });
      onShowToast(`Auto AI Context ${val ? 'enabled' : 'disabled'}`, 'success');
      onPlanUpdated();
    } catch {
      setAutoAi(!val);
      onShowToast('Failed to update setting', 'error');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleSaveBackendUrl = async () => {
    if (!backendUrl.trim()) return;
    setSavingUrl(true);
    try {
      await setActiveApiBaseUrl(backendUrl.trim());
      onShowToast('Backend URL updated', 'success');
      onPlanUpdated();
    } catch {
      onShowToast('Failed to save URL', 'error');
    } finally {
      setSavingUrl(false);
    }
  };

  const handleResetBackendUrl = async () => {
    await resetActiveApiBaseUrl();
    const defaultUrl = await getActiveApiBaseUrl();
    setBackendUrl(defaultUrl);
    onShowToast('Reset to default backend URL', 'success');
    onPlanUpdated();
  };

  const handleSignOut = async () => {
    onClose();
    await logout();
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
                <Text style={[styles.title, { color: colors.textHeading }]}>
                  Settings & Account
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
              >
                {/* User Profile */}
                <View
                  style={[
                    styles.sectionBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.profileRow}>
                    <View
                      style={[
                        styles.avatarBadge,
                        {
                          backgroundColor: colors.accentBg,
                        },
                      ]}
                    >
                      <User size={20} color={colors.primary} />
                    </View>
                    <View style={styles.profileText}>
                      <Text style={[styles.userName, { color: colors.textHeading }]}>
                        {user?.name || 'Mindspace User'}
                      </Text>
                      <Text style={[styles.userEmail, { color: colors.textMuted }]}>
                        {user?.email || 'Logged in'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Plan & Credits */}
                {planInfo && (
                  <View
                    style={[
                      styles.sectionBox,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.sectionHeaderRow}>
                      <Sparkles size={16} color={colors.primary} />
                      <Text style={[styles.sectionHeading, { color: colors.textHeading }]}>
                        Subscription & Credits
                      </Text>
                    </View>
                    <View style={styles.planStatsRow}>
                      <View style={styles.statCol}>
                        <Text style={[styles.statVal, { color: colors.textHeading }]}>
                          {planInfo.is_paid ? 'PRO' : 'FREE'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Plan</Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={[styles.statVal, { color: colors.primary }]}>
                          {planInfo.credits_remaining ?? 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Remaining</Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={[styles.statVal, { color: colors.textHeading }]}>
                          {planInfo.credits_limit ?? 50}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Monthly Limit</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Preference: Auto AI */}
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
                    <View style={styles.switchInfo}>
                      <Text style={[styles.switchTitle, { color: colors.textHeading }]}>
                        Auto AI Context
                      </Text>
                      <Text style={[styles.switchSub, { color: colors.textMuted }]}>
                        Generate AI metadata automatically when adding bookmarks
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

                {/* Backend URL Server Configuration */}
                <View
                  style={[
                    styles.sectionBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.sectionHeaderRow}>
                    <Server size={16} color={colors.primary} />
                    <Text style={[styles.sectionHeading, { color: colors.textHeading }]}>
                      Backend Node Server URL
                    </Text>
                  </View>
                  <Text style={[styles.serverNote, { color: colors.textMuted }]}>
                    All requests route strictly through the Node backend. No direct Supabase connection.
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
                      style={[styles.urlInput, { color: colors.textHeading }]}
                      value={backendUrl}
                      onChangeText={setBackendUrl}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="http://localhost:3000/api/v1"
                      placeholderTextColor={colors.textMuted}
                    />
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
                  </View>

                  {/* Preset quick buttons */}
                  <View style={styles.presetButtonsRow}>
                    <TouchableOpacity
                      onPress={() => setBackendUrl(DEFAULT_LOCAL_API_URL)}
                      style={[styles.presetBtn, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.presetBtnText, { color: colors.textMuted }]}>
                        Default Local
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
                </View>

                {/* Sign Out Button */}
                <TouchableOpacity
                  onPress={handleSignOut}
                  style={[
                    styles.signOutBtn,
                    {
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                    },
                  ]}
                >
                  <LogOut size={16} color={colors.error} />
                  <Text style={[styles.signOutText, { color: colors.error }]}>
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  sectionBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  planStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 12,
    marginTop: 2,
  },
  serverNote: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 42,
  },
  urlInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Menlo',
  },
  saveUrlBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  signOutText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
});
