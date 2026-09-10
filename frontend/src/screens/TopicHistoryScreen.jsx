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
import { examService } from '../services/examService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function TopicHistoryScreen() {
  const router = useUniversalRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await examService.getStudentTopicHistory();
      setHistory(data || []);
    } catch (e) {
      console.error('Failed to load topic history:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalTests = history.length;
  const totalQuestionsAnswered = history.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalScore = history.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const avgAccuracy = totalQuestionsAnswered > 0
    ? Math.round((totalScore / totalQuestionsAnswered) * 100)
    : 0;

  const renderHistoryItem = (item) => {
    const accuracy = item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;
    const formattedDate = item.submittedAt
      ? new Date(item.submittedAt).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Recently';

    return (
      <View key={item._id} style={styles.card}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.topicBadge}>
                <Text style={styles.topicBadgeText}>{item.category || 'General'} Practice</Text>
              </View>
              <View style={styles.instantBadge}>
                <Text style={styles.instantBadgeText}>⚡ Instant Review</Text>
              </View>
            </View>
            <Text style={styles.title}>{item.category || 'Topic Exam'}</Text>
          </View>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreCol}>
            <Text style={[styles.scoreNumber, { color: COLORS.primary }]}>
              {item.score ?? 0} / {item.total ?? 0}
            </Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>

          <View style={styles.scoreCol}>
            <Text
              style={[
                styles.scoreNumber,
                { color: accuracy >= 70 ? COLORS.success : accuracy >= 40 ? '#f59e0b' : COLORS.danger },
              ]}
            >
              {accuracy}%
            </Text>
            <Text style={styles.scoreLabel}>Accuracy</Text>
          </View>

          <View style={styles.scoreCol}>
            <Text style={[styles.scoreNumber, { color: COLORS.success }]}>
              {item.correctAnswers ?? item.score ?? 0} ✅
            </Text>
            <Text style={styles.scoreLabel}>Correct</Text>
          </View>

          <View style={styles.scoreCol}>
            <Text style={[styles.scoreNumber, { color: COLORS.danger }]}>
              {item.wrongAnswers ?? Math.max(0, (item.total || 0) - (item.score || 0))} ❌
            </Text>
            <Text style={styles.scoreLabel}>Mistakes</Text>
          </View>
        </View>

        {/* Action Row: Immediate view mistakes button (NO 24-hour lock!) */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.unlockedBtn}
            onPress={() => router.push('/view-mistakes', { id: item._id })}
            activeOpacity={0.8}
          >
            <Text style={styles.unlockedBtnText}>
              📋 Review Mistakes & Solutions →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ProtectedRoute roleRequired="student">
      <View style={styles.container}>
        <Navbar title="Topic Practice History" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heading}>📜 My Practice History</Text>
                <Text style={styles.subheading}>
                  Your topic practice test attempts. Review answers and solutions instantly!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.backToPracticeBtn}
                onPress={() => router.replace('category-select')}
                activeOpacity={0.8}
              >
                <Text style={styles.backToPracticeBtnText}>📚 Topics</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Bar */}
          {!loading && history.length > 0 && (
            <View style={styles.summaryBar}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNum}>{totalTests}</Text>
                <Text style={styles.summaryLbl}>Tests Taken</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNum}>{totalQuestionsAnswered}</Text>
                <Text style={styles.summaryLbl}>Questions Solved</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNum, { color: COLORS.primary }]}>{avgAccuracy}%</Text>
                <Text style={styles.summaryLbl}>Avg Accuracy</Text>
              </View>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📝</Text>
              <Text style={styles.emptyTitle}>No Practice Tests Yet</Text>
              <Text style={styles.emptyText}>
                You haven't completed any topic practice tests yet. Choose any topic from the list to test your skills!
              </Text>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => router.replace('category-select')}
                activeOpacity={0.8}
              >
                <Text style={styles.startBtnText}>🚀 Start Practicing Now</Text>
              </TouchableOpacity>
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
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  headerBanner: {
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.small,
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
    lineHeight: 18,
  },
  backToPracticeBtn: {
    backgroundColor: COLORS.primaryLight || '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  backToPracticeBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...SHADOWS.small,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryLbl: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 2,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e5e7eb',
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  topicBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  topicBadgeText: {
    color: '#6d28d9',
    fontSize: 11,
    fontWeight: '700',
  },
  instantBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  instantBadgeText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray500,
    marginLeft: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scoreCol: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 2,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 4,
  },
  unlockedBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  unlockedBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.small,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

