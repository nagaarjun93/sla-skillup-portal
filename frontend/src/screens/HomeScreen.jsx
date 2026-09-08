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
  StatusBar,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { useUniversalRouter } from '../utils/useUniversalRouter';
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

  const handleStreakPress = () => {
    const message = '🔥 Daily Streak Active!\n\nConsistency is the key to cracking aptitude interviews. Take your weekly test and practice topic quizzes daily to level up your skills!';
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Daily Streak 🔥', message);
    }
  };

  const studentInitial = (user?.name || user?.username || 'Student').trim().charAt(0).toUpperCase();

  return (
    <ProtectedRoute roleRequired="student">
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#101a5e" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" colors={['#1e3a8a']} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Integrated Curved Hero Header (Option 1) */}
          <View style={styles.heroContainer}>
            {/* Gradient & Ambient Glow Vector Background */}
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <SvgLinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#101a5e" />
                  <Stop offset="55%" stopColor="#1e3a8a" />
                  <Stop offset="100%" stopColor="#1d4ed8" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#heroGrad)" />
              <Circle cx="90%" cy="18%" r="65" fill="rgba(255, 255, 255, 0.07)" />
              <Circle cx="12%" cy="85%" r="80" fill="rgba(96, 165, 250, 0.12)" />
            </Svg>

            {/* Top Bar: Brand + Badges + Profile */}
            <View style={styles.heroTopRow}>
              <View style={styles.brandContainer}>
                <Text style={styles.brandTitle}>SLA SkillUp</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>STUDENT</Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                {/* Daily Streak Badge */}
                <TouchableOpacity
                  style={styles.streakBadge}
                  onPress={handleStreakPress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.streakText}>🔥 3 Days</Text>
                </TouchableOpacity>

                {/* Profile Avatar Button */}
                <TouchableOpacity
                  style={styles.profileBtn}
                  onPress={() => router.push('/student-profile')}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetter}>{studentInitial}</Text>
                  </View>
                  <View style={styles.onlineDot} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Greeting & Subtitle Area */}
            <View style={styles.greetingSection}>
              <Text style={styles.welcomeTitle}>
                Welcome back, {user?.name || 'Student'}! 👋
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Sharpen your aptitude skills & ace your tests! 🚀
              </Text>
            </View>

            {/* Student Meta Chips (Pills) */}
            <View style={styles.metaChipsRow}>
              <View style={styles.chipPill}>
                <Text style={styles.chipText}>
                  📚 {user?.courseName || 'General Aptitude'}
                </Text>
              </View>
              <View style={styles.chipPill}>
                <Text style={styles.chipText}>
                  👨‍🏫 Trainer: {user?.trainerName || 'SLA Faculty'}
                </Text>
              </View>
            </View>
          </View>

          {/* Main Content Area */}
          <View style={styles.bodyContent}>
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
    paddingBottom: 100,
  },
  heroContainer: {
    backgroundColor: '#101a5e',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 52,
    paddingBottom: 22,
    paddingHorizontal: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
      },
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  roleBadgeText: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  streakText: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '700',
  },
  profileBtn: {
    position: 'relative',
    padding: 2,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
    }),
  },
  avatarLetter: {
    color: '#101a5e',
    fontSize: 18,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  greetingSection: {
    marginTop: 18,
    marginBottom: 12,
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: '#bfdbfe',
    fontSize: 13,
    fontWeight: '500',
  },
  metaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  chipPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  bodyContent: {
    padding: 16,
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

