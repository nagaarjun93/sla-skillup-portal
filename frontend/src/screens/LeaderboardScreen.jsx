import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { examService } from '../services/examService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await examService.getLeaderboard();
      setLeaderboard(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderRankItem = ({ item }) => {
    const isTop3 = item.rank <= 3;
    return (
      <View style={[styles.rankCard, isTop3 && styles.topRankCard]}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{item.rank}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <Text style={styles.courseText}>
            {item.courseName} | {item.category}
          </Text>
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>
            {item.score} / {item.total}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Navbar title="Aptitude Leaderboard" />

        <View style={styles.content}>
          <Text style={styles.heading}>🏆 Top Scorers</Text>
          <Text style={styles.subheading}>Students with highest accuracy & performance</Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={leaderboard}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={renderRankItem}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No leaderboard records found yet.</Text>
                </View>
              }
            />
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.gray600,
    marginBottom: 16,
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
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selectedBg,
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
  },
  emptyText: {
    color: COLORS.gray600,
    fontSize: 14,
  },
});

