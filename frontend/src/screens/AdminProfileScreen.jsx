import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useArjunAuth } from '../context/AuthContext';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import { adminService } from '../services/adminService';
import { weeklyService } from '../services/weeklyService';
import { COLORS, SHADOWS } from '../styles/theme';
import NavIcon from '../components/NavIcon';

export default function AdminProfileScreen() {
  const router = useUniversalRouter();
  const { user, logout } = useArjunAuth();
  const [stats, setStats] = useState({ students: 0, weekly: 0, questions: 0 });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [s, w, q] = await Promise.all([
        adminService.getAllStudents(),
        weeklyService.getAllWeeklyTestsAdmin(),
        adminService.getAllQuestions(),
      ]);
      setStats({
        students: s?.length || 0,
        weekly: w?.length || 0,
        questions: q?.length || 0,
      });
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      setLoggingOut(true);
      try {
        await logout();
        router.replace('admin-login');
      } catch (err) {
        console.error('Logout error:', err);
        setLoggingOut(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out of the Admin Portal?');
      if (confirmed) {
        await doLogout();
      }
    } else {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to log out of the Admin Portal?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: doLogout },
        ]
      );
    }
  };

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Admin Profile" showBack={true} showLogout={false} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Top Admin Header Card */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarGlowContainer}>
              <View style={styles.avatarCircle}>
                <NavIcon name="admin-profile" size={42} active={true} />
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeText}>ADMIN</Text>
                </View>
              </View>
            </View>
            <Text style={styles.userName}>{user?.username || 'Administrator'}</Text>
            <Text style={styles.userRole}>Super Administrator</Text>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>SYSTEM ACTIVE & SYNCED</Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{loading ? '-' : stats.students}</Text>
              <Text style={styles.metricLabel}>Students</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{loading ? '-' : stats.weekly}</Text>
              <Text style={styles.metricLabel}>Weekly Tests</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{loading ? '-' : stats.questions}</Text>
              <Text style={styles.metricLabel}>Total Qs</Text>
            </View>
          </View>

          {/* Account Details */}
          <Text style={styles.sectionTitle}>System & Credentials</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Admin Account</Text>
              <Text style={styles.infoValue}>{user?.username || 'admin'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Access Privilege</Text>
              <Text style={[styles.infoValue, { color: COLORS.primary, fontWeight: '800' }]}>
                Full System Root
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <Text style={[styles.infoValue, { color: COLORS.success, fontWeight: '800' }]}>
                Active & Verified
              </Text>
            </View>
          </View>

          {/* Prominent Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.85}
          >
            {loggingOut ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.logoutButtonText}>🚪 Log Out of Admin Portal</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  profileHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  avatarGlowContainer: {
    padding: 4,
    borderRadius: 48,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#93c5fd',
    marginBottom: 12,
    ...SHADOWS.small,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#3b82f6',
    position: 'relative',
  },
  avatarIcon: {
    fontSize: 34,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  avatarBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

