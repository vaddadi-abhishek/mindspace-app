import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Check,
  ShieldCheck,
  Sparkles,
  Bot,
  Moon,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Pencil,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  updateUserProfile,
  changeUserPassword,
  verifyCurrentPassword,
  updateUserSettings,
  deleteUserAccount,
} from '../services/api';
import type { UserPlanInfo } from '../types/bookmark';

interface ProfileScreenProps {
  onShowToast: (message: string, type?: 'success' | 'error') => void;
  planInfo?: UserPlanInfo | null;
  onPlanUpdated?: () => void;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onShowToast,
  planInfo = null,
  onPlanUpdated,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, setUser, logout } = useAuth();

  // Navigation view: 'main' | 'accountDetails'
  const [currentView, setCurrentView] = useState<'main' | 'accountDetails'>('main');

  // Account details state (subscreen)
  const [usernameInput, setUsernameInput] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const usernameInputRef = useRef<TextInput | null>(null);

  const currentSavedUsername = user?.name || user?.email?.split('@')[0] || '';
  const isUsernameChanged =
    usernameInput.trim() !== currentSavedUsername &&
    usernameInput.trim().length >= 2;

  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Settings: Auto AI Context
  const [autoAi, setAutoAi] = useState<boolean>(() => Boolean(planInfo?.auto_ai_context));

  // Settings: Subscribe dialog
  const [showSubscribeInfo, setShowSubscribeInfo] = useState(false);

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Sign out confirmation / state
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (planInfo?.auto_ai_context !== undefined) {
      setAutoAi(Boolean(planInfo.auto_ai_context));
    }
  }, [planInfo?.auto_ai_context]);

  useEffect(() => {
    if (user?.name) {
      setUsernameInput(user.name);
    } else if (user?.email) {
      setUsernameInput(user.email.split('@')[0]);
    }
  }, [user]);

  const handleOpenAccountDetails = () => {
    setUsernameInput(currentSavedUsername);
    setIsEditingUsername(false);
    setCurrentView('accountDetails');
  };

  const handleCancelEditUsername = () => {
    setUsernameInput(currentSavedUsername);
    setIsEditingUsername(false);
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
      onShowToast('Username updated successfully!', 'success');
      setIsEditingUsername(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update username';
      onShowToast(msg, 'error');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      onShowToast('Please enter your current password', 'error');
      return;
    }

    if (!newPassword) {
      onShowToast('Please enter a new password', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      onShowToast('New password must be different from current password', 'error');
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
      if (user?.email) {
        const isCurrentValid = await verifyCurrentPassword(user.email, currentPassword);
        if (!isCurrentValid) {
          onShowToast('Current password is incorrect', 'error');
          setSavingPassword(false);
          return;
        }
      }

      await changeUserPassword(newPassword, currentPassword);
      onShowToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setShowPasswordSection(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      onShowToast(msg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // Immediate optimistic toggle — no loader
  const handleToggleAutoAi = (val: boolean) => {
    setAutoAi(val);
    updateUserSettings({ auto_ai_context: val })
      .then(() => {
        onPlanUpdated?.();
      })
      .catch(() => {
        setAutoAi(!val);
        onShowToast('Failed to update Auto AI setting', 'error');
      });
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

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      setShowSignOutConfirm(false);
      await logout();
    } catch {
      onShowToast('Failed to sign out', 'error');
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Mindspace User';
  const initial = displayName.charAt(0).toUpperCase();

  // =========================================================================
  // SINGLE PERSISTENT PROFILE SCREEN CONTAINER
  // Keeps all switches, inputs and views mounted so there is zero flicker
  // and zero toggle animation when navigating between views or tabs.
  // =========================================================================
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ===================================================================== */}
      {/* VIEW 2: ACCOUNT DETAILS SUB-SCREEN                                    */}
      {/* (Non-editable Email, Editable Username, Delete Account)               */}
      {/* ===================================================================== */}
      <View
        style={[
          styles.container,
          { display: currentView === 'accountDetails' ? 'flex' : 'none' },
        ]}
      >
        {/* Sub-screen Top Bar with Back Button */}
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => setCurrentView('main')}
              style={styles.backBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back to Profile"
              accessibilityRole="button"
            >
              <ChevronLeft size={22} color={colors.primary} />
              <Text style={[styles.backBtnText, { color: colors.primary }]}>
                Profile
              </Text>
            </TouchableOpacity>

            <Text
              style={[
                styles.screenTitleCompact,
                {
                  color: colors.textHeading,
                  fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
                },
              ]}
            >
              Account Details
            </Text>

            <View style={{ width: 44 }} />
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: 130 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Banner */}
          <View
            style={[
              styles.accountAvatarCard,
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
            <View style={[styles.avatarCircleLarge, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitialLarge}>{initial}</Text>
            </View>
            <Text style={[styles.accountAvatarName, { color: colors.textHeading }]}>
              {displayName}
            </Text>
            <Text style={[styles.accountAvatarEmail, { color: colors.textMuted }]}>
              {user?.email || 'user@mindspace.app'}
            </Text>
          </View>

          {/* 1. Non-editable Email */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.fieldHeaderRow}>
              <Text style={[styles.fieldTitle, { color: colors.textHeading }]}>
                Email Address
              </Text>
              <View style={styles.readOnlyBadge}>
                <Lock size={11} color={colors.textMuted} />
              </View>
            </View>

            <View
              style={[
                styles.readOnlyInputWrap,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Mail size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.readOnlyInputText, { color: colors.textMuted }]}
                value={user?.email || 'user@mindspace.app'}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
            <Text style={[styles.fieldHelpText, { color: colors.textMuted }]}>
              Your email cannot be changed.
            </Text>
          </View>

          {/* 2. Editable Username (with pencil icon and Save/Cancel buttons) */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.fieldTitle, { color: colors.textHeading }]}>
              Username
            </Text>

            <View
              style={[
                styles.inputFieldWrap,
                {
                  backgroundColor: isEditingUsername
                    ? colors.inputBg
                    : isDark
                      ? 'rgba(0, 0, 0, 0.25)'
                      : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isEditingUsername ? colors.primary : colors.borderLight,
                },
              ]}
            >
              <User
                size={16}
                color={isEditingUsername ? colors.primary : colors.textMuted}
              />
              <TextInput
                ref={usernameInputRef}
                style={[
                  styles.inputFieldText,
                  { color: isEditingUsername ? colors.textHeading : colors.textMuted },
                ]}
                value={usernameInput}
                onChangeText={setUsernameInput}
                editable={isEditingUsername}
                selectTextOnFocus={isEditingUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your username"
                placeholderTextColor={colors.textMuted}
              />
              {!isEditingUsername && (
                <TouchableOpacity
                  onPress={() => {
                    setIsEditingUsername(true);
                    setTimeout(() => usernameInputRef.current?.focus(), 60);
                  }}
                  style={styles.pencilBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Edit username"
                  accessibilityRole="button"
                >
                  <Pencil size={15} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {isEditingUsername && (
              <View style={styles.editBtnRow}>
                <TouchableOpacity
                  onPress={handleCancelEditUsername}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  disabled={savingUsername}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveUsername}
                  disabled={!isUsernameChanged || savingUsername}
                  style={[
                    styles.saveBtn,
                    {
                      backgroundColor: isUsernameChanged
                        ? colors.primary
                        : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                      borderColor: isUsernameChanged
                        ? colors.primary
                        : colors.borderLight,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  {savingUsername ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.saveBtnText,
                        {
                          color: isUsernameChanged
                            ? '#FFFFFF'
                            : colors.textMuted,
                          fontWeight: isUsernameChanged ? '700' : '500',
                        },
                      ]}
                    >
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 3. Delete Account (Gray, No Border, No Icon) */}
          <View style={styles.subtleDeleteContainer}>
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(true)}
              style={styles.subtleDeleteBtn}
              activeOpacity={0.6}
              accessibilityLabel="Delete Account"
              accessibilityRole="button"
            >
              <Text style={[styles.subtleDeleteText, { color: colors.textMuted }]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDeleteConfirm(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.deleteModalCard,
                    {
                      backgroundColor: colors.modal,
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    },
                  ]}
                >
                  <View style={styles.deleteModalHeader}>
                    <View style={styles.dangerIconWrap}>
                      <Trash2 size={20} color={colors.error} />
                    </View>
                    <Text style={[styles.deleteModalTitle, { color: colors.textHeading }]}>
                      Delete Account
                    </Text>
                  </View>

                  <Text style={[styles.deleteModalText, { color: colors.textBody }]}>
                    This action is permanent and cannot be undone. All your saved bookmarks, AI contexts, and preferences will be permanently wiped.
                  </Text>

                  <View style={styles.deleteModalBtnRow}>
                    <TouchableOpacity
                      onPress={() => setShowDeleteConfirm(false)}
                      style={[styles.deleteCancelBtn, { borderColor: colors.border }]}
                      disabled={deletingAccount}
                    >
                      <Text style={[styles.deleteCancelBtnText, { color: colors.textHeading }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleDeleteAccount}
                      style={[styles.deleteConfirmBtn, { backgroundColor: colors.error }]}
                      disabled={deletingAccount}
                    >
                      {deletingAccount ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.deleteConfirmBtnText}>Delete Forever</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>

      {/* ===================================================================== */}
      {/* VIEW 1: SINGLE PROFILE SCREEN                                         */}
      {/* Order:                                                                */}
      {/* 1. Username & Email (clickable -> opens Account Details)             */}
      {/* 2. Subscription and Tokens                                            */}
      {/* 3. Auto AI Context (immediate toggle, NO loader)                      */}
      {/* 4. Dark Mode toggle (immediate toggle, NO loader)                     */}
      {/* 5. Password and Security                                              */}
      {/* 6. Sign Out                                                           */}
      {/* ===================================================================== */}
      <View
        style={[
          styles.container,
          { display: currentView === 'main' ? 'flex' : 'none' },
        ]}
      >
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.screenTitle,
              {
                color: colors.textHeading,
                fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
              },
            ]}
          >
            Profile
          </Text>

          {/* Plan Chip */}
          <View
            style={[
              styles.planHeaderChip,
              {
                backgroundColor: planInfo?.is_paid
                  ? colors.primary
                  : isDark
                    ? 'rgba(200, 142, 62, 0.15)'
                    : 'rgba(181, 129, 76, 0.12)',
              },
            ]}
          >
            <Sparkles size={11} color={planInfo?.is_paid ? '#FFFFFF' : colors.primary} />
            <Text
              style={[
                styles.planHeaderChipText,
                { color: planInfo?.is_paid ? '#FFFFFF' : colors.primary },
              ]}
            >
              {planInfo?.is_paid ? 'PRO' : `${planInfo?.credits_remaining ?? 0} tokens`}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* 1. USERNAME AND EMAIL (Clickable -> opens Account Details subscreen) */}
        {/* ================================================================= */}
        <TouchableOpacity
          onPress={handleOpenAccountDetails}
          activeOpacity={0.75}
          style={[
            styles.bannerCard,
            styles.clickableBanner,
            {
              backgroundColor: isDark
                ? 'rgba(38, 33, 28, 0.7)'
                : 'rgba(247, 244, 239, 0.95)',
              borderColor: isDark
                ? 'rgba(200, 142, 62, 0.25)'
                : 'rgba(181, 129, 76, 0.22)',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Manage Username, Email, and Account"
        >
          <View style={styles.bannerRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
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

            <View style={styles.bannerActionWrap}>
              <ChevronRight size={18} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* ================================================================= */}
        {/* 2. SUBSCRIPTION AND TOKENS                                        */}
        {/* ================================================================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: isDark
                ? 'rgba(200, 142, 62, 0.3)'
                : 'rgba(181, 129, 76, 0.28)',
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.titleWithIcon}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textHeading }]}>
                Subscription and Tokens
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
                  { color: planInfo?.is_paid ? '#FFFFFF' : colors.primary },
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
                Tokens Remaining
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

          {/* Subscribe / Manage Button */}
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

        {/* ================================================================= */}
        {/* 3. AUTO AI CONTEXT (Instant Toggle, Zero Loader)                  */}
        {/* ================================================================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.switchRow}>
            <View style={[styles.switchIconWrap, { backgroundColor: isDark ? 'rgba(200, 142, 62, 0.12)' : 'rgba(181, 129, 76, 0.10)' }]}>
              <Bot size={18} color={colors.primary} />
            </View>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchTitle, { color: colors.textHeading }]}>
                Auto AI Context
              </Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>
                Automatically generate tags and summaries on bookmark creation
              </Text>
            </View>
            <Switch
              value={autoAi}
              onValueChange={handleToggleAutoAi}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ================================================================= */}
        {/* 4. DARK MODE TOGGLE (Instant Toggle, Zero Loader)                 */}
        {/* ================================================================= */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.switchRow}>
            <View style={[styles.switchIconWrap, { backgroundColor: isDark ? 'rgba(200, 142, 62, 0.12)' : 'rgba(181, 129, 76, 0.10)' }]}>
              <Moon size={18} color={colors.primary} />
            </View>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchTitle, { color: colors.textHeading }]}>
                Dark Mode
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

        {/* ================================================================= */}
        {/* 5. PASSWORD AND SECURITY                                          */}
        {/* ================================================================= */}
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
              <Lock size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textHeading }]}>
                Password and Security
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowPasswordSection((prev) => {
                  if (prev) {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                  }
                  return !prev;
                });
              }}
              style={styles.editActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.editActionText, { color: colors.primary }]}>
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPasswordSection ? (
            <View style={styles.passwordForm}>
              {/* Current Password Field */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Current Password
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
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={16} color={colors.textMuted} />
                  ) : (
                    <Eye size={16} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              {/* New Password Field */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>
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

              <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>
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
                  Must include uppercase, lowercase, and a number (8+ chars)
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleChangePassword}
                style={[
                  styles.updatePasswordBtn,
                  { backgroundColor: colors.primary },
                ]}
                disabled={savingPassword}
                activeOpacity={0.8}
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
              Your account password is encrypted and secured. Update it anytime to maintain account protection.
            </Text>
          )}
        </View>

        {/* ================================================================= */}
        {/* 6. SIGN OUT                                                       */}
        {/* ================================================================= */}
        <TouchableOpacity
          onPress={() => setShowSignOutConfirm(true)}
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

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSignOutConfirm(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.deleteModalCard,
                  {
                    backgroundColor: colors.modal,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.deleteModalHeader}>
                  <View style={[styles.dangerIconWrap, { backgroundColor: isDark ? 'rgba(200, 142, 62, 0.15)' : 'rgba(181, 129, 76, 0.12)' }]}>
                    <LogOut size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.deleteModalTitle, { color: colors.textHeading }]}>
                    Sign Out
                  </Text>
                </View>

                <Text style={[styles.deleteModalText, { color: colors.textBody }]}>
                  Are you sure you want to sign out of Mindspace? You will need to sign back in with your email and password.
                </Text>

                <View style={styles.deleteModalBtnRow}>
                  <TouchableOpacity
                    onPress={() => setShowSignOutConfirm(false)}
                    style={[styles.deleteCancelBtn, { borderColor: colors.border }]}
                    disabled={signingOut}
                  >
                    <Text style={[styles.deleteCancelBtnText, { color: colors.textHeading }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSignOut}
                    style={[styles.deleteConfirmBtn, { backgroundColor: colors.primary }]}
                    disabled={signingOut}
                  >
                    {signingOut ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.deleteConfirmBtnText}>Sign Out</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Subscribe Plan Info Modal */}
      <Modal
        visible={showSubscribeInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubscribeInfo(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSubscribeInfo(false)}>
          <View style={styles.modalBackdrop}>
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
                    <Text style={[styles.modalTitle, { color: colors.textHeading }]}>
                      Mindspace Pro
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowSubscribeInfo(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.subModalBody}>
                  <Text style={[styles.subModalDesc, { color: colors.textBody }]}>
                    Supercharge your mind with unlimited AI contexts, priority entity extraction, and intelligent full-text reader modes.
                  </Text>

                  <View style={styles.featureList}>
                    {[
                      'Unlimited AI Context Generations',
                      'Deep article reader mode & clean summaries',
                      'Cross-device sync & browser extension access',
                      'Direct Priority AI model execution',
                    ].map((feature, i) => (
                      <View key={i} style={styles.featureItem}>
                        <Check size={14} color={colors.primary} strokeWidth={2.5} />
                        <Text style={[styles.featureText, { color: colors.textBody }]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.proActionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setShowSubscribeInfo(false);
                      onShowToast('Subscription billing handled via web dashboard', 'success');
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.proActionBtnText}>Upgrade for $9.99 / month</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  screenTitleCompact: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  planHeaderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
  },
  planHeaderChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 14,
  },
  // Clickable Username & Email Card
  bannerCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.2,
  },
  clickableBanner: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  bannerInfo: {
    flex: 1,
    gap: 3,
  },
  bannerName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  bannerEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bannerEmail: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  bannerActionWrap: {
    paddingLeft: 8,
  },
  // Account Details Sub-screen Avatar
  accountAvatarCard: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  avatarCircleLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarInitialLarge: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  accountAvatarName: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  accountAvatarEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Section Cards
  sectionCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  planBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  planBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  planStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    marginBottom: 12,
  },
  statCol: {
    alignItems: 'center',
    gap: 3,
  },
  statVal: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Switches
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchInfo: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  switchSub: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  // Password & Security
  securitySubtext: {
    fontSize: 12,
    lineHeight: 17,
  },
  editActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  passwordForm: {
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    height: 42,
    fontSize: 13.5,
  },
  eyeBtn: {
    padding: 6,
  },
  passwordRequirements: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 14,
  },
  requirementText: {
    fontSize: 11,
  },
  updatePasswordBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  updatePasswordBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Sign Out Button
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1.2,
    marginTop: 6,
  },
  signOutText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  // Sub-screen Input Fields
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readOnlyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  readOnlyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  readOnlyInputText: {
    flex: 1,
    fontSize: 13.5,
  },
  fieldHelpText: {
    fontSize: 11.5,
    marginTop: 6,
    lineHeight: 15,
  },
  inputFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  inputFieldText: {
    flex: 1,
    fontSize: 14,
  },
  pencilBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  cancelBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
  },
  // Sub-screen Delete Account (Subtle Gray, No Border, No Icon)
  subtleDeleteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginTop: 8,
  },
  subtleDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtleDeleteText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  subscribeCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  subModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  subModalBody: {
    padding: 18,
    gap: 14,
  },
  subModalDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  featureList: {
    gap: 10,
    paddingVertical: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 12.5,
    flex: 1,
  },
  proActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  proActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 20,
    gap: 12,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dangerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  deleteModalText: {
    fontSize: 13,
    lineHeight: 18,
  },
  deleteModalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  deleteCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  deleteConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
