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
import { useArjunAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../styles/theme';

export default function StudentLoginScreen() {
  const router = useUniversalRouter();
  const { loginStudent } = useArjunAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await loginStudent(email.trim(), password);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || error.message || 'Unable to login');
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
        <View style={styles.headerBox}>
          <View style={styles.logoIconCircle}>
            <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z"
                fill="#ffffff"
              />
              <Path
                d="M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z"
                fill="#ffffff"
                fillOpacity={0.88}
              />
            </Svg>
          </View>
          <Text style={styles.brandTitle}>SLA SkillUp</Text>
          <Text style={styles.subTitle}>Student Aptitude Portal Login</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.formTitle}>Student Login</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="student@example.com"
            placeholderTextColor={COLORS.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              placeholderTextColor={COLORS.gray400}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
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
              <Text style={[styles.eyeText, showPassword && styles.eyeTextActive]}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/student-forgot-password')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>Login to Portal</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.noAccountText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/student-register')}>
              <Text style={styles.registerLink}>Register Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
    justifyContent: 'center',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#ffffff',
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 16px rgba(30, 58, 138, 0.25)' },
    }),
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 14,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 24,
    ...SHADOWS.medium,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    backgroundColor: COLORS.white,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  noAccountText: {
    color: COLORS.gray600,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 20,
  },
  adminSwitchBtn: {
    alignItems: 'center',
  },
  adminSwitchText: {
    color: COLORS.brandAccent,
    fontSize: 13,
    fontWeight: '700',
  },
});

