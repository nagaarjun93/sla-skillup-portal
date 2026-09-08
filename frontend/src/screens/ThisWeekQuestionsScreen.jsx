import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { adminService } from '../services/adminService';
import { weeklyService } from '../services/weeklyService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function ThisWeekQuestionsScreen() {
  const router = useUniversalRouter();
  const { testId: initialTestId } = router.params || {};

  const [weeklyTests, setWeeklyTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editOptionA, setEditOptionA] = useState('');
  const [editOptionB, setEditOptionB] = useState('');
  const [editOptionC, setEditOptionC] = useState('');
  const [editOptionD, setEditOptionD] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('A');
  const [editExplanation, setEditExplanation] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Load all weekly tests on mount
  useEffect(() => {
    loadWeeklyTests();
  }, []);

  const loadWeeklyTests = async () => {
    setLoadingTests(true);
    try {
      const tests = await weeklyService.getAllWeeklyTestsAdmin();
      const testList = tests || [];
      setWeeklyTests(testList);

      if (testList.length > 0) {
        // Priority: 1. passed initialTestId, 2. active: true test, 3. first test
        let target = null;
        if (initialTestId) {
          target = testList.find((t) => t._id === initialTestId);
        }
        if (!target) {
          target = testList.find((t) => t.active === true) || testList[0];
        }
        setSelectedTest(target);
        if (target) {
          fetchQuestionsForTest(target._id);
        }
      }
    } catch (e) {
      console.error('Failed to load weekly tests', e);
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchQuestionsForTest = async (testId) => {
    if (!testId) return;
    setLoadingQuestions(true);
    try {
      const data = await adminService.getAllQuestions({ weeklyTestId: testId });
      setQuestions(data || []);
    } catch (e) {
      console.error('Failed to fetch questions for weekly test', e);
      Alert.alert('Error', 'Failed to load test questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSelectTest = (test) => {
    setSelectedTest(test);
    setSearchQuery('');
    fetchQuestionsForTest(test._id);
  };

  // Open Edit Modal with prefilled question data
  const handleOpenEdit = (q) => {
    setEditingQuestionId(q._id);
    setEditQuestionText(q.questionText || '');
    setEditOptionA(q.optionA || '');
    setEditOptionB(q.optionB || '');
    setEditOptionC(q.optionC || '');
    setEditOptionD(q.optionD || '');
    setEditCorrectAnswer((q.correctAnswer || 'A').toUpperCase().trim());
    setEditExplanation(q.explanation || '');
    setEditModalVisible(true);
  };

  // Save changes to Question in DB
  const handleSaveEdit = async () => {
    if (!editQuestionText.trim() || !editOptionA.trim() || !editOptionB.trim() || !editOptionC.trim() || !editOptionD.trim()) {
      Alert.alert('Validation', 'Question text and all 4 options are required');
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await adminService.updateQuestion(editingQuestionId, {
        questionText: editQuestionText.trim(),
        optionA: editOptionA.trim(),
        optionB: editOptionB.trim(),
        optionC: editOptionC.trim(),
        optionD: editOptionD.trim(),
        correctAnswer: editCorrectAnswer,
        explanation: editExplanation.trim(),
      });

      // Update local state instantly
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === editingQuestionId
            ? {
                ...q,
                questionText: editQuestionText.trim(),
                optionA: editOptionA.trim(),
                optionB: editOptionB.trim(),
                optionC: editOptionC.trim(),
                optionD: editOptionD.trim(),
                correctAnswer: editCorrectAnswer,
                explanation: editExplanation.trim(),
              }
            : q
        )
      );

      setEditModalVisible(false);
      Alert.alert('✅ Saved', 'Question and options updated successfully!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.message || 'Failed to update question');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = (qId) => {
    Alert.alert('Delete Question', 'Are you sure you want to delete this question from this weekly test?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteQuestion(qId);
            setQuestions((prev) => prev.filter((q) => q._id !== qId));
            Alert.alert('Deleted', 'Question removed successfully');
          } catch (e) {
            Alert.alert('Error', 'Failed to delete question');
          }
        },
      },
    ]);
  };

  // Live filter questions
  const filteredQuestions = questions.filter((q) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (q.questionText || '').toLowerCase().includes(query) ||
      (q.optionA || '').toLowerCase().includes(query) ||
      (q.optionB || '').toLowerCase().includes(query) ||
      (q.optionC || '').toLowerCase().includes(query) ||
      (q.optionD || '').toLowerCase().includes(query) ||
      (q.topic || '').toLowerCase().includes(query)
    );
  });

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="This Week's Test Questions" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Top Banner: Active Weekly Test Selector */}
          <View style={styles.headerCard}>
            <View style={styles.bannerTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerBadge}>🔥 LIVE WEEKLY TEST</Text>
                <Text style={styles.bannerTitle}>
                  {selectedTest ? (selectedTest.weekName || selectedTest.title || `Week #${selectedTest.weekNumber}`) : 'No Active Test Selected'}
                </Text>
                {selectedTest && (
                  <Text style={styles.bannerSub}>
                    Topic: {selectedTest.topic} | Duration: {selectedTest.duration} mins | Total: {questions.length} Questions
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => router.push('/question-upload')}
              >
                <Text style={styles.uploadBtnText}>📁 Upload Questions</Text>
              </TouchableOpacity>
            </View>

            {/* Week Switcher Chips if multiple tests exist */}
            {weeklyTests.length > 1 && (
              <View style={styles.testSelectorRow}>
                <Text style={styles.selectorLabel}>Switch Week:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {weeklyTests.map((t) => {
                      const isSelected = selectedTest && selectedTest._id === t._id;
                      return (
                        <TouchableOpacity
                          key={t._id}
                          style={[styles.testChip, isSelected && styles.activeTestChip]}
                          onPress={() => handleSelectTest(t)}
                        >
                          <Text style={[styles.testChipText, isSelected && styles.activeTestChipText]}>
                            {t.active ? '🟢 ' : ''}Week #{t.weekNumber || 1}: {t.weekName || t.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Search & Actions Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search questions or options in this test..."
                placeholderTextColor={COLORS.gray400}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => selectedTest && fetchQuestionsForTest(selectedTest._id)}
            >
              <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>

          {searchQuery.trim().length > 0 && (
            <View style={styles.resultChip}>
              <Text style={styles.resultChipText}>
                {filteredQuestions.length === 0
                  ? 'No questions matched'
                  : `${filteredQuestions.length} of ${questions.length} questions matched`}
              </Text>
            </View>
          )}

          {/* Questions List */}
          {loadingTests || loadingQuestions ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading test questions...</Text>
            </View>
          ) : !selectedTest ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No Weekly Test Found</Text>
              <Text style={styles.emptySub}>Create a weekly test first to assign questions.</Text>
              <TouchableOpacity
                style={styles.createTestBtn}
                onPress={() => router.push('/weekly-test-management')}
              >
                <Text style={styles.createTestBtnText}>+ Create Weekly Test</Text>
              </TouchableOpacity>
            </View>
          ) : filteredQuestions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery.trim()
                  ? `No questions found for "${searchQuery}"`
                  : `No questions uploaded for this week yet (${selectedTest.weekName || selectedTest.title})`}
              </Text>
              <Text style={styles.emptySub}>
                Upload CSV spreadsheet or questions file to attach questions to this weekly test.
              </Text>
              <TouchableOpacity
                style={styles.createTestBtn}
                onPress={() => router.push('/question-upload')}
              >
                <Text style={styles.createTestBtnText}>📁 Upload Questions to This Test</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.questionsList}>
              <Text style={styles.listHeader}>
                All Questions in This Test ({filteredQuestions.length})
              </Text>

              {filteredQuestions.map((item, index) => {
                const correctOpt = (item.correctAnswer || 'A').toUpperCase().trim();
                return (
                  <View key={item._id || index} style={styles.qCard}>
                    {/* Top Row: Q# & Action Buttons */}
                    <View style={styles.qCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.qNumBadge}>
                          <Text style={styles.qNumText}>Q{index + 1}</Text>
                        </View>
                        {item.topic && (
                          <View style={styles.topicBadge}>
                            <Text style={styles.topicBadgeText}>{item.topic}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => handleOpenEdit(item)}
                        >
                          <Text style={styles.editBtnText}>✏️ Edit Question / Options</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteQuestion(item._id)}
                        >
                          <Text style={styles.deleteBtnText}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Question Text */}
                    <Text style={styles.qText}>{item.questionText}</Text>

                    {/* 4 Options Grid/List */}
                    <View style={styles.optionsList}>
                      {[
                        { key: 'A', text: item.optionA },
                        { key: 'B', text: item.optionB },
                        { key: 'C', text: item.optionC },
                        { key: 'D', text: item.optionD },
                      ].map((opt) => {
                        const isCorrect = correctOpt === opt.key;
                        return (
                          <View
                            key={opt.key}
                            style={[
                              styles.optionCard,
                              isCorrect && styles.correctOptionCard,
                            ]}
                          >
                            <View
                              style={[
                                styles.optionKeyCircle,
                                isCorrect && styles.correctOptionKeyCircle,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.optionKeyText,
                                  isCorrect && styles.correctOptionKeyText,
                                ]}
                              >
                                {opt.key}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.optionCardText,
                                isCorrect && styles.correctOptionCardText,
                              ]}
                            >
                              {opt.text}
                            </Text>
                            {isCorrect && (
                              <View style={styles.correctPill}>
                                <Text style={styles.correctPillText}>✓ Correct</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    {/* Explanation if any */}
                    {item.explanation ? (
                      <View style={styles.explanationBox}>
                        <Text style={styles.explanationLabel}>💡 Explanation:</Text>
                        <Text style={styles.explanationText}>{item.explanation}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ── Edit Question Modal ────────────────────────────────────── */}
        <Modal visible={editModalVisible} transparent animationType="fade">
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>✏️ Edit Question & Options</Text>
                  <TouchableOpacity
                    onPress={() => setEditModalVisible(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight: '80vh' }}>
                  {/* Question Text */}
                  <Text style={styles.inputLabel}>Question Text *</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    value={editQuestionText}
                    onChangeText={setEditQuestionText}
                    placeholder="Enter question text..."
                    placeholderTextColor={COLORS.gray400}
                  />

                  {/* Options A, B, C, D */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Option A *</Text>
                  <TextInput
                    style={styles.input}
                    value={editOptionA}
                    onChangeText={setEditOptionA}
                    placeholder="Option A content..."
                    placeholderTextColor={COLORS.gray400}
                  />

                  <Text style={styles.inputLabel}>Option B *</Text>
                  <TextInput
                    style={styles.input}
                    value={editOptionB}
                    onChangeText={setEditOptionB}
                    placeholder="Option B content..."
                    placeholderTextColor={COLORS.gray400}
                  />

                  <Text style={styles.inputLabel}>Option C *</Text>
                  <TextInput
                    style={styles.input}
                    value={editOptionC}
                    onChangeText={setEditOptionC}
                    placeholder="Option C content..."
                    placeholderTextColor={COLORS.gray400}
                  />

                  <Text style={styles.inputLabel}>Option D *</Text>
                  <TextInput
                    style={styles.input}
                    value={editOptionD}
                    onChangeText={setEditOptionD}
                    placeholder="Option D content..."
                    placeholderTextColor={COLORS.gray400}
                  />

                  {/* Correct Answer Selector */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                    Correct Answer (Select Option) *
                  </Text>
                  <View style={styles.correctSelectorRow}>
                    {['A', 'B', 'C', 'D'].map((optKey) => {
                      const active = editCorrectAnswer === optKey;
                      return (
                        <TouchableOpacity
                          key={optKey}
                          style={[
                            styles.correctSelectBtn,
                            active && styles.activeCorrectSelectBtn,
                          ]}
                          onPress={() => setEditCorrectAnswer(optKey)}
                        >
                          <Text
                            style={[
                              styles.correctSelectBtnText,
                              active && styles.activeCorrectSelectBtnText,
                            ]}
                          >
                            {active ? '✓ Option ' : 'Option '}
                            {optKey}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Explanation */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                    Explanation / Solution (Optional)
                  </Text>
                  <TextInput
                    style={[styles.textArea, { minHeight: 60 }]}
                    multiline
                    numberOfLines={3}
                    value={editExplanation}
                    onChangeText={setEditExplanation}
                    placeholder="Explanation for students..."
                    placeholderTextColor={COLORS.gray400}
                  />

                  {/* Modal Action Buttons */}
                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={styles.cancelModalBtn}
                      onPress={() => setEditModalVisible(false)}
                    >
                      <Text style={styles.cancelModalBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.saveModalBtn, savingEdit && styles.disabledBtn]}
                      onPress={handleSaveEdit}
                      disabled={savingEdit}
                    >
                      {savingEdit ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.saveModalBtnText}>💾 Save Question</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Top Banner Card
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    marginBottom: 14,
    ...SHADOWS.medium,
  },
  bannerTopRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
    gap: 12,
  },
  bannerBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 13,
    color: COLORS.gray600,
  },
  uploadBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    ...SHADOWS.small,
  },
  uploadBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Week Selector
  testSelectorRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  testChip: {
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  activeTestChip: {
    backgroundColor: '#eff6ff',
    borderColor: COLORS.primary,
  },
  testChipText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  activeTestChipText: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  // Search Row
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...SHADOWS.small,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 4,
    outlineStyle: 'none',
  },
  clearBtn: {
    paddingHorizontal: 6,
  },
  clearBtnText: {
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '700',
  },
  refreshBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.gray300,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  resultChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 12,
  },
  resultChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Questions List
  listHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  questionsList: {
    gap: 14,
  },
  qCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  qCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qNumBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  qNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  topicBadge: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  topicBadgeText: {
    fontSize: 11,
    color: COLORS.gray600,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '700',
  },
  qText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },

  // Options
  optionsList: {
    gap: 8,
    marginBottom: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  correctOptionCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  optionKeyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  correctOptionKeyCircle: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  optionKeyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  correctOptionKeyText: {
    color: '#ffffff',
  },
  optionCardText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  correctOptionCardText: {
    fontWeight: '700',
    color: '#15803d',
  },
  correctPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  correctPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },

  explanationBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  explanationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  explanationText: {
    fontSize: 12,
    color: '#78350f',
  },

  // Loader & Empty
  loaderBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.gray600,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  createTestBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createTestBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Modal Styles ──────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    outlineStyle: 'none',
  },
  textArea: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    minHeight: 80,
    textAlignVertical: 'top',
    outlineStyle: 'none',
  },
  correctSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  correctSelectBtn: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray300,
  },
  activeCorrectSelectBtn: {
    backgroundColor: '#dcfce7',
    borderColor: COLORS.success,
  },
  correctSelectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  activeCorrectSelectBtnText: {
    color: '#15803d',
    fontWeight: '800',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  cancelModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.gray200,
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  saveModalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  saveModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
