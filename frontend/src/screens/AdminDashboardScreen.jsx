import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { adminService } from '../services/adminService';
import { weeklyService } from '../services/weeklyService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function AdminDashboardScreen() {
  const router = useUniversalRouter();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalWeeklyTests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [students, weeklyTests] = await Promise.all([
        adminService.getAllStudents(),
        weeklyService.getAllWeeklyTestsAdmin(),
      ]);

      setStats({
        totalStudents: students ? students.length : 0,
        totalWeeklyTests: weeklyTests ? weeklyTests.length : 0,
      });
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminModules = [
    {
      id: 'upload',
      title: 'Bulk CSV Upload',
      sub: 'Upload questions via CSV spreadsheet',
      icon: '📁',
      route: 'question-upload',
      accent: '#eff6ff',
      borderColor: '#bfdbfe',
    },
    {
      id: 'weekly',
      title: 'Weekly Tests',
      sub: 'Schedule live tests & assign questions',
      icon: '📅',
      route: 'weekly-test-management',
      accent: '#f5f3ff',
      borderColor: '#ddd6fe',
    },
    {
      id: 'this-week',
      title: "This Week's Qs",
      sub: 'Review & edit questions for active test',
      icon: '📝',
      route: 'this-week-questions',
      accent: '#fef3c7',
      borderColor: '#fde68a',
    },
    {
      id: 'students',
      title: 'Students & Mock',
      sub: 'Account status & grant mock permissions',
      icon: '👥',
      route: 'student-management',
      accent: '#f0fdf4',
      borderColor: '#bbf7d0',
    },
    {
      id: 'results',
      title: 'Weekly Results',
      sub: 'View scores, evaluate mistakes & CSV',
      icon: '📊',
      route: 'student-results',
      accent: '#faf5ff',
      borderColor: '#e9d5ff',
    },
    {
      id: 'mock-settings',
      title: 'Mock Settings',
      sub: 'Pass marks, duration & model questions',
      icon: '🎯',
      route: 'mock-test-management',
      accent: '#fff7ed',
      borderColor: '#fed7aa',
    },
    {
      id: 'mock-results',
      title: 'Mock Results',
      sub: 'View student PASS/FAIL & CSV report',
      icon: '📋',
      route: 'mock-results',
      accent: '#ecfdf5',
      borderColor: '#a7f3d0',
    },
  ];

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Admin Dashboard" showBack={false} showLogout={false} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Welcome Banner */}
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeTitle}>Admin Control Center</Text>
            <Text style={styles.welcomeSubtitle}>
              Manage aptitude assessments, student mock access & results
            </Text>
          </View>

          {/* KPI Statistics */}
          {loading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{ marginVertical: 12 }}
            />
          ) : (
            <View style={styles.statsContainer}>
              <View style={[styles.statBox, { borderColor: '#bfdbfe' }]}>
                <View style={[styles.statIconBadge, { backgroundColor: '#eff6ff' }]}>
                  <Text style={styles.statIconText}>👥</Text>
                </View>
                <View style={styles.statInfoCol}>
                  <Text style={styles.statNumber}>{stats.totalStudents}</Text>
                  <Text style={styles.statLabel}>Enrolled Students</Text>
                </View>
              </View>

              <View style={[styles.statBox, { borderColor: '#ddd6fe' }]}>
                <View style={[styles.statIconBadge, { backgroundColor: '#f5f3ff' }]}>
                  <Text style={styles.statIconText}>📅</Text>
                </View>
                <View style={styles.statInfoCol}>
                  <Text style={styles.statNumber}>{stats.totalWeeklyTests}</Text>
                  <Text style={styles.statLabel}>Weekly Tests</Text>
                </View>
              </View>
            </View>
          )}

          {/* 7 Management Topics in Student-like Box Grid */}
          <Text style={styles.sectionTitle}>Management Modules (7)</Text>

          <View style={styles.gridContainer}>
            {adminModules.slice(0, 6).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.gridCard,
                  { backgroundColor: COLORS.white, borderColor: item.borderColor },
                ]}
                onPress={() => router.push(item.route)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.iconPill,
                    { backgroundColor: item.accent },
                  ]}
                >
                  <Text style={styles.gridIcon}>{item.icon}</Text>
                </View>

                <Text style={styles.gridTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.gridSub} numberOfLines={2}>
                  {item.sub}
                </Text>

                <View style={styles.cardArrowRow}>
                  <Text style={styles.cardArrowText}>Open Module →</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* 7th Feature Card (Full Width for perfect grid balance) */}
            {adminModules[6] && (
              <TouchableOpacity
                key={adminModules[6].id}
                style={[
                  styles.featuredCard,
                  { backgroundColor: COLORS.white, borderColor: adminModules[6].borderColor },
                ]}
                onPress={() => router.push(adminModules[6].route)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.iconPill,
                    { backgroundColor: adminModules[6].accent, marginBottom: 0, marginRight: 14 },
                  ]}
                >
                  <Text style={styles.gridIcon}>{adminModules[6].icon}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.featuredBadgeRow}>
                    <Text style={styles.gridTitle}>{adminModules[6].title}</Text>
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>REPORTS</Text>
                    </View>
                  </View>
                  <Text style={styles.gridSub} numberOfLines={2}>
                    {adminModules[6].sub}
                  </Text>
                </View>

                <View style={styles.featuredArrowBtn}>
                  <Text style={styles.featuredArrowText}>→</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
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
  welcomeBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    ...SHADOWS.small,
  },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconText: {
    fontSize: 20,
  },
  statInfoCol: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray600,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 4,
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridIcon: {
    fontSize: 22,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  gridSub: {
    fontSize: 11,
    color: COLORS.gray600,
    lineHeight: 15,
    marginBottom: 10,
  },
  cardArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardArrowText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  featuredCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  featuredBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 0.5,
  },
  featuredArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  featuredArrowText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
