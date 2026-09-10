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

export default function CategorySelectScreen({ route }) {
  const router = useUniversalRouter();
  const initialTab = route?.params?.tab || router.params?.tab || 'topics';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [topics, setTopics] = useState([]);
  const [dbCategories, setDbCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [topicHistory, setTopicHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchData();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (router.params?.tab) {
      setActiveTab(router.params.tab);
    }
  }, [router.params?.tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topicsData, catDetails] = await Promise.all([
        examService.getTopics(),
        examService.getCategoryDetails(),
      ]);

      setTopics(topicsData || []);

      const catMap = {};
      (catDetails || []).forEach(item => {
        catMap[item.category] = item;
      });
      setDbCategories(catMap);
    } catch (error) {
      console.error('Error fetching categories and topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await examService.getStudentTopicHistory();
      setTopicHistory(data || []);
    } catch (e) {
      console.error('Error fetching topic history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const aptitudeTopics = topics.filter(t => (t.type || 'aptitude') === 'aptitude');
  const reasoningTopics = topics.filter(t => t.type === 'reasoning');

  // Open Paper & Pen Practice View for selected topic
  const handleOpenPaperPractice = (topicObj) => {
    const categoryName = topicObj.category || topicObj.name;
    router.push({
      pathname: '/topic-questions',
      params: {
        category: categoryName,
        topic: topicObj.name,
        title: topicObj.name,
      },
    });
  };

  // Start Timed Practice Exam for selected topic (Dynamic duration from DB)
  const handleStartTimedExam = (topicObj) => {
    const categoryName = topicObj.category || topicObj.name;
    const dbInfo = dbCategories[topicObj.name] || dbCategories[categoryName];
    router.push({
      pathname: '/exam',
      params: {
        category: categoryName,
        topic: topicObj.name,
        title: topicObj.name,
        duration: dbInfo?.durationMinutes || 30,
      },
    });
  };

  const renderTopicCard = (item) => {
    const categoryName = item.category || item.name;
    const dbInfo = dbCategories[item.name] || dbCategories[categoryName];
    const qCount = dbInfo ? dbInfo.totalQuestions : 0;
    const duration = dbInfo ? dbInfo.durationMinutes : 30;

    return (
      <View key={item._id || item.id || item.name} style={styles.categoryCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.topicIcon}>{item.icon || '📚'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.qCountBadge}>
                {qCount} Questions in DB
              </Text>
              <Text style={styles.durationBadge}>
                ⏱ {duration} Mins
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.paperPracticeBtn}
            onPress={() => handleOpenPaperPractice(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.paperBtnText}>📝 Practice (Q&A)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.timedExamBtn}
            onPress={() => handleStartTimedExam(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.timedBtnText}>⏱ Take Exam</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHistoryCard = (item) => {
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
      <View key={item._id} style={styles.historyCard}>
        <View style={styles.historyTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.topicBadge}>
                <Text style={styles.topicBadgeText}>{item.category || 'General'}</Text>
              </View>
              <View style={styles.instantBadge}>
                <Text style={styles.instantBadgeText}>⚡ Instant Review</Text>
              </View>
            </View>
            <Text style={styles.historyTitle}>{item.category || 'Topic Practice Exam'}</Text>
          </View>
          <Text style={styles.historyDateText}>{formattedDate}</Text>
        </View>

        <View style={styles.historyScoreRow}>
          <View style={styles.historyScoreCol}>
            <Text style={[styles.historyScoreNum, { color: COLORS.primary }]}>
              {item.score ?? 0} / {item.total ?? 0}
            </Text>
            <Text style={styles.historyScoreLbl}>Score</Text>
          </View>

          <View style={styles.historyScoreCol}>
            <Text
              style={[
                styles.historyScoreNum,
                { color: accuracy >= 70 ? COLORS.success : accuracy >= 40 ? '#f59e0b' : COLORS.danger },
              ]}
            >
              {accuracy}%
            </Text>
            <Text style={styles.historyScoreLbl}>Accuracy</Text>
          </View>

          <View style={styles.historyScoreCol}>
            <Text style={[styles.historyScoreNum, { color: COLORS.success }]}>
              {item.correctAnswers ?? item.score ?? 0} ✅
            </Text>
            <Text style={styles.historyScoreLbl}>Correct</Text>
          </View>

          <View style={styles.historyScoreCol}>
            <Text style={[styles.historyScoreNum, { color: COLORS.danger }]}>
              {item.wrongAnswers ?? Math.max(0, (item.total || 0) - (item.score || 0))} ❌
            </Text>
            <Text style={styles.historyScoreLbl}>Mistakes</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.historyReviewBtn}
          onPress={() => router.push('/view-mistakes', { id: item._id })}
          activeOpacity={0.8}
        >
          <Text style={styles.historyReviewBtnText}>📋 Review Mistakes & Answers →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const totalTests = topicHistory.length;
  const totalQuestionsAnswered = topicHistory.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalScore = topicHistory.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const avgAccuracy = totalQuestionsAnswered > 0
    ? Math.round((totalScore / totalQuestionsAnswered) * 100)
    : 0;

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Navbar title="Practice by Topic" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <Text style={styles.heading}>Topic Practice Hub</Text>
            <Text style={styles.subheading}>
              Practice with questions & answers or take timed exams. Review your practice mistakes anytime!
            </Text>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'topics' && styles.tabButtonActive]}
                onPress={() => setActiveTab('topics')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'topics' && styles.tabTextActive]}>
                  📚 Practice Topics
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                onPress={() => {
                  setActiveTab('history');
                  fetchHistory();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                  📜 Practice History {topicHistory.length > 0 ? `(${topicHistory.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab 1: Topics List */}
          {activeTab === 'topics' && (
            loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
              <>
                {/* Aptitude Topics Section */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🔢 Aptitude Topics ({aptitudeTopics.length})</Text>
                </View>
                <View style={styles.topicGrid}>
                  {aptitudeTopics.map(renderTopicCard)}
                </View>

                {/* Reasoning Topics Section */}
                <View style={[styles.sectionHeader, { marginTop: 28 }]}>
                  <Text style={styles.sectionTitle}>🧠 Reasoning Topics ({reasoningTopics.length})</Text>
                </View>
                <View style={styles.topicGrid}>
                  {reasoningTopics.map(renderTopicCard)}
                </View>
              </>
            )
          )}

          {/* Tab 2: Practice History */}
          {activeTab === 'history' && (
            loadingHistory ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
              <>
                {topicHistory.length > 0 && (
                  <View style={styles.summaryBar}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryNum}>{totalTests}</Text>
                      <Text style={styles.summaryLbl}>Tests Completed</Text>
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

                {topicHistory.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={{ fontSize: 44, marginBottom: 12 }}>📝</Text>
                    <Text style={styles.emptyTitle}>No Practice Tests Yet</Text>
                    <Text style={styles.emptyText}>
                      You haven't completed any topic practice tests yet. Select any topic to test yourself!
                    </Text>
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => setActiveTab('topics')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.startBtnText}>🚀 Start Practicing Now</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.historyList}>
                    {topicHistory.map(renderHistoryCard)}
                  </View>
                )}
              </>
            )
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
    marginBottom: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    ...SHADOWS.small,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  sectionHeader: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  topicGrid: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  topicIcon: {
    fontSize: 26,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qCountBadge: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    backgroundColor: COLORS.selectedBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationBadge: {
    fontSize: 11,
    color: COLORS.gray600,
    fontWeight: '600',
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionsRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 10,
  },
  paperPracticeBtn: {
    flex: 1,
    backgroundColor: COLORS.selectedBg,
    borderWidth: 1,
    borderColor: COLORS.selectedBorder,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  paperBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  timedExamBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  timedBtnText: {
    color: '#ffffff',
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
  historyList: {
    gap: 14,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 12,
  },
  historyTopRow: {
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
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  historyDateText: {
    fontSize: 12,
    color: COLORS.gray500,
    marginLeft: 8,
  },
  historyScoreRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyScoreCol: {
    alignItems: 'center',
  },
  historyScoreNum: {
    fontSize: 15,
    fontWeight: '800',
  },
  historyScoreLbl: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 2,
    fontWeight: '600',
  },
  historyReviewBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  historyReviewBtnText: {
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
