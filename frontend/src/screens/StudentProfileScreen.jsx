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
import { authService } from '../services/authService';
import { weeklyService } from '../services/weeklyService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function StudentProfileScreen() {
  const router = useUniversalRouter();
  const { user, logout } = useArjunAuth();
  const [profileData, setProfileData] = useState(user);
  const [historyCount, setHistoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const fetchProfileAndStats = async () => {
    try {
      // Fetch fresh profile from API to ensure mobile number is up to date
      try {
        const freshProfile = await authService.getStudentProfile();
        if (freshProfile) {
          setProfileData(freshProfile);
        }
      } catch (err) {
        // Fallback to AuthContext user
      }

      // Fetch completed tests count
      const history = await weeklyService.getStudentWeeklyHistory();
      setHistoryCount(history ? history.length : 0);
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
        router.replace('student-login');
      } catch (err) {
        console.error('Logout error:', err);
        setLoggingOut(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out of SLA SkillUp?');
      if (confirmed) {
        await doLogout();
      }
    } else {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to log out of SLA SkillUp?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: doLogout },
        ]
      );
    }
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const activeStudent = profileData || user;
  const phoneNumber = activeStudent?.phone || 'Not Provided';

  return (
    <ProtectedRoute roleRequired="student">
      <View style={styles.container}>
        <Navbar title="My Profile" showBack={true} showLogout={false} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Top Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(activeStudent?.name)}</Text>
            </View>
            <Text style={styles.userName}>{activeStudent?.name || 'Student'}</Text>
            <Text style={styles.userEmail}>{activeStudent?.email || 'N/A'}</Text>

            {/* Mobile Number Badge */}
            <View style={styles.phoneBadge}>
              <Text style={styles.phoneIcon}>📱</Text>
              <Text style={styles.phoneText}>{phoneNumber}</Text>
            </View>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{activeStudent?.status || 'ACTIVE'}</Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{loading ? '-' : historyCount}</Text>
              <Text style={styles.metricLabel}>Tests Completed</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{activeStudent?.assignedMockModel || 'Model 1'}</Text>
              <Text style={styles.metricLabel}>Mock Model</Text>
            </View>
          </View>

          <View style={[styles.metricsRow, { marginTop: -6 }]}>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, { color: '#f59e0b' }]}>
                🔥 {activeStudent?.dailyStreak || 1} Days
              </Text>
              <Text style={styles.metricLabel}>Daily Streak</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, { color: '#10b981' }]}>
                🪙 {(activeStudent?.gameCoins ?? 200).toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Game Coins</Text>
            </View>
          </View>

          {/* Account Details Section */}
          <Text style={styles.sectionTitle}>Academic & Contact Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValueHighlight}>{phoneNumber}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Course</Text>
              <Text style={styles.infoValue}>{activeStudent?.courseName || 'General Aptitude'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Trainer</Text>
              <Text style={styles.infoValue}>{activeStudent?.trainerName || 'SLA Faculty'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <Text style={[styles.infoValue, { color: COLORS.success }]}>
                {activeStudent?.status || 'ACTIVE'}
              </Text>
            </View>
          </View>

          {/* Quick Navigation to Test History */}
          <TouchableOpacity
            style={styles.historyCard}
            onPress={() => router.push('previous-tests')}
            activeOpacity={0.8}
          >
            <View style={styles.historyLeft}>
              <Text style={styles.historyIcon}>📜</Text>
              <View>
                <Text style={styles.historyTitle}>Finished Tests History</Text>
                <Text style={styles.historySub}>Review your past submitted tests & records</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

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
              <Text style={styles.logoutButtonText}>🚪 Log Out of Account</Text>
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
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#e7eefd',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.gray600,
    marginBottom: 8,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  phoneIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
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
    gap: 12,
    marginBottom: 18,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  metricVal: {
    fontSize: 20,
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
    maxWidth: '60%',
    textAlign: 'right',
  },
  infoValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIcon: {
    fontSize: 24,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historySub: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.gray400,
    fontWeight: '600',
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
