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

export default function TopicQuestionsScreen() {
  const router = useUniversalRouter();
  const { category, topic, title } = router.params || {};

  const [questions, setQuestions] = useState([]);
  const [showSolutionMap, setShowSolutionMap] = useState({});
  const [dbDuration, setDbDuration] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
    fetchDuration();
  }, []);

  const fetchDuration = async () => {
    try {
      const details = await examService.getCategoryDetails();
      const match = (details || []).find(d => d.category === category || d.category === title || d.name === title || d.name === topic);
      if (match && match.durationMinutes) {
        setDbDuration(match.durationMinutes);
      }
    } catch (e) {
      console.warn('Could not load category duration:', e);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await examService.getExamQuestions({
        category: category || title,
        topic: topic || title || category,
        title: title || topic || category,
        practice: 'true',
        limit: 100,
      });
      setQuestions(res.questions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSolution = (id) => {
    setShowSolutionMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStartTimedExam = () => {
    router.push({
      pathname: '/exam',
      params: {
        category,
        topic: topic || title || category,
        title: title || category,
        duration: dbDuration,
      },
    });
  };

  const renderQuestionCard = (item, index) => {
    const isSolutionVisible = !!showSolutionMap[item._id];

    return (
      <View key={item._id || index} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.qNum}>Question #{index + 1}</Text>
          {item.difficultyLevel && (
            <Text style={styles.difficultyBadge}>{item.difficultyLevel}</Text>
          )}
        </View>

        <Text style={styles.qText}>{item.questionText}</Text>

        <View style={styles.optionsGrid}>
          <View style={styles.optItem}>
            <Text style={styles.optLetter}>A</Text>
            <Text style={styles.optText}>{item.optionA}</Text>
          </View>
          <View style={styles.optItem}>
            <Text style={styles.optLetter}>B</Text>
            <Text style={styles.optText}>{item.optionB}</Text>
          </View>
          <View style={styles.optItem}>
            <Text style={styles.optLetter}>C</Text>
            <Text style={styles.optText}>{item.optionC}</Text>
          </View>
          <View style={styles.optItem}>
            <Text style={styles.optLetter}>D</Text>
            <Text style={styles.optText}>{item.optionD}</Text>
          </View>
        </View>

        {/* Toggle Solution / Answer Button */}
        <TouchableOpacity
          style={styles.solutionToggleBtn}
          onPress={() => toggleSolution(item._id)}
          activeOpacity={0.7}
        >
          <Text style={styles.solutionToggleText}>
            {isSolutionVisible ? '🙈 Hide Solution' : '💡 Show Solution & Answer'}
          </Text>
        </TouchableOpacity>

        {isSolutionVisible && (
          <View style={styles.solutionBox}>
            <Text style={styles.correctAnsText}>
              ✅ Correct Answer: Option {item.correctAnswer || 'N/A'}
            </Text>
            {item.explanation ? (
              <Text style={styles.explanationText}>
                <Text style={{ fontWeight: '700' }}>Explanation:</Text> {item.explanation}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <ProtectedRoute roleRequired="student">
      <View style={styles.container}>
        <Navbar title={title || category || 'Practice Questions'} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Header Mode Banner */}
          <View style={styles.modeBanner}>
            <View style={styles.bannerTextCol}>
              <Text style={styles.modeTitle}>📄 Paper & Pen Practice Mode</Text>
              <Text style={styles.modeSub}>
                Use your notebook and pen to solve these questions. Click 'Show Solution' to check your work.
              </Text>
            </View>

            <TouchableOpacity style={styles.timedModeBtn} onPress={handleStartTimedExam}>
              <Text style={styles.timedModeBtnText}>⏱️ Start Timed Test</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : questions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No Questions Uploaded Yet</Text>
              <Text style={styles.emptySub}>
                Your faculty/admin will upload practice questions for "{title || category}" soon.
              </Text>
            </View>
          ) : (
            <View style={styles.questionsList}>
              <Text style={styles.listHeaderTitle}>
                Showing {questions.length} Practice Questions for "{title || category}":
              </Text>
              {questions.map(renderQuestionCard)}
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
    paddingBottom: 60,
  },
  modeBanner: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  bannerTextCol: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  modeSub: {
    fontSize: 13,
    color: COLORS.gray600,
    lineHeight: 18,
  },
  timedModeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timedModeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  listHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  questionsList: {
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qNum: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  difficultyBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  optionsGrid: {
    gap: 8,
    marginBottom: 14,
  },
  optItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  optLetter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
  },
  optText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  solutionToggleBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.selectedBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.selectedBorder,
  },
  solutionToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  solutionBox: {
    marginTop: 10,
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    padding: 12,
    borderRadius: 8,
  },
  correctAnsText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13,
    color: COLORS.gray600,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: 'center',
  },
});
