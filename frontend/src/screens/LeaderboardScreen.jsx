import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { examService } from '../services/examService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function LeaderboardScreen() {
  const router = useUniversalRouter();
  const [dataState, setDataState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdownStr, setCountdownStr] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Countdown timer for locked state
  useEffect(() => {
    if (!dataState || dataState.status !== 'LOCKED') return;

    let remaining = dataState.msUntilUnlock || 0;
    const update = () => {
      if (remaining <= 0) {
        setCountdownStr('Rankings ready! Refresh to view.');
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      const pad = (n) => String(n).padStart(2, '0');
      setCountdownStr(`${pad(h)}h ${pad(m)}m ${pad(s)}s`);
      remaining = Math.max(0, remaining - 1000);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [dataState]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await examService.getLeaderboard();
      // res could be { status: '...', leaderboard: [...] } or array
      if (Array.isArray(res)) {
        setDataState({
          status: 'UNLOCKED',
          leaderboard: res,
          testTitle: 'Weekly Test Rankings',
        });
      } else {
        setDataState(res || { status: 'EMPTY', leaderboard: [] });
      }
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
      setDataState({ status: 'EMPTY', leaderboard: [] });
    } finally {
      setLoading(false);
    }
  };

  const renderRankItem = ({ item }) => {
    const isTop3 = item.rank <= 3;
    const isMe = item.isCurrentUser;

    let medal = '';
    if (item.rank === 1) medal = '🥇 ';
    else if (item.rank === 2) medal = '🥈 ';
    else if (item.rank === 3) medal = '🥉 ';

    return (
      <View
        style={[
          styles.rankCard,
          isTop3 && styles.topRankCard,
          isMe && styles.myRankCard,
        ]}
      >
        <View
          style={[
            styles.rankBadge,
            item.rank === 1 && { backgroundColor: '#f59e0b' },
            item.rank === 2 && { backgroundColor: '#94a3b8' },
            item.rank === 3 && { backgroundColor: '#b45309' },
            isMe && { backgroundColor: COLORS.secondary },
          ]}
        >
          <Text style={styles.rankText}>#{item.rank}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={[styles.studentName, isMe && { color: COLORS.secondary, fontWeight: '800' }]}>
            {medal}{item.studentName} {isMe ? ' (You)' : ''}
          </Text>
          <Text style={styles.courseText}>
            {item.courseName || 'Student'} • {item.category || 'Weekly Test'}
          </Text>
        </View>

        <View style={styles.scoreBox}>
          <Text style={[styles.scoreText, isMe && { color: COLORS.secondary }]}>
            {item.score} / {item.total}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Navbar title="Weekly Test Rankings" />

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : dataState?.status === 'LOCKED' ? (
            /* ── 24-Hour Locked State ── */
            <View style={styles.lockCard}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockTitle}>Rankings Locked</Text>
              <Text style={styles.lockDesc}>
                To maintain test fairness and prevent early score disclosure, rankings for{' '}
                <Text style={{ fontWeight: '700', color: COLORS.text }}>
                  {dataState.testTitle || 'this Weekly Test'}
                </Text>{' '}
                unlock exactly 24 hours after your submission.
              </Text>

              <View style={styles.countdownBox}>
                <Text style={styles.countdownLabel}>⏳ Rankings Unlock In:</Text>
                <Text style={styles.countdownValue}>{countdownStr || 'Calculating...'}</Text>
              </View>

              {dataState.userScore !== undefined && (
                <View style={styles.myScoreBox}>
                  <Text style={styles.myScoreLabel}>Your Submitted Score</Text>
                  <Text style={styles.myScoreVal}>
                    {dataState.userScore} / {dataState.userTotal}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.back('home')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>← Back to Home</Text>
              </TouchableOpacity>
            </View>
          ) : dataState?.status === 'NOT_ATTEMPTED' ? (
            /* ── Not Attempted State ── */
            <View style={styles.lockCard}>
              <Text style={styles.lockIcon}>📝</Text>
              <Text style={styles.lockTitle}>Take the Weekly Test</Text>
              <Text style={styles.lockDesc}>
                You have not attempted{' '}
                <Text style={{ fontWeight: '700', color: COLORS.text }}>
                  {dataState.testTitle || 'the current Weekly Test'}
                </Text>{' '}
                yet! Complete the test to join the official leaderboard and see your rank.
              </Text>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('weekly-test')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>Take Weekly Test Now ➔</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Unlocked Leaderboard State ── */
            <>
              {/* Test Header Banner */}
              <View style={styles.testBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.testBannerTitle}>
                    🏆 {dataState?.testTitle || 'Weekly Test Leaderboard'}
                  </Text>
                  <Text style={styles.testBannerSub}>
                    Official weekly rankings (Practice tests excluded)
                  </Text>
                </View>
              </View>

              {/* User Rank Card */}
              {dataState?.userRank && (
                <View style={styles.userRankCard}>
                  <Text style={styles.userRankEmoji}>🏅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userRankTitle}>Your Official Rank</Text>
                    <Text style={styles.userRankNumber}>
                      #{dataState.userRank}{' '}
                      <Text style={styles.userRankTotal}>
                        out of {dataState.totalParticipants || dataState.leaderboard?.length || 1} students
                      </Text>
                    </Text>
                  </View>
                </View>
              )}

              <FlatList
                data={dataState?.leaderboard || []}
                keyExtractor={(item, idx) => item._id || item.studentId || idx.toString()}
                renderItem={renderRankItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No rankings recorded for this test yet.</Text>
                  </View>
                }
              />
            </>
          )}
        </View>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  testBanner: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  testBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  testBannerSub: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
  userRankCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  userRankEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  userRankTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    textTransform: 'uppercase',
  },
  userRankNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#166534',
    marginTop: 1,
  },
  userRankTotal: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  list: {
    paddingBottom: 100,
    gap: 10,
  },
  rankCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  topRankCard: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
  },
  myRankCard: {
    borderColor: COLORS.secondary,
    borderWidth: 2,
    backgroundColor: '#eff6ff',
  },
  rankBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  infoBox: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  courseText: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
  scoreBox: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginTop: 20,
  },
  emptyText: {
    color: COLORS.gray600,
    fontSize: 14,
  },
  lockCard: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOWS.small,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  lockDesc: {
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  countdownBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  countdownValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e40af',
    letterSpacing: 1,
  },
  myScoreBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  myScoreLabel: {
    fontSize: 11,
    color: COLORS.gray600,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  myScoreVal: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

