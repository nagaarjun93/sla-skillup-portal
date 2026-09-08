import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ScoreSummary from '../components/ScoreSummary';
import ProtectedRoute from '../components/ProtectedRoute';
import { adminService } from '../services/adminService';
import { mockService } from '../services/mockService';
import api from '../services/api';
import { COLORS, SHADOWS } from '../styles/theme';

export default function ViewMistakesScreen({ route }) {
  const router = useUniversalRouter();
  const activeId = route?.params?.id || router.params?.id;
  const isMockParam = route?.params?.isMock || router.params?.isMock;
  const isMockResult = isMockParam === 'true' || isMockParam === true;

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdownStr, setCountdownStr] = useState('');

  useEffect(() => {
    if (activeId) {
      fetchResultDetails(activeId);
    } else {
      setLoading(false);
    }
  }, [activeId, isMockResult]);

  useEffect(() => {
    if (!details || details.canViewMistakes !== false) return;

    let remaining = details.msUntilReviewUnlock || 0;
    const update = () => {
      if (remaining <= 0) {
        setCountdownStr('Review is ready! Refresh to view answers.');
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
  }, [details]);

  const fetchResultDetails = async (targetId) => {
    const fetchId = targetId || activeId;
    if (!fetchId) return;

    setLoading(true);
    try {
      let data;
      if (isMockResult) {
        try {
          const res = await api.get(`/student/mock/results/${fetchId}/details`);
          data = res.data;
        } catch (err) {
          data = await mockService.getMockResultDetails(fetchId);
        }
      } else {
        try {
          const res = await api.get(`/results/${fetchId}/details`);
          data = res.data;
        } catch (err) {
          data = await adminService.getResultDetails(fetchId);
        }
      }
      setDetails(data);
    } catch (e) {
      console.error('Failed to fetch result breakdown:', e);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to fetch result breakdown');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.gray600 }}>Loading result breakdown...</Text>
      </View>
    );
  }

  const result = details?.result;
  const questions = details?.questions || [];
  const submittedAnswers = details?.submittedAnswers || {};

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Navbar title={isMockResult ? "Mock Test Result Breakdown" : "Student Result Breakdown"} />

        <ScrollView
          style={{
            flex: 1,
            ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
          }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={true}
        >
          {!result ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>📋</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 6 }}>
                Result Not Selected
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.gray600, textAlign: 'center', marginBottom: 16 }}>
                Please select a student result from the Weekly Test Results or Mock Test Results list.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
                onPress={() => router.back()}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>← Back to Results</Text>
              </TouchableOpacity>
            </View>
          ) : details?.canViewMistakes === false ? (
            <View style={styles.lockCard}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockTitle}>Answers & Mistakes Locked</Text>
              <Text style={styles.lockDesc}>
                To maintain exam integrity and prevent question leakage, detailed question breakdowns and correct answers unlock 24 hours after test submission.
              </Text>

              <View style={styles.countdownBox}>
                <Text style={styles.countdownLabel}>⏳ Review Unlocks In:</Text>
                <Text style={styles.countdownValue}>{countdownStr || 'Calculating...'}</Text>
              </View>

              <View style={styles.recordedScoreBox}>
                <Text style={styles.recordedScoreTitle}>Recorded Test Score</Text>
                <Text style={styles.recordedScoreNumber}>{result.score} / {result.total}</Text>
                <Text style={styles.recordedScoreSub}>
                  Correct: {result.correctAnswers || 0} | Incorrect: {result.wrongAnswers || 0}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.backButtonLarge}
                onPress={() => router.back('home')}
                activeOpacity={0.8}
              >
                <Text style={styles.backButtonText}>← Return to Home Screen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Student Header */}
              <View style={styles.studentCard}>
                <Text style={styles.studentName}>{result.student?.name || 'Student'}</Text>
                <Text style={styles.subText}>Email: {result.student?.email}</Text>
                <Text style={styles.subText}>Course: {result.student?.courseName}</Text>
                <Text style={styles.subText}>
                  Test: {isMockResult ? `Official Mock Test (${result.student?.assignedMockModel || 'Model Set'})` : (result.category || 'Weekly Test')}
                </Text>
              </View>

              {/* Score Breakdown */}
              <ScoreSummary
                score={result.score}
                total={result.total}
                correctAnswers={result.correctAnswers}
                wrongAnswers={result.wrongAnswers}
              />

              <View style={styles.answersSection}>
                <Text style={styles.sectionHeading}>
                  Detailed Answer Review ({questions.length} Questions)
                </Text>
                <Text style={styles.subText}>
                  Review the correct vs submitted answers for each question
                </Text>

                {questions.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No detailed question data found for this attempt.</Text>
                  </View>
                ) : (
                  questions.map((q, idx) => {
                    const submitted = submittedAnswers[q._id];
                    const isAnswered = submitted !== undefined && submitted !== null && submitted !== '';
                    const isCorrect = isAnswered && submitted.toString().trim().toUpperCase() === (q.correctAnswer || '').trim().toUpperCase();

                    return (
                      <View
                        key={q._id || idx}
                        style={[
                          styles.answerBox,
                          isCorrect
                            ? styles.correctBox
                            : isAnswered
                            ? styles.wrongBox
                            : styles.unansweredBox,
                        ]}
                      >
                        <View style={styles.qHeader}>
                          <Text style={styles.qNum}>Q{idx + 1}</Text>
                          <Text
                            style={[
                              styles.statusTag,
                              isCorrect
                                ? styles.correctTag
                                : isAnswered
                                ? styles.wrongTag
                                : styles.unansweredTag,
                            ]}
                          >
                            {isCorrect
                              ? '✅ CORRECT'
                              : isAnswered
                              ? '❌ WRONG'
                              : '⚠️ NOT ANSWERED'}
                          </Text>
                        </View>

                        <Text style={styles.qText}>{q.questionText}</Text>

                        <View style={styles.optionsList}>
                          {['A', 'B', 'C', 'D'].map((opt) => {
                            const optText = q[`option${opt}`];
                            if (!optText) return null;
                            const isSelected = isAnswered && submitted.toString().toUpperCase() === opt;
                            const isActuallyCorrect = (q.correctAnswer || '').toUpperCase() === opt;

                            return (
                              <View
                                key={opt}
                                style={[
                                  styles.optionRow,
                                  isSelected && !isActuallyCorrect && styles.selectedWrongOption,
                                  isActuallyCorrect && styles.actualCorrectOption,
                                ]}
                              >
                                <Text style={styles.optionLetter}>{opt}:</Text>
                                <Text style={styles.optionText}>{optText}</Text>
                                {isActuallyCorrect && (
                                  <Text style={styles.correctOptBadge}>✓ Correct Answer</Text>
                                )}
                                {isSelected && !isActuallyCorrect && (
                                  <Text style={styles.wrongOptBadge}>✗ Student Selected</Text>
                                )}
                              </View>
                            );
                          })}
                        </View>

                        <View style={styles.summaryBox}>
                          <Text style={styles.summaryLine}>
                            <Text style={styles.summaryLabel}>Student Answer: </Text>
                            <Text
                              style={[
                                styles.summaryValue,
                                isCorrect
                                  ? { color: COLORS.success }
                                  : isAnswered
                                  ? { color: COLORS.danger }
                                  : { color: COLORS.gray600, fontStyle: 'italic' },
                              ]}
                            >
                              {isAnswered ? `Option ${submitted}` : 'Not Answered (Skipped)'}
                            </Text>
                          </Text>
                          <Text style={styles.summaryLine}>
                            <Text style={styles.summaryLabel}>Correct Answer: </Text>
                            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                              Option {q.correctAnswer}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </>
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
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  studentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subText: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 2,
  },
  answersSection: {
    marginTop: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  answerBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  correctBox: {
    borderColor: '#bbf7d0',
  },
  wrongBox: {
    borderColor: '#fecaca',
  },
  unansweredBox: {
    borderColor: '#fed7aa',
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statusTag: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  correctTag: {
    backgroundColor: '#f0fdf4',
    color: COLORS.success,
    borderColor: '#bbf7d0',
  },
  wrongTag: {
    backgroundColor: '#fef2f2',
    color: COLORS.danger,
    borderColor: '#fecaca',
  },
  unansweredTag: {
    backgroundColor: '#fff7ed',
    color: '#ea580c',
    borderColor: '#fed7aa',
  },
  correctOptBadge: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  wrongOptBadge: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 14,
    lineHeight: 22,
  },
  optionsList: {
    gap: 8,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedWrongOption: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  actualCorrectOption: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  optionLetter: {
    fontWeight: '700',
    marginRight: 8,
    color: COLORS.text,
  },
  optionText: {
    flex: 1,
    color: COLORS.text,
  },
  summaryBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: 12,
  },
  summaryLine: {
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: '600',
    color: COLORS.gray600,
    fontSize: 13,
  },
  summaryValue: {
    fontWeight: '800',
    color: COLORS.primary,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    paddingHorizontal: 10,
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
    marginBottom: 20,
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
  recordedScoreBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordedScoreTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  recordedScoreNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  recordedScoreSub: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  backButtonLarge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  }
});

