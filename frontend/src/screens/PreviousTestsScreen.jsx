import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { weeklyService } from '../services/weeklyService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function PreviousTestsScreen() {
  const router = useUniversalRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await weeklyService.getStudentWeeklyHistory();
      setHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = (item) => {
    const submittedTime = item.submittedAt ? new Date(item.submittedAt).getTime() : 0;
    const msPassed = Date.now() - submittedTime;
    const unlockMs = 24 * 60 * 60 * 1000;
    const isLocked = msPassed < unlockMs;
    const msRemaining = Math.max(0, unlockMs - msPassed);
    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <View key={item._id} style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.title}>
            {item.weeklyTestId?.title || item.weeklyTestId?.weekName || `${item.category || 'Weekly'} Test`}
          </Text>
          <Text style={styles.dateText}>
            {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : ''}
          </Text>
        </View>

        <Text style={styles.subText}>
          Topic: {item.category || item.weeklyTestId?.topic || 'Weekly Exam'}
        </Text>

        {/* Score Row */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreCol}>
            <Text style={styles.scoreNumber}>{item.score ?? 0} / {item.total ?? 0}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
          <View style={styles.scoreCol}>
            <Text style={[styles.scoreNumber, { color: COLORS.success }]}>{item.correctAnswers ?? 0}</Text>
            <Text style={styles.scoreLabel}>Correct</Text>
          </View>
          <View style={styles.scoreCol}>
            <Text style={[styles.scoreNumber, { color: COLORS.danger }]}>{item.wrongAnswers ?? 0}</Text>
            <Text style={styles.scoreLabel}>Wrong</Text>
          </View>
        </View>

        {/* Review Action */}
        <View style={styles.actionRow}>
          {isLocked ? (
            <TouchableOpacity
              style={styles.lockedBtn}
              onPress={() => router.push('/view-mistakes', { id: item._id })}
            >
              <Text style={styles.lockedBtnText}>
                🔒 Review Mistakes (Unlocks in {hoursRemaining}h {minutesRemaining}m)
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.unlockedBtn}
              onPress={() => router.push('/view-mistakes', { id: item._id })}
            >
              <Text style={styles.unlockedBtnText}>
                📋 Review Mistakes & Answers →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ProtectedRoute roleRequired="student">
      <View style={styles.container}>
        <Navbar title="Finished Tests History" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.heading}>Past Weekly & Practice Tests</Text>
          <Text style={styles.subheading}>Review completed tests from previous weeks</Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No completed weekly tests found in history.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {history.map(renderHistoryItem)}
            </View>
          )}
        </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  subText: {
    fontSize: 13,
    color: COLORS.gray600,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scoreCol: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 2,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 2,
  },
  lockedBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  lockedBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  unlockedBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  unlockedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
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
