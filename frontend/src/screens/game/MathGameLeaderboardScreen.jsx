import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadUserStats } from '../../game/services/gameStorage';

export default function MathGameLeaderboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalScore: 0,
    totalStars: 0,
    totalSolved: 0,
    totalCorrect: 0,
    bestStreak: 0,
    speedChallengeHighScore: 0,
    levelsCompleted: 0,
  });

  const refreshData = useCallback(async () => {
    const s = await loadUserStats();
    setStats(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const accuracy =
    stats.totalSolved > 0
      ? Math.round((stats.totalCorrect / stats.totalSolved) * 100)
      : 0;

  const ACHIEVEMENTS = [
    {
      id: 'first_step',
      icon: '🌱',
      title: 'First Step',
      desc: 'Complete Level 1 in campaign',
      unlocked: stats.levelsCompleted >= 1,
    },
    {
      id: 'streak_5',
      icon: '🔥',
      title: 'On Fire',
      desc: 'Achieve a 5-question answer streak',
      unlocked: stats.bestStreak >= 5,
    },
    {
      id: 'streak_10',
      icon: '⚡',
      title: 'Lightning Streak',
      desc: 'Achieve a 10-question streak',
      unlocked: stats.bestStreak >= 10,
    },
    {
      id: 'speed_500',
      icon: '🏎️',
      title: 'Speed Demon',
      desc: 'Score 500+ in 60s Speed Challenge',
      unlocked: stats.speedChallengeHighScore >= 500,
    },
    {
      id: 'halfway',
      icon: '⭐',
      title: 'Mental Scholar',
      desc: 'Complete 7 campaign levels',
      unlocked: stats.levelsCompleted >= 7,
      desc: 'Complete 25 campaign levels',
      unlocked: stats.levelsCompleted >= 25,
    },
    {
      id: 'grandmaster',
      icon: '👑',
      title: 'Grandmaster',
      desc: 'Clear all 15 campaign levels',
      unlocked: stats.levelsCompleted >= 15,
      desc: 'Clear all 50 campaign levels',
      unlocked: stats.levelsCompleted >= 50,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>My Math Stats</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.subtitle}>
        Track your mental agility, accuracy, and badge achievements!
      </Text>

      {/* Main Stats Summary Card */}
      <View style={styles.statsCard}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreIcon}>⭐</Text>
          <View>
            <Text style={styles.mainScoreVal}>{stats.totalStars} / 45</Text>
            <Text style={styles.mainScoreVal}>{stats.totalStars} / 150</Text>
            <Text style={styles.mainScoreLabel}>Total Stars Collected</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.itemVal}>{stats.totalSolved}</Text>
            <Text style={styles.itemLabel}>Total Solved</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={[styles.itemVal, { color: '#10b981' }]}>{accuracy}%</Text>
            <Text style={styles.itemLabel}>Accuracy</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={[styles.itemVal, { color: '#ea580c' }]}>🔥 {stats.bestStreak}</Text>
            <Text style={styles.itemLabel}>Best Streak</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={[styles.itemVal, { color: '#b45309' }]}>
              ⚡ {stats.speedChallengeHighScore}
            </Text>
            <Text style={styles.itemLabel}>Speed High</Text>
          </View>
        </View>
      </View>

      {/* Achievements Section */}
      <Text style={styles.sectionHeading}>Badges & Milestones</Text>

      <View style={styles.badgesList}>
        {ACHIEVEMENTS.map((badge) => (
          <View
            key={badge.id}
            style={[
              styles.badgeCard,
              badge.unlocked ? styles.badgeUnlocked : styles.badgeLocked,
            ]}
          >
            <Text style={[styles.badgeIcon, !badge.unlocked && styles.iconLocked]}>
              {badge.icon}
            </Text>
            <View style={styles.badgeInfo}>
              <Text
                style={[styles.badgeTitle, !badge.unlocked && styles.textLocked]}
              >
                {badge.title}
              </Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
            </View>
            <View
              style={[
                styles.statusTag,
                badge.unlocked ? styles.statusUnlocked : styles.statusLocked,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  badge.unlocked ? styles.statusTextUnlocked : styles.statusTextLocked,
                ]}
              >
                {badge.unlocked ? 'Earned' : 'Locked'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  contentContainer: {
    padding: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14217f',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14217f',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#14217f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(20,33,127,0.08)',
      },
    }),
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  scoreIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  mainScoreVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#14217f',
  },
  mainScoreLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
  },
  itemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badgesList: {
    width: '100%',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  badgeUnlocked: {
    borderColor: '#bbf7d0',
  },
  badgeLocked: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    opacity: 0.7,
  },
  badgeIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  iconLocked: {
    opacity: 0.5,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  textLocked: {
    color: '#94a3b8',
  },
  badgeDesc: {
    fontSize: 12,
    color: '#64748b',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusUnlocked: {
    backgroundColor: '#dcfce7',
  },
  statusLocked: {
    backgroundColor: '#e2e8f0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextUnlocked: {
    color: '#15803d',
  },
  statusTextLocked: {
    color: '#64748b',
  },
});