import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import QuestionCard from '../components/QuestionCard';
import ProtectedRoute from '../components/ProtectedRoute';
import { examService } from '../services/examService';
import { mockService } from '../services/mockService';
import { COLORS, SHADOWS } from '../styles/theme';

// Inject left-side scrollbar style on web only once
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'exam-left-scrollbar-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Flip the question scroll area so scrollbar appears on LEFT */
      .exam-question-scroll {
        direction: rtl;
        overflow-y: auto !important;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: #1e3a8a #f1f5f9;
      }
      /* Restore LTR for the actual content inside */
      .exam-question-scroll > * {
        direction: ltr;
      }
      /* Style the scrollbar track + thumb (webkit) */
      .exam-question-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .exam-question-scroll::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }
      .exam-question-scroll::-webkit-scrollbar-thumb {
        background: #1e3a8a;
        border-radius: 4px;
      }
      .exam-question-scroll::-webkit-scrollbar-thumb:hover {
        background: #2563eb;
      }
      /* Remove the default body/html right-side scrollbar on this page */
      body:has(.exam-question-scroll) {
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function ExamScreen() {
  const router = useUniversalRouter();
  const { category, topic, title, weeklyTestId, duration = 30, isMock } = router.params || {};
  const isMockExam = isMock === 'true' || isMock === true;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(Number(duration) * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchExamData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 && !loading) {
      handleFinalSubmit(true);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, loading]);

  const fetchExamData = async () => {
    setLoading(true);
    try {
      if (isMockExam) {
        // ── Mock Exam: fetch from mock question bank ──
        const res = await mockService.getStudentMockExam();
        setQuestions(res.questions || []);
        if (res.durationMinutes) {
          setTimeLeft(Number(res.durationMinutes) * 60);
        }
      } else {
        // ── Regular Exam: fetch from normal question bank ──
        const res = await examService.getExamQuestions({
          category: category || title,
          topic: topic || title || category,
          title: title || topic || category,
          weeklyTestId,
          limit: 100,
        });
        setQuestions(res.questions || []);
        if (res.durationMinutes) {
          setTimeLeft(Number(res.durationMinutes) * 60);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load exam questions');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (optionKey) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: optionKey,
    }));
  };

  const handleToggleFlag = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setFlagged((prev) => ({
      ...prev,
      [currentQ._id]: !prev[currentQ._id],
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = async (auto = false) => {
    setConfirmModalVisible(false);
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const timeTaken = Number(duration) * 60 - timeLeft;

      if (isMockExam) {
        // ── Mock Exam Submit ──
        await mockService.submitStudentMockExam({ answers, timeTaken });
        if (Platform.OS === 'web') {
          window.alert(auto
            ? '⏱ Time Expired! Your mock test has been submitted.'
            : '✅ Mock Test Submitted Successfully! Your result has been recorded.');
          router.replace('home');
        } else {
          Alert.alert(
            auto ? 'Time Expired' : 'Mock Test Submitted',
            'Your mock test has been submitted. Redirecting to home.',
            [{ text: 'OK', onPress: () => router.replace('home') }]
          );
        }
      } else {
        // ── Regular Exam Submit ──
        await examService.submitExamResult({
          category: category || 'General',
          weeklyTestId: weeklyTestId || null,
          answers,
          timeTaken,
        });
        if (Platform.OS === 'web') {
          window.alert(auto ? 'Time Expired! Your test submission has been recorded.' : 'Test Submitted Successfully!');
          router.replace('previous-tests');
        } else {
          Alert.alert(
            auto ? 'Time Expired' : 'Submitted Successfully',
            'Your test submission has been recorded. Redirecting to your finished tests history.',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace('previous-tests');
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Submission Error: ' + (error.response?.data?.message || 'Failed to submit test'));
      } else {
        Alert.alert('Submission Error', error.response?.data?.message || 'Failed to submit test');
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading exam questions...</Text>
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Submitting test responses...</Text>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const attemptedCount = Object.keys(answers).length;

  return (
    <ProtectedRoute roleRequired="student">
      <View style={styles.container}>
        <Navbar title={category || 'Aptitude Test'} showLogout={false} />

        {/* Top Status Bar: Timer & Progress */}
        <View style={styles.statusBar}>
          <View>
            <Text style={styles.timerTitle}>Time Remaining</Text>
            <Text style={[styles.timerValue, timeLeft < 300 && styles.timerWarning]}>
              ⏱ {formatTime(timeLeft)}
            </Text>
          </View>

          <View style={styles.attemptBox}>
            <Text style={styles.attemptText}>
              Answered: <Text style={styles.attemptHighlight}>{attemptedCount}</Text> / {questions.length}
            </Text>
          </View>

          <TouchableOpacity style={styles.topSubmitBtn} onPress={() => setConfirmModalVisible(true)}>
            <Text style={styles.topSubmitText}>Submit Test</Text>
          </TouchableOpacity>
        </View>

        {/* Question Navigator */}
        <View style={styles.navContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalNavScroll}>
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = !!answers[q._id];
              const isFlag = !!flagged[q._id];

              let boxStyle = styles.navBoxUnanswered;
              if (isAnswered) boxStyle = styles.navBoxAnswered;
              if (isFlag) boxStyle = styles.navBoxFlagged;
              if (isCurrent) boxStyle = styles.navBoxCurrent;

              return (
                <TouchableOpacity
                  key={q._id || idx}
                  style={[styles.navBox, boxStyle]}
                  onPress={() => setCurrentIndex(idx)}
                >
                  <Text style={[styles.navText, (isCurrent || isAnswered || isFlag) && styles.navTextWhite]}>
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Question Area — left-side scrollbar on web via direction:rtl trick */}
        <ScrollView
          contentContainerStyle={styles.questionScroll}
          style={styles.questionScrollView}
          showsVerticalScrollIndicator={Platform.OS !== 'web'}
          {...(Platform.OS === 'web' ? { className: 'exam-question-scroll' } : {})}
        >
          {currentQ ? (
            <QuestionCard
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              question={currentQ}
              selectedAnswer={answers[currentQ._id]}
              onSelectAnswer={handleSelectAnswer}
              isFlagged={flagged[currentQ._id]}
              onToggleFlag={handleToggleFlag}
            />
          ) : (
            <Text style={styles.emptyText}>No question content available.</Text>
          )}
        </ScrollView>

        {/* Bottom Control Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.controlBtn, currentIndex === 0 && styles.disabledControlBtn]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Text style={styles.controlBtnText}>← Previous</Text>
          </TouchableOpacity>

          {currentIndex < questions.length - 1 ? (
            <TouchableOpacity style={styles.primaryControlBtn} onPress={handleNext}>
              <Text style={styles.primaryControlText}>Save & Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitControlBtn} onPress={() => setConfirmModalVisible(true)}>
              <Text style={styles.primaryControlText}>Submit Test</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Confirmation Modal */}
        <Modal visible={confirmModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Confirm Test Submission</Text>
              <Text style={styles.modalMessage}>
                You have answered {attemptedCount} out of {questions.length} questions. Are you sure you want to submit?
              </Text>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setConfirmModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Continue Test</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => handleFinalSubmit(false)}>
                  <Text style={styles.modalConfirmText}>Yes, Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // On web: prevent the page body from also having a scrollbar
    ...(Platform.OS === 'web' ? { overflow: 'hidden' } : {}),
  },
  questionScrollView: {
    flex: 1,
    // direction:rtl is handled by the injected CSS class .exam-question-scroll on web
    // On native, just a plain scrollable view
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.gray600,
    fontSize: 14,
  },
  statusBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  timerTitle: {
    fontSize: 10,
    color: COLORS.gray600,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  timerValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  timerWarning: {
    color: COLORS.danger,
  },
  attemptBox: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  attemptText: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '600',
  },
  attemptHighlight: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  topSubmitBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  topSubmitText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  navContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  horizontalNavScroll: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  navBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBoxUnanswered: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  navBoxAnswered: {
    backgroundColor: COLORS.success,
  },
  navBoxFlagged: {
    backgroundColor: COLORS.warning,
  },
  navBoxCurrent: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.brandAccent,
  },
  navText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  navTextWhite: {
    color: '#ffffff',
  },
  questionScroll: {
    padding: 16,
  },
  emptyText: {
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 40,
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  controlBtn: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
  },
  disabledControlBtn: {
    opacity: 0.5,
  },
  controlBtnText: {
    color: COLORS.gray600,
    fontWeight: '700',
    fontSize: 14,
  },
  primaryControlBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 130,
    alignItems: 'center',
  },
  submitControlBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 130,
    alignItems: 'center',
  },
  primaryControlText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.gray600,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
  },
  modalCancelText: {
    color: COLORS.gray600,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

