import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import WeeklyTestCard from '../components/WeeklyTestCard';
import ProtectedRoute from '../components/ProtectedRoute';
import { useArjunAuth } from '../context/AuthContext';
import { weeklyService } from '../services/weeklyService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function HomeScreen() {
  const router = useUniversalRouter();
  const { user } = useArjunAuth();
  const [activeWeeklyTest, setActiveWeeklyTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActiveTest();
  }, []);

  const fetchActiveTest = async () => {
    setLoading(true);
    try {
      const data = await weeklyService.getActiveWeeklyTest();
      setActiveWeeklyTest(data.test || null);
    } catch (error) {
      setActiveWeeklyTest(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveTest();
  };

  const handleStartWeeklyTest = (test) => {
    if (test && test.alreadyAttempted) {
      if (Platform.OS === 'web') {
        window.alert('Notice: You have already submitted this Weekly Test. Re-attempts are not allowed.');
      } else {
        Alert.alert('Already Attempted', 'You have already submitted this Weekly Test. Re-attempts are not allowed.');
      }
      return;
    }
    router.push({
      pathname: '/exam',
      params: { weeklyTestId: test._id, title: test.title || test.weekName, duration: test.duration },
    });
  };

  return (
    <ProtectedRoute roleRequired="student">
      <View style={styles.container}>
        <Navbar title="SLA SkillUp Portal" showBack={false} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Welcome Banner */}
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeTitle}>Welcome back, {user?.name || 'Student'}! 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              Course: {user?.courseName || 'General Aptitude'} | Trainer: {user?.trainerName || 'SLA Faculty'}
            </Text>
          </View>

          {/* Active Weekly Test Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Test</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : activeWeeklyTest ? (
            <WeeklyTestCard test={activeWeeklyTest} onStartTest={handleStartWeeklyTest} />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active weekly test available right now.</Text>
            </View>
          )}

          {/* Portal Modules Grid */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aptitude Modules</Text>
          </View>

          <View style={styles.gridContainer}>
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/category-select')}
            >
              <Text style={styles.gridIcon}>📚</Text>

              <Text style={styles.gridTitle}>Topic Practice</Text>
              <Text style={styles.gridSub}>Vedic Math, Percentage, Reasoning & Logic</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/student-mock-exam')}
            >
              <Text style={styles.gridIcon}>🎯</Text>
              <Text style={styles.gridTitle}>Official Mock Test</Text>
              <Text style={styles.gridSub}>Full Aptitude Assessment (Access Required)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/leaderboard')}
            >
              <Text style={styles.gridIcon}>🏆</Text>
              <Text style={styles.gridTitle}>Leaderboard</Text>

              <Text style={styles.gridSub}>Top Scorers & Rankings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridCard, { borderColor: '#93c5fd', borderWidth: 1.5 }]}
              onPress={() => router.push('/math-game-home')}
            >
              <Text style={styles.gridIcon}>⚡</Text>
              <Text style={styles.gridTitle}>Speed Math Game</Text>
              <Text style={styles.gridSub}>Tricks, 15 Levels & 2-Player Duel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => router.push('/previous-tests')}
            >
              <Text style={styles.gridIcon}>📜</Text>
              <Text style={styles.gridTitle}>Finished Tests History</Text>
              <Text style={styles.gridSub}>Review Past Attempted Tests</Text>
            </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  welcomeBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
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
  sectionHeader: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  emptyText: {
    color: COLORS.gray600,
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    backgroundColor: COLORS.white,
    width: '48%',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  gridIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  gridSub: {
    fontSize: 12,
    color: COLORS.gray600,
    lineHeight: 16,
  },
});

