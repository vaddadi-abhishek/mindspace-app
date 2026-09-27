import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Sparkles, KeyRound } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  forgotPassword,
  verifyOtpUser,
  resendOtpUser,
  EmailNotVerifiedError,
} from '../services/api';

export const AuthScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { login, signup, setUser, setIsLoggedIn } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // OTP Verification state
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(cleanEmail, password);
      } else {
        const res = await signup(cleanEmail, password, username.trim() || undefined);
        if (res.requireVerification) {
          setShowOtpVerification(true);
          setSuccess(res.message || 'Verification code sent to your email.');
          setResendCooldown(60);
        }
      }
    } catch (err: unknown) {
      if (err instanceof EmailNotVerifiedError) {
        setShowOtpVerification(true);
        setError('Please verify your email address to proceed.');
        setResendCooldown(30);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setSuccess('');

    const cleanedOtp = otpCode.trim();
    if (!/^\d{6}$/.test(cleanedOtp)) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpUser(email.trim(), cleanedOtp);
      setUser(res.user);
      setIsLoggedIn(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setError('');
    setSuccess('');
    setIsResending(true);
    try {
      const res = await resendOtpUser(email.trim());
      setSuccess(res.message || 'A new 6-digit code has been sent.');
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email to receive a reset link.');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(cleanEmail);
      setSuccess(res.message || 'Password reset link sent to your email.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header */}
          <View style={styles.brandContainer}>
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.logoText}>M</Text>
            </View>
            <Text style={[styles.brandTitle, { color: colors.textHeading }]}>
              mindspace
            </Text>
            <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
              Your intelligent, distraction-free knowledge sanctuary
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            {/* Mode Switcher */}
            {!showOtpVerification && (
              <View
                style={[
                  styles.tabRow,
                  {
                    backgroundColor: isDark ? 'rgba(35, 30, 25, 0.7)' : 'rgba(240, 235, 228, 0.7)',
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                  style={[
                    styles.tabBtn,
                    mode === 'login' && [
                      styles.tabBtnActive,
                      { backgroundColor: colors.card, shadowColor: colors.shadow },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      {
                        color: mode === 'login' ? colors.textHeading : colors.textMuted,
                        fontWeight: mode === 'login' ? '700' : '500',
                      },
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setMode('signup');
                    setError('');
                    setSuccess('');
                  }}
                  style={[
                    styles.tabBtn,
                    mode === 'signup' && [
                      styles.tabBtnActive,
                      { backgroundColor: colors.card, shadowColor: colors.shadow },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      {
                        color: mode === 'signup' ? colors.textHeading : colors.textMuted,
                        fontWeight: mode === 'signup' ? '700' : '500',
                      },
                    ]}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Error & Success Messages */}
            {Boolean(error) && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {Boolean(success) && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            {showOtpVerification ? (
              /* OTP Form */
              <View style={styles.form}>
                <View style={styles.otpHeader}>
                  <KeyRound size={24} color={colors.primary} />
                  <Text style={[styles.otpTitle, { color: colors.textHeading }]}>
                    Check your email
                  </Text>
                  <Text style={[styles.otpSubtitle, { color: colors.textMuted }]}>
                    We sent a 6-digit confirmation code to {email}
                  </Text>
                </View>

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
                    style={[styles.input, styles.otpInput, { color: colors.textHeading }]}
                    placeholder="123456"
                    placeholderTextColor={colors.textMuted}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Verify and Continue</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.otpFooter}>
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending}
                  >
                    <Text style={[styles.resendText, { color: colors.primary }]}>
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : isResending
                        ? 'Sending...'
                        : 'Resend verification code'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowOtpVerification(false);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    <Text style={[styles.backToSignText, { color: colors.textMuted }]}>
                      Back to sign in
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Regular Auth Form */
              <View style={styles.form}>
                {mode === 'signup' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Username</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: colors.inputBg, borderColor: colors.border },
                      ]}
                    >
                      <UserIcon size={16} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.textHeading }]}
                        placeholder="yourname"
                        placeholderTextColor={colors.textMuted}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.inputBg, borderColor: colors.border },
                    ]}
                  >
                    <Mail size={16} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.textHeading }]}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
                    {mode === 'login' && (
                      <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={[styles.forgotText, { color: colors.primary }]}>
                          Forgot?
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.inputBg, borderColor: colors.border },
                    ]}
                  >
                    <Lock size={16} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.textHeading }]}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {showPassword ? (
                        <EyeOff size={16} color={colors.textMuted} />
                      ) : (
                        <Eye size={16} color={colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {mode === 'login' ? 'Sign In to Mindspace' : 'Create Account'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 12,
  },
  logoText: {
    color: '#FAF8F5',
    fontWeight: '800',
    fontSize: 24,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabBtnActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13.5,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12.5,
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  successText: {
    color: '#10B981',
    fontSize: 12.5,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
  },
  submitBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  otpHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  otpSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 6,
    fontFamily: 'Menlo',
  },
  otpFooter: {
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  backToSignText: {
    fontSize: 12.5,
  },
});
