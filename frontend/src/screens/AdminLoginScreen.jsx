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
import { useUniversalRouter } from '../utils/useUniversalRouter';
import { useArjunAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../styles/theme';

export default function AdminLoginScreen() {
  const router = useUniversalRouter();
  const { loginAdmin } = useArjunAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!username || !password) {
      Alert.alert('Required', 'Please enter admin username and password');
      return;
    }

    setLoading(true);
    try {
      await loginAdmin(username.trim(), password);
      router.replace('/admin-dashboard');
    } catch (error) {
      Alert.alert('Admin Login Error', error.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  // Restrict Admin login on mobile phones (Desktop/Laptop Web only)
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.flexContainer, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={[styles.card, { alignItems: 'center', maxWidth: 360, width: '100%' }]}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>💻</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 8 }}>
            Laptop Access Only
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.gray600, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
            Admin Portal mobile phone-la access panna mudiyadhu. Please use your laptop or desktop browser to access the Admin Portal.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { width: '100%', paddingVertical: 12 }]}
            onPress={() => router.replace('/student-login')}
          >
            <Text style={styles.primaryBtnText}>← Back to Student App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBox}>
          <Text style={styles.brandTitle}>SLA SkillUp Admin</Text>
          <Text style={styles.subTitle}>Aptitude Portal Management System</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.formTitle}>Administrator Login</Text>

          <Text style={styles.label}>Admin Username</Text>
          <TextInput
            style={styles.input}
            placeholder="admin"
            placeholderTextColor={COLORS.gray400}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter admin password"
            placeholderTextColor={COLORS.gray400}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleAdminLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>Login to Dashboard</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.push('/student-login')}
          >
            <Text style={styles.switchText}>← Back to Student Login</Text>
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
  headerBox: {
    alignItems: 'center',
    marginBottom: 30,
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
  switchBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
});

