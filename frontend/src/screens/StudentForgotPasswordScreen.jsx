import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import { authService } from '../services/authService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function StudentForgotPasswordScreen() {
  const router = useUniversalRouter();

  // Step 1: Enter Phone Number
  // Step 2: Enter & Verify 6-digit OTP
  // Step 3: Set New Password (Unlocked ONLY after OTP verification)
  const [step, setStep] = useState(1);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpDevHint, setOtpDevHint] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');

  // Step 1: Request OTP for Registered Phone Number
  const handleRequestOtp = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      Alert.alert('Required', 'Please enter your registered mobile number');
      return;
    }

    if (trimmedPhone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.requestForgotPasswordByPhone(trimmedPhone);
      if (res.otp) {
        setOtpDevHint(res.otp);
      }
      setMaskedPhone(res.phone ? `${res.phone.slice(0, 2)}******${res.phone.slice(-2)}` : trimmedPhone);
      Alert.alert(
        'OTP Sent Successfully! 📲',
        'A 6-digit verification OTP has been sent to your registered mobile ending in ' + trimmedPhone.slice(-4) + '.',
        [{ text: 'OK' }]
      );
      setStep(2);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send OTP to this number. Please check and try again.';
      Alert.alert('Account Not Found', msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      Alert.alert('Required', 'Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOtpOnly(phone.trim(), trimmedOtp);
      Alert.alert(
        'OTP Verified! ✅',
        'Your mobile number has been verified. You can now set your new password.',
        [{ text: 'Continue', onPress: () => setStep(3) }]
      );
      setStep(3);
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid or expired OTP code. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password (Only accessible after OTP is verified!)
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Required', 'Please enter and confirm your new password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(newPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      Alert.alert(
        'Strong Password Required',
        'Password must contain letters, numbers, and special characters (e.g. @$!%*?&#)'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match. Please re-enter');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPasswordAfterOtp(phone.trim(), newPassword);
      Alert.alert(
        'Password Reset Successful! 🎉',
        'Your account password has been updated. Please login with your new password.',
        [
          {
            text: 'Login Now',
            onPress: () => router.replace('/student-login'),
          },
        ]
      );
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update password. Please try again.';
      Alert.alert('Update Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backLinkText}>‹ Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.formTitle}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'Reset your password via OTP sent to your registered phone number'}
            {step === 2 && 'Enter the 6-digit OTP code sent to your registered mobile'}
            {step === 3 && 'OTP verified! Set your new password to access your account'}
          </Text>

          {/* 3-Step Progress Indicator */}
          <View style={styles.stepIndicatorRow}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
            </View>
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</Text>
            </View>
            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 3 && styles.stepDotTextActive]}>3</Text>
            </View>
          </View>

          <View style={styles.stepLabelsRow}>
            <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Mobile</Text>
            <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Verify OTP</Text>
            <Text style={[styles.stepLabel, step === 3 && styles.stepLabelActive]}>New Password</Text>
          </View>

          {/* STEP 1: Enter Phone Number */}
          {step === 1 && (
            <View style={styles.stepBody}>
              <Text style={styles.label}>Registered Mobile Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="9876543210"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                />
              </View>
              <Text style={styles.helperText}>
                We will check your registered student account and send an OTP code.
              </Text>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleRequestOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Verification OTP ➜</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Enter & Verify 6-digit OTP */}
          {step === 2 && (
            <View style={styles.stepBody}>
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerTitle}>OTP Sent to Registered Mobile</Text>
                <Text style={styles.infoBannerSub}>
                  +91 {maskedPhone || phone}
                </Text>
              </View>

              {otpDevHint ? (
                <View style={styles.devHintBox}>
                  <Text style={styles.devHintLabel}>Demo / Test OTP Code:</Text>
                  <Text style={styles.devHintCode}>{otpDevHint}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Enter 6-Digit OTP Code</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="------"
                placeholderTextColor={COLORS.gray400}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, ''))}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify OTP Code ✓</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <TouchableOpacity onPress={() => setStep(1)} activeOpacity={0.7}>
                  <Text style={styles.changePhoneText}>Change Mobile Number</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRequestOtp} activeOpacity={0.7} disabled={loading}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: Set New Password (Unlocked ONLY after OTP Verification!) */}
          {step === 3 && (
            <View style={styles.stepBody}>
              <View style={styles.verifiedBanner}>
                <Text style={styles.verifiedIcon}>✅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.verifiedTitle}>Mobile Verified Successfully</Text>
                  <Text style={styles.verifiedSub}>+91 {phone} is verified. Enter your new password below.</Text>
                </View>
              </View>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter at least 6 characters"
                  placeholderTextColor={COLORS.gray400}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  activeOpacity={0.7}
                  accessibilityLabel={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <Path d="M1 1l22 22" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                  ) : (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <Circle cx="12" cy="12" r="3" stroke="#64748b" strokeWidth="2"/>
                    </Svg>
                  )}
                  <Text style={[styles.eyeText, showNewPassword && styles.eyeTextActive]}>
                    {showNewPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor={COLORS.gray400}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <Path d="M1 1l22 22" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                  ) : (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <Circle cx="12" cy="12" r="3" stroke="#64748b" strokeWidth="2"/>
                    </Svg>
                  )}
                  <Text style={[styles.eyeText, showConfirmPassword && styles.eyeTextActive]}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, styles.successBtn, loading && styles.disabledBtn]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Update Password & Login 🔒</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  backLink: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backLinkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.medium,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    marginBottom: 18,
    lineHeight: 18,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
  },
  stepDotTextActive: {
    color: '#ffffff',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textAlign: 'center',
    width: 80,
  },
  stepLabelActive: {
    color: COLORS.primary,
  },
  stepBody: {
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 10,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  countryCodeBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#e2e8f0',
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 6,
  },
  infoBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 12,
  },
  infoBannerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  infoBannerSub: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  devHintBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devHintLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  devHintCode: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#b45309',
  },
  otpInput: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    color: COLORS.primary,
    backgroundColor: '#f8fafc',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 4,
  },
  changePhoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  verifiedIcon: {
    fontSize: 22,
  },
  verifiedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  verifiedSub: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 1,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: '#f8fafc',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  eyeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  eyeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  eyeTextActive: {
    color: COLORS.primary,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 50,
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  successBtn: {
    backgroundColor: '#16a34a',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
