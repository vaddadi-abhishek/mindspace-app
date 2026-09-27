import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  User,
  Mail,
  Edit3,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  X,
  Check,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, changeUserPassword } from '../../services/api';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  onShowToast,
}) => {
  const { colors, isDark } = useTheme();
  const { user, setUser, logout } = useAuth();

  // Username edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Sign out state
  const [signingOut, setSigningOut] = useState(false);

  const startEditUsername = () => {
    setUsernameInput(user?.name || '');
    setIsEditingUsername(true);
  };

  const cancelEditUsername = () => {
    setIsEditingUsername(false);
    setUsernameInput('');
  };

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed || trimmed.length < 2) {
      onShowToast('Username must be at least 2 characters', 'error');
      return;
    }
    setSavingUsername(true);
    try {
      const res = await updateUserProfile(trimmed);
      if (res.user) {
        setUser((prev) => (prev ? { ...prev, name: trimmed } : res.user));
      }
      setIsEditingUsername(false);
      onShowToast('Username updated successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update username';
      onShowToast(msg, 'error');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      onShowToast('Please enter a new password', 'error');
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      onShowToast(
        'Password must be 8+ chars with uppercase, lowercase, and a number',
        'error'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      onShowToast('Passwords do not match', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await changeUserPassword(newPassword);
      onShowToast('Password updated successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      onShowToast(msg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      onClose();
      await logout();
    } catch {
      onShowToast('Failed to sign out', 'error');
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Mindspace User';
  const initial = displayName.charAt(0).toUpperCase();

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
                <View style={styles.headerTitleRow}>
                  <User size={18} color={colors.primary} />
                  <Text style={[styles.title, { color: colors.textHeading }]}>
                    Profile
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close profile modal"
                >
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. Name & Email Banner */}
                <View
                  style={[
                    styles.bannerCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(38, 33, 28, 0.7)'
                        : 'rgba(247, 244, 239, 0.95)',
                      borderColor: isDark
                        ? 'rgba(200, 142, 62, 0.25)'
                        : 'rgba(181, 129, 76, 0.22)',
                    },
                  ]}
                >
                  <View style={styles.bannerRow}>
                    <View
                      style={[
                        styles.avatarCircle,
                        {
                          backgroundColor: colors.primary,
                        },
                      ]}
                    >
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    </View>

                    <View style={styles.bannerInfo}>
                      <Text
                        style={[
                          styles.bannerName,
                          {
                            color: colors.textHeading,
                            fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {displayName}
                      </Text>
                      <View style={styles.bannerEmailRow}>
                        <Mail size={13} color={colors.textMuted} />
                        <Text
                          style={[styles.bannerEmail, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          {user?.email || 'user@mindspace.app'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 2. Editable Username Section */}
                <View
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textHeading }]}>
                      Username
                    </Text>
                    {!isEditingUsername && (
                      <TouchableOpacity
                        onPress={startEditUsername}
                        style={styles.editActionBtn}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Edit3 size={14} color={colors.primary} />
                        <Text style={[styles.editActionText, { color: colors.primary }]}>
                          Edit
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {isEditingUsername ? (
                    <View style={styles.editUsernameWrap}>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.primary,
                            color: colors.textHeading,
                          },
                        ]}
                        value={usernameInput}
                        onChangeText={setUsernameInput}
                        autoFocus
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Enter username"
                        placeholderTextColor={colors.textMuted}
                      />
                      <View style={styles.editBtnRow}>
                        <TouchableOpacity
                          onPress={cancelEditUsername}
                          style={[styles.smallBtn, { borderColor: colors.border }]}
                          disabled={savingUsername}
                        >
                          <Text style={[styles.smallBtnText, { color: colors.textMuted }]}>
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleSaveUsername}
                          style={[styles.smallBtn, { backgroundColor: colors.primary }]}
                          disabled={savingUsername}
                        >
                          {savingUsername ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Check size={14} color="#FFFFFF" strokeWidth={2.4} />
                              <Text style={[styles.smallBtnText, { color: '#FFFFFF' }]}>
                                Save
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.currentUsername, { color: colors.textBody }]}>
                      @{user?.name || user?.email?.split('@')[0] || 'username'}
                    </Text>
                  )}
                </View>

                {/* 3. Change Password Options */}
                <View
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <View style={styles.titleWithIcon}>
                      <Lock size={15} color={colors.primary} />
                      <Text style={[styles.sectionTitle, { color: colors.textHeading }]}>
                        Password & Security
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowPasswordSection((prev) => !prev)}
                      style={styles.editActionBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={[styles.editActionText, { color: colors.primary }]}>
                        {showPasswordSection ? 'Cancel' : 'Change Password'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showPasswordSection ? (
                    <View style={styles.passwordForm}>
                      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                        New Password
                      </Text>
                      <View
                        style={[
                          styles.passwordInputWrap,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <TextInput
                          style={[styles.passwordInput, { color: colors.textHeading }]}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showNewPassword}
                          placeholder="At least 8 characters"
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPassword((prev) => !prev)}
                          style={styles.eyeBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          {showNewPassword ? (
                            <EyeOff size={16} color={colors.textMuted} />
                          ) : (
                            <Eye size={16} color={colors.textMuted} />
                          )}
                        </TouchableOpacity>
                      </View>

                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: colors.textMuted, marginTop: 12 },
                        ]}
                      >
                        Confirm Password
                      </Text>
                      <View
                        style={[
                          styles.passwordInputWrap,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <TextInput
                          style={[styles.passwordInput, { color: colors.textHeading }]}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          placeholder="Re-enter new password"
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword((prev) => !prev)}
                          style={styles.eyeBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} color={colors.textMuted} />
                          ) : (
                            <Eye size={16} color={colors.textMuted} />
                          )}
                        </TouchableOpacity>
                      </View>

                      <View style={styles.passwordRequirements}>
                        <ShieldCheck size={12} color={colors.primary} />
                        <Text style={[styles.requirementText, { color: colors.textMuted }]}>
                          Include uppercase, lowercase, and a number (8+ chars)
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={handleChangePassword}
                        style={[
                          styles.updatePasswordBtn,
                          { backgroundColor: colors.primary },
                        ]}
                        disabled={savingPassword}
                      >
                        {savingPassword ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.updatePasswordBtnText}>
                            Update Password
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={[styles.securitySubtext, { color: colors.textMuted }]}>
                      Your password is securely encrypted. Change it anytime to protect your account.
                    </Text>
                  )}
                </View>

                {/* 4. Sign Out (Prominent & Attractive) */}
                <TouchableOpacity
                  onPress={handleSignOut}
                  disabled={signingOut}
                  activeOpacity={0.8}
                  style={[
                    styles.signOutBtn,
                    {
                      borderColor: 'rgba(239, 68, 68, 0.45)',
                      backgroundColor: isDark
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(239, 68, 68, 0.08)',
                    },
                  ]}
                  accessibilityLabel="Sign out of account"
                  accessibilityRole="button"
                >
                  {signingOut ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <>
                      <LogOut size={18} color={colors.error} strokeWidth={2.2} />
                      <Text style={[styles.signOutText, { color: colors.error }]}>
                        Sign Out
                      </Text>
                    </>
                  )}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    padding: 20,
    gap: 16,
  },
  bannerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  bannerEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bannerEmail: {
    fontSize: 13,
    flexShrink: 1,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  editActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  currentUsername: {
    fontSize: 14,
    fontWeight: '500',
  },
  editUsernameWrap: {
    marginTop: 6,
    gap: 10,
  },
  inputField: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  editBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  securitySubtext: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  passwordForm: {
    marginTop: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  passwordRequirements: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    marginBottom: 14,
  },
  requirementText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  updatePasswordBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  updatePasswordBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
