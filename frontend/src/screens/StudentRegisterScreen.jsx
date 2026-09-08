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

export default function StudentRegisterScreen() {
  const router = useUniversalRouter();
  const { registerStudent } = useArjunAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [courseName, setCourseName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [loading, setLoading] = useState(false);

  // Strong password criteria checks: Character, Number, Special Character, Min length 6
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password);
  const hasMinLength = password.length >= 6;
  const isPasswordStrong = hasLetter && hasNumber && hasSpecial && hasMinLength;

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Required Fields', 'Please fill name, email, and password');
      return;
    }

    if (!isPasswordStrong) {
      Alert.alert(
        'Strong Password Required',
        'Password must contain letters, numbers, and special characters (e.g. @$!%*?&#) with at least 6 characters.'
      );
      return;
    }

    setLoading(true);
    try {
      await registerStudent({
        name,
        email: email.trim(),
        password,
        phone,
        courseName,
        trainerName,
      });
      Alert.alert('Success', 'Account registered successfully!');
      router.replace('/home');
    } catch (error) {
      Alert.alert('Registration Error', error.response?.data?.message || error.message || 'Unable to register account');
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
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.formTitle}>Student Registration</Text>
          <Text style={styles.subtitle}>Create an account to start taking aptitude tests</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={COLORS.gray400}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="student@example.com"
            placeholderTextColor={COLORS.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password *</Text>
          <View style={[styles.passwordContainer, password.length > 0 && (isPasswordStrong ? styles.inputSuccess : styles.inputWarning)]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Create password"
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

          {/* Real-time Password Complexity Guidance Card */}
          <View style={styles.reqCard}>
            <Text style={styles.reqTitle}>Password Requirements (All 3 required):</Text>
            <View style={styles.reqGrid}>
              <View style={[styles.reqItem, hasLetter && styles.reqItemPassed]}>
                <Text style={[styles.reqItemIcon, hasLetter && styles.reqItemIconPassed]}>
                  {hasLetter ? '✓' : '○'}
                </Text>
                <Text style={[styles.reqItemText, hasLetter && styles.reqItemTextPassed]}>
                  Letters (a-z, A-Z)
                </Text>
              </View>

              <View style={[styles.reqItem, hasNumber && styles.reqItemPassed]}>
                <Text style={[styles.reqItemIcon, hasNumber && styles.reqItemIconPassed]}>
                  {hasNumber ? '✓' : '○'}
                </Text>
                <Text style={[styles.reqItemText, hasNumber && styles.reqItemTextPassed]}>
                  Numbers (0-9)
                </Text>
              </View>

              <View style={[styles.reqItem, hasSpecial && styles.reqItemPassed]}>
                <Text style={[styles.reqItemIcon, hasSpecial && styles.reqItemIconPassed]}>
                  {hasSpecial ? '✓' : '○'}
                </Text>
                <Text style={[styles.reqItemText, hasSpecial && styles.reqItemTextPassed]}>
                  Special (@$!%*#)
                </Text>
              </View>

              <View style={[styles.reqItem, hasMinLength && styles.reqItemPassed]}>
                <Text style={[styles.reqItemIcon, hasMinLength && styles.reqItemIconPassed]}>
                  {hasMinLength ? '✓' : '○'}
                </Text>
                <Text style={[styles.reqItemText, hasMinLength && styles.reqItemTextPassed]}>
                  Min 6 characters
                </Text>
              </View>
            </View>

            {password.length > 0 && !isPasswordStrong && (
              <Text style={styles.reqStatusWarning}>
                ⚠️ Please include letters, numbers, and special characters.
              </Text>
            )}
            {password.length > 0 && isPasswordStrong && (
              <Text style={styles.reqStatusSuccess}>
                ✓ Strong password criteria satisfied!
              </Text>
            )}
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            placeholderTextColor={COLORS.gray400}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Course Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Stack Java / Python / Mobile"
            placeholderTextColor={COLORS.gray400}
            value={courseName}
            onChangeText={setCourseName}
          />

          <Text style={styles.label}>Trainer Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Trainer name"
            placeholderTextColor={COLORS.gray400}
            value={trainerName}
            onChangeText={setTrainerName}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
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
  },
  backLink: {
    marginBottom: 16,
  },
  backLinkText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 24,
    ...SHADOWS.medium,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray600,
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
  inputSuccess: {
    borderColor: '#10b981',
  },
  inputWarning: {
    borderColor: '#f59e0b',
  },
  reqCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  reqTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  reqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  reqItemPassed: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  reqItemIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
  },
  reqItemIconPassed: {
    color: '#059669',
  },
  reqItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  reqItemTextPassed: {
    color: '#065f46',
    fontWeight: '700',
  },
  reqStatusWarning: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '600',
    marginTop: 6,
  },
  reqStatusSuccess: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginTop: 6,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
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
});

