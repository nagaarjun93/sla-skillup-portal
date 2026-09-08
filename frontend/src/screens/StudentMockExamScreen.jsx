import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { mockService } from '../services/mockService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function StudentMockExamScreen() {
  const router = useUniversalRouter();

  const [hasAccess, setHasAccess] = useState(false);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [attemptedAt, setAttemptedAt] = useState(null);
  const [examInfo, setExamInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccessAndFetchInfo();
  }, []);

  const checkAccessAndFetchInfo = async () => {
    setLoading(true);
    try {
      // First: check if student already attempted
      try {
        const attemptCheck = await mockService.checkStudentAttempted();
        if (attemptCheck.alreadyAttempted) {
          setAlreadyAttempted(true);
          setAttemptedAt(attemptCheck.result?.submittedAt || null);
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore — proceed with normal access check
      }

      const accessRes = await mockService.checkStudentMockAccess();
      if (!accessRes.accessEnabled) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);
      const examData = await mockService.getStudentMockExam();
      setExamInfo(examData);
    } catch (error) {
      // If backend returns 403 with alreadyAttempted flag
      if (error?.response?.data?.alreadyAttempted) {
        setAlreadyAttempted(true);
        setAttemptedAt(error?.response?.data?.result?.submittedAt || null);
      } else {
        setHasAccess(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartMockExam = () => {
    if (!examInfo || !examInfo.questions) {
      Alert.alert('Error', 'Mock test questions unavailable');
      return;
    }

    router.push({
      pathname: '/exam',
      params: {
        category: 'Official Mock Test',
        duration: examInfo.durationMinutes || 45,
        isMock: 'true',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ProtectedRoute roleRequired="student">
      <View style={styles.container}>
        <Navbar title="Official Aptitude Mock Test" />

        <View style={styles.content}>
          {alreadyAttempted ? (
            /* ── Already Completed Card ── */
            <View style={styles.attemptedCard}>
              <Text style={styles.attemptedIcon}>🏁</Text>
              <Text style={styles.attemptedTitle}>Mock Test Already Completed</Text>
              <Text style={styles.attemptedSub}>
                You have already submitted the Official Mock Test.{'\n'}
                Only one attempt is allowed per student.
              </Text>
              {attemptedAt && (
                <View style={styles.attemptedDateBox}>
                  <Text style={styles.attemptedDateLabel}>Submitted On:</Text>
                  <Text style={styles.attemptedDate}>
                    {new Date(attemptedAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </Text>
                </View>
              )}
              <Text style={styles.attemptedNote}>
                📋 Your result has been recorded and is visible to your trainer/admin.
              </Text>
            </View>
          ) : !hasAccess ? (
            <View style={styles.accessDeniedCard}>
              <Text style={styles.deniedIcon}>🔒</Text>
              <Text style={styles.deniedTitle}>Mock Test Access Restricted</Text>
              <Text style={styles.deniedSub}>
                Mock test access has not been granted to your account yet. Please request your trainer or administrator to grant access.
              </Text>
            </View>
          ) : (
            <View style={styles.introCard}>
              <Text style={styles.badgeText}>🎯 Official SLA Mock Test</Text>

              <Text style={styles.examTitle}>{examInfo?.title || 'Comprehensive Aptitude Mock Test'}</Text>
              <Text style={styles.examSub}>
                This official mock test evaluates your readiness across all core quantitative, logical, and verbal categories.
              </Text>

              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{examInfo?.durationMinutes || 45} Minutes</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Questions:</Text>
                  <Text style={styles.detailValue}>{examInfo?.totalQuestions || 0} Questions</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rule:</Text>
                  <Text style={styles.detailValue}>Single Attempt Only ⚠️</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.startBtn} onPress={handleStartMockExam}>
                <Text style={styles.startBtnText}>Start Mock Test Now</Text>
              </TouchableOpacity>
            </View>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  accessDeniedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.medium,
  },
  deniedIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  deniedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.danger,
    marginBottom: 8,
  },
  deniedSub: {
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 18,
  },
  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    ...SHADOWS.medium,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  examTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  examSub: {
    fontSize: 14,
    color: COLORS.gray600,
    lineHeight: 20,
    marginBottom: 20,
  },
  detailsBox: {
    backgroundColor: COLORS.gray100,
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // ── Already Attempted Card ─────────────────────────────
  attemptedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fde68a',
    ...SHADOWS.medium,
  },
  attemptedIcon: {
    fontSize: 52,
    marginBottom: 14,
  },
  attemptedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 10,
    textAlign: 'center',
  },
  attemptedSub: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  attemptedDateBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  attemptedDateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  attemptedDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350f',
  },
  attemptedNote: {
    fontSize: 12,
    color: COLORS.gray600,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

