import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { mockService } from '../services/mockService';
import { adminService } from '../services/adminService';
import { COLORS, SHADOWS } from '../styles/theme';

const MODEL_SETS = [
  'Model 1', 'Model 2', 'Model 3', 'Model 4', 'Model 5',
  'Model 6', 'Model 7', 'Model 8', 'Model 9', 'Model 10'
];

export default function MockTestManagementScreen() {
  const [modelSets, setModelSets] = useState(MODEL_SETS);
  const [passingMarks, setPassingMarks] = useState('35');
  const [durationMinutes, setDurationMinutes] = useState('45');
  
  const [selectedUploadModel, setSelectedUploadModel] = useState('Model 1');
  const [selectedFilterModel, setSelectedFilterModel] = useState('All');
  
  const [modelStats, setModelStats] = useState([]);
  const [students, setStudents] = useState([]);
  const [mockQuestions, setMockQuestions] = useState([]);
  const [csvContent, setCsvContent] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [distributing, setDistributing] = useState(false);

  // ── Question Viewer Modal State ─────────────────────────
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [viewingModel, setViewingModel] = useState('Model 1');
  const [viewingQuestions, setViewingQuestions] = useState([]);
  const [loadingViewingQuestions, setLoadingViewingQuestions] = useState(false);
  const [viewerSearch, setViewerSearch] = useState('');
  const [clearingModel, setClearingModel] = useState(false);

  // ── Confirmation Modal State (Replace Existing) ────────
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmData, setConfirmData] = useState({
    model: '',
    existingCount: 0,
    pendingQuestions: []
  });

  // ── Search States ─────────────────────────────────────
  const [studentSearch, setStudentSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');

  // Live-filtered students (by name or course)
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.courseName || '').toLowerCase().includes(q) ||
      (s.trainerName || '').toLowerCase().includes(q)
    );
  });

  // Live-filtered mock questions (by question text or model)
  const filteredQuestions = mockQuestions.filter((q) => {
    const search = questionSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      (q.questionText || '').toLowerCase().includes(search) ||
      (q.modelSet || '').toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    fetchMockData();
  }, [selectedFilterModel]);

  const fetchMockData = async () => {
    setLoading(true);
    try {
      const settings = await mockService.getMockSettings();
      if (settings) {
        setPassingMarks(settings.passingMarks?.toString() || '35');
        setDurationMinutes(settings.durationMinutes?.toString() || '45');
      }

      const stats = await mockService.getMockModelsStats();
      setModelStats(stats || []);

      try {
        const modelsRes = await mockService.getMockModels();
        if (Array.isArray(modelsRes) && modelsRes.length > 0) {
          setModelSets(modelsRes);
        }
      } catch (err) {
        console.warn('Could not fetch dynamic models:', err);
      }

      const stList = await adminService.getAllStudents();
      setStudents(stList || []);

      const filterParams = selectedFilterModel !== 'All' ? { modelSet: selectedFilterModel } : {};
      const questions = await mockService.getMockQuestions(filterParams);
      setMockQuestions(questions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await mockService.updateMockSettings({
        passingMarks: Number(passingMarks),
        durationMinutes: Number(durationMinutes),
      });
      Alert.alert('Success', 'Mock test configuration settings updated!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update mock settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAssignStudentModel = async (studentId, modelSet) => {
    try {
      await mockService.assignStudentMockModel(studentId, modelSet);
      setStudents(prev =>
        prev.map(s => (s._id === studentId ? { ...s, assignedMockModel: modelSet } : s))
      );
      fetchMockData();
    } catch (e) {
      Alert.alert('Error', 'Failed to assign mock question model to student');
    }
  };

  const handleAutoDistributeModels = async () => {
    setDistributing(true);
    try {
      await mockService.autoDistributeMockModels();
      const successMsg = `✅ Auto-assigned 10 Mock Models across all students!`;
      if (Platform.OS === 'web') window.alert(successMsg);
      else Alert.alert('Success', successMsg);
      fetchMockData();
    } catch (e) {
      Alert.alert('Error', 'Failed to auto-distribute mock models');
    } finally {
      setDistributing(false);
    }
  };

  const handleOpenModelViewer = async (modelName) => {
    setSelectedUploadModel(modelName);
    setViewingModel(modelName);
    setViewerSearch('');
    setViewerModalVisible(true);
    setLoadingViewingQuestions(true);
    try {
      const qs = await mockService.getMockQuestions({ modelSet: modelName });
      setViewingQuestions(qs || []);
    } catch (e) {
      console.error('Failed to load model questions:', e);
      Alert.alert('Error', 'Failed to load questions for ' + modelName);
    } finally {
      setLoadingViewingQuestions(false);
    }
  };

  const handleClearModelQuestions = async () => {
    const modelToClear = viewingModel;
    const count = viewingQuestions.length;
    if (count === 0) return;

    const doClear = async () => {
      setClearingModel(true);
      try {
        await mockService.clearModelQuestions(modelToClear);
        setViewingQuestions([]);
        fetchMockData();
        const msg = `✅ Cleared all questions from ${modelToClear}`;
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Success', msg);
      } catch (err) {
        Alert.alert('Error', 'Failed to clear questions: ' + (err.message || 'Server error'));
      } finally {
        setClearingModel(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to permanently delete all ${count} questions in ${modelToClear}?`)) {
        await doClear();
      }
    } else {
      Alert.alert(
        'Clear Model Questions',
        `Are you sure you want to permanently delete all ${count} questions in ${modelToClear}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear All', style: 'destructive', onPress: doClear }
        ]
      );
    }
  };

  const handleDeleteSingleQuestionInViewer = async (qId) => {
    try {
      await mockService.deleteMockQuestion(qId);
      setViewingQuestions(prev => prev.filter(q => q._id !== qId));
      fetchMockData();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete question');
    }
  };

  const handleBulkMockCsv = async () => {
    if (!csvContent.trim()) {
      Alert.alert('Required', 'Paste mock question CSV content');
      return;
    }

    // Quote-aware CSV line splitter
    const splitCsvRow = (line) => {
      const parts = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else { inQ = !inQ; }
        } else if (ch === ',' && !inQ) {
          parts.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += ch;
        }
      }
      parts.push(cur.trim().replace(/^"|"$/g, ''));
      return parts;
    };

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const questions = [];

    // Check header row
    let startIdx = 0;
    let isCategoryInCol1 = false;
    if (lines.length > 0) {
      const headerParts = splitCsvRow(lines[0]).map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));
      if (headerParts.some(h => h.includes('question'))) {
        startIdx = 1; // skip header
        if (headerParts[1] && headerParts[1].includes('category')) {
          isCategoryInCol1 = true;
        }
      }
    }

    for (let i = startIdx; i < lines.length; i++) {
      const p = splitCsvRow(lines[i]);
      if (p.length < 5 || !p[0]) continue;

      let qText = p[0], optA = '', optB = '', optC = '', optD = '', ans = 'A', cat = 'Mock Test', top = 'General Aptitude';

      if (isCategoryInCol1 || (p.length >= 8 && ['A', 'B', 'C', 'D'].includes((p[7] || '').trim().toUpperCase()))) {
        // Format: Question, Category, Topic, OptionA, OptionB, OptionC, OptionD, CorrectAnswer
        cat = p[1] || 'Mock Test';
        top = p[2] || 'General Aptitude';
        optA = p[3] || '';
        optB = p[4] || '';
        optC = p[5] || '';
        optD = p[6] || '';
        ans = (p[7] || 'A').trim().toUpperCase();
      } else {
        // Format: Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Category, Topic
        optA = p[1] || '';
        optB = p[2] || '';
        optC = p[3] || '';
        optD = p[4] || '';
        ans = (p[5] || 'A').trim().toUpperCase();
        cat = p[6] || 'Mock Test';
        top = p[7] || 'General Aptitude';
      }

      if (['OPTION A', 'OPTION_A', 'OPT A', '1'].includes(ans)) ans = 'A';
      if (['OPTION B', 'OPTION_B', 'OPT B', '2'].includes(ans)) ans = 'B';
      if (['OPTION C', 'OPTION_C', 'OPT C', '3'].includes(ans)) ans = 'C';
      if (['OPTION D', 'OPTION_D', 'OPT D', '4'].includes(ans)) ans = 'D';

      if (qText && optA && optB && optC && optD) {
        questions.push({
          questionText: qText,
          optionA: optA,
          optionB: optB,
          optionC: optC,
          optionD: optD,
          correctAnswer: ['A', 'B', 'C', 'D'].includes(ans) ? ans : 'A',
          category: cat,
          topic: top,
          modelSet: selectedUploadModel
        });
      }
    }

    if (questions.length === 0) {
      Alert.alert('Format Error', 'No valid questions parsed. Please ensure each row has question text, 4 options, and correct answer (A/B/C/D).');
      return;
    }

    // Check if the selected model already has questions!
    const targetStat = modelStats.find(s => s.modelSet === selectedUploadModel);
    const existingCount = targetStat ? targetStat.questionCount : 0;

    if (existingCount > 0) {
      // Questions already exist in this model!
      // Prompt user with Confirmation Modal (Yes / No)
      setConfirmData({
        model: selectedUploadModel,
        existingCount,
        pendingQuestions: questions
      });
      setConfirmModalVisible(true);
      return;
    }

    // If no existing questions, upload directly
    await executeUpload(questions, selectedUploadModel, false);
  };

  const executeUpload = async (questions, modelName, replaceExisting) => {
    setUploadingCsv(true);
    setConfirmModalVisible(false);
    try {
      await mockService.saveBulkMockQuestions(questions, modelName, replaceExisting);
      const actionText = replaceExisting ? 'pazhaiya questions remove aagi pudhu' : '';
      const successMsg = `✅ ${modelName}-la ${actionText} ${questions.length} questions successfully upload panniyachu!`;
      if (Platform.OS === 'web') window.alert(successMsg);
      else Alert.alert('Success', successMsg);
      setCsvContent('');
      fetchMockData();
      if (viewerModalVisible && viewingModel === modelName) {
        handleOpenModelViewer(modelName);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to upload mock questions');
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleDeleteMockQ = (id) => {
    Alert.alert('Delete Mock Question', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mockService.deleteMockQuestion(id);
            setMockQuestions((prev) => prev.filter((q) => q._id !== id));
            fetchMockData();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete mock question');
          }
        },
      },
    ]);
  };

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Mock Test Management & Model Papers" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Top Settings Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ Mock Test Pass & Time Settings</Text>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Passing Marks Required</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={passingMarks}
                  onChangeText={setPassingMarks}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Duration (Minutes)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, savingSettings && styles.disabledBtn]}
              onPress={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>Save Mock Settings</Text>}
            </TouchableOpacity>
          </View>

          {/* 10 Model Question Paper Sets Overview */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📚 10 Mock Question Paper Models Overview</Text>
            <Text style={styles.sub}>
              Upload different question paper models (Model 1 to 10) so students get unique questions during mock exams.
            </Text>

            <View style={styles.modelsGrid}>
              {modelSets.map(m => {
                const stat = modelStats.find(s => s.modelSet === m) || { questionCount: 0, studentCount: 0 };
                const isSelected = selectedUploadModel === m;
                const hasQuestions = stat.questionCount > 0;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modelCard, isSelected && styles.selectedModelCard]}
                    onPress={() => handleOpenModelViewer(m)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modelHeaderRow}>
                      <Text style={[styles.modelTitle, isSelected && styles.selectedModelTitle]}>{m}</Text>
                      <View style={[styles.qCountBadge, hasQuestions ? styles.qCountBadgeActive : styles.qCountBadgeEmpty]}>
                        <Text style={[styles.qCountBadgeText, hasQuestions && styles.qCountBadgeTextActive]}>
                          {stat.questionCount} Qs
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.modelMeta}>📝 {stat.questionCount} Questions Active</Text>
                    <Text style={styles.modelMeta}>👥 {stat.studentCount} Students Assigned</Text>
                    <View style={styles.viewQsActionBtn}>
                      <Text style={styles.viewQsActionText}>👁️ Touch to View Questions</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Student Mock Question Paper Assignment Panel */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>👥 Assign Question Paper Models to Students</Text>
                <Text style={styles.sub}>Specify which Mock Model Paper (Model 1..10) each student will receive during mock test.</Text>
              </View>

              <TouchableOpacity
                style={[styles.autoDistributeBtn, distributing && styles.disabledBtn]}
                onPress={handleAutoDistributeModels}
                disabled={distributing}
              >
                {distributing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.autoDistributeText}>🔀 Auto-Assign Models across Students</Text>
                )}
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : students.length === 0 ? (
              <Text style={styles.emptyText}>No registered students found.</Text>
            ) : (
              <View style={styles.studentsList}>
                {/* Student Search Bar */}
                <View style={styles.searchBox}>
                  <View style={styles.searchRow}>
                    <Text style={styles.searchIconText}>🔍</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by Student Name, Course or Trainer..."
                      placeholderTextColor={COLORS.gray600}
                      value={studentSearch}
                      onChangeText={setStudentSearch}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                    {studentSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setStudentSearch('')} style={styles.clearXBtn}>
                        <Text style={styles.clearXText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {studentSearch.trim().length > 0 && (
                    <View style={styles.resultChip}>
                      <Text style={styles.resultChipText}>
                        {filteredStudents.length === 0
                          ? 'No students matched'
                          : `${filteredStudents.length} of ${students.length} students matched`}
                      </Text>
                    </View>
                  )}
                </View>

                {filteredStudents.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {studentSearch.trim() ? `No students found for "${studentSearch}"` : 'No registered students found.'}
                  </Text>
                ) : (
                  <View>
                    {filteredStudents.map((st) => {
                    const currentModel = st.assignedMockModel || 'Model 1';
                    return (
                      <View key={st._id} style={styles.studentItemCard}>
                        <View style={styles.stInfoCol}>
                          <Text style={styles.stName}>{st.name}</Text>
                          <Text style={styles.stSub}>{st.email} | {st.courseName || 'General'}</Text>
                        </View>

                        <View style={styles.modelPickerCol}>
                          <Text style={styles.assignedLabel}>Assigned Mock Paper:</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                            <View style={styles.modelChipsRow}>
                              {modelSets.map((m) => {
                                const active = currentModel === m;
                                return (
                                  <TouchableOpacity
                                    key={m}
                                    style={[styles.smallChip, active && styles.activeSmallChip]}
                                    onPress={() => handleAssignStudentModel(st._id, m)}
                                  >
                                    <Text style={[styles.smallChipText, active && styles.activeSmallChipText]}>
                                      {active ? '✓ ' : ''}{m}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </ScrollView>
                        </View>
                      </View>
                    );
                  })}
                  </View>
                )}
              </View>
            )}
          </View>


          {/* Bulk CSV Upload into Selected Model Set */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📁 Upload Mock Questions into Target Model Set ({selectedUploadModel})</Text>
            <Text style={styles.sub}>
              Select target model above, then paste CSV content below (questionText, optionA, optionB, optionC, optionD, correctAnswer).
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder={`Example:\nWhat is 15% of 200?, 20, 30, 40, 50, B\nWhat is 25% of 400?, 50, 75, 100, 125, C`}
              placeholderTextColor={COLORS.gray400}
              multiline
              numberOfLines={6}
              value={csvContent}
              onChangeText={setCsvContent}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, uploadingCsv && styles.disabledBtn]}
              onPress={handleBulkMockCsv}
              disabled={uploadingCsv}
            >
              {uploadingCsv ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>Upload Questions into {selectedUploadModel}</Text>}
            </TouchableOpacity>
          </View>

          {/* Mock Questions Listing Filtered by Model Set */}
          <View style={styles.bankHeaderRow}>
            <Text style={styles.sectionHeading}>Mock Question Bank ({mockQuestions.length} Qs)</Text>
            
            <View style={styles.filterChipsRow}>
              <Text style={styles.filterLabel}>Filter Model:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={[styles.filterChip, selectedFilterModel === 'All' && styles.activeFilterChip]}
                    onPress={() => setSelectedFilterModel('All')}
                  >
                    <Text style={[styles.filterChipText, selectedFilterModel === 'All' && styles.activeFilterChipText]}>All</Text>
                  </TouchableOpacity>
                  {modelSets.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.filterChip, selectedFilterModel === m && styles.activeFilterChip]}
                      onPress={() => setSelectedFilterModel(m)}
                    >
                      <Text style={[styles.filterChipText, selectedFilterModel === m && styles.activeFilterChipText]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Question Search Bar */}
            <View style={[styles.searchBox, { marginTop: 10 }]}>
              <View style={styles.searchRow}>
                <Text style={styles.searchIconText}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search questions by text or model..."
                  placeholderTextColor={COLORS.gray600}
                  value={questionSearch}
                  onChangeText={setQuestionSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {questionSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setQuestionSearch('')} style={styles.clearXBtn}>
                    <Text style={styles.clearXText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {questionSearch.trim().length > 0 && (
                <View style={styles.resultChip}>
                  <Text style={styles.resultChipText}>
                    {filteredQuestions.length === 0
                      ? 'No questions matched'
                      : `${filteredQuestions.length} of ${mockQuestions.length} questions matched`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : filteredQuestions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {questionSearch.trim()
                  ? `No questions matched "${questionSearch}"`
                  : `No mock questions found for ${selectedFilterModel}.`}
              </Text>
            </View>
          ) : (
            <View style={styles.questionsList}>
              {filteredQuestions.map((item, index) => (
                <View key={item._id} style={styles.qCard}>
                  <View style={styles.topRow}>
                    <Text style={styles.qNum}>
                      Mock Question #{index + 1} <Text style={styles.modelBadge}>[{item.modelSet || 'Model 1'}]</Text>
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteMockQ(item._id)}>
                      <Text style={styles.delText}>🗑 Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.qText}>{item.questionText}</Text>
                  <Text style={styles.optText}>✅ Answer: Option {item.correctAnswer}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* ── 1. Model Questions Viewer Modal (Full Screen) ──────────────── */}
        <Modal
          visible={viewerModalVisible}
          animationType="slide"
          transparent={false}
          presentationStyle="fullScreen"
          onRequestClose={() => setViewerModalVisible(false)}
        >
          <View style={styles.fullScreenModalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backToSettingsBtn}
                onPress={() => setViewerModalVisible(false)}
              >
                <Text style={styles.backToSettingsText}>← Back</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, marginHorizontal: 10, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Text style={styles.modalTitle}>📚 {viewingModel} Question Bank</Text>
                  <View style={styles.modalBadge}>
                    <Text style={styles.modalBadgeText}>{viewingQuestions.length} Questions</Text>
                  </View>
                </View>
                <Text style={styles.modalSub}>
                  Reviewing all questions active for {viewingModel}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setViewerModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

              {/* Modal Toolbar (Search & Clear Action) */}
              <View style={styles.modalToolbar}>
                <View style={styles.modalSearchBox}>
                  <Text style={{ marginRight: 6 }}>🔍</Text>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder={`Search ${viewingModel} questions...`}
                    placeholderTextColor={COLORS.gray400}
                    value={viewerSearch}
                    onChangeText={setViewerSearch}
                  />
                  {viewerSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setViewerSearch('')}>
                      <Text style={{ color: COLORS.gray600, fontWeight: '700', paddingHorizontal: 4 }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {viewingQuestions.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearModelBtn}
                    onPress={handleClearModelQuestions}
                    disabled={clearingModel}
                  >
                    {clearingModel ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.clearModelBtnText}>🗑️ Clear Model Questions</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Questions List or Empty State */}
              {loadingViewingQuestions ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={{ marginTop: 10, color: COLORS.gray600 }}>Loading {viewingModel} questions...</Text>
                </View>
              ) : viewingQuestions.length === 0 ? (
                <View style={styles.emptyModalView}>
                  <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
                  <Text style={styles.emptyModalTitle}>No Questions in {viewingModel}</Text>
                  <Text style={styles.emptyModalSub}>
                    Intha model-la innum questions upload aagala. Neenga keezhe irukura upload section use panni questions add pannalaam.
                  </Text>
                  <TouchableOpacity
                    style={styles.modalUploadPromptBtn}
                    onPress={() => {
                      setSelectedUploadModel(viewingModel);
                      setViewerModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalUploadPromptText}>✍️ Upload Questions into {viewingModel}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={styles.modalScrollList} showsVerticalScrollIndicator={true}>
                  {viewingQuestions
                    .filter(q => {
                      if (!viewerSearch.trim()) return true;
                      return (q.questionText || '').toLowerCase().includes(viewerSearch.toLowerCase());
                    })
                    .map((q, idx) => (
                      <View key={q._id || idx} style={styles.modalQCard}>
                        <View style={styles.modalQHeader}>
                          <View style={styles.modalQNumBadge}>
                            <Text style={styles.modalQNumText}>Q{idx + 1}</Text>
                          </View>
                          <Text style={styles.modalQMeta}>{q.topic || 'Aptitude'} • {q.category || 'Mock'}</Text>
                          <TouchableOpacity
                            style={styles.modalQDelBtn}
                            onPress={() => handleDeleteSingleQuestionInViewer(q._id)}
                          >
                            <Text style={styles.modalQDelText}>🗑️ Delete</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.modalQText}>{q.questionText}</Text>

                        <View style={styles.modalOptionsGrid}>
                          {['A', 'B', 'C', 'D'].map(opt => {
                            const optKey = `option${opt}`;
                            const optVal = q[optKey];
                            const isCorrect = (q.correctAnswer || '').toUpperCase() === opt;
                            return (
                              <View
                                key={opt}
                                style={[
                                  styles.modalOptionBox,
                                  isCorrect && styles.modalOptionCorrectBox
                                ]}
                              >
                                <Text style={[styles.modalOptLetter, isCorrect && styles.modalOptLetterCorrect]}>
                                  {opt}.
                                </Text>
                                <Text style={[styles.modalOptText, isCorrect && styles.modalOptTextCorrect]}>
                                  {optVal || '-'}
                                </Text>
                                {isCorrect && (
                                  <View style={styles.correctIndicatorBadge}>
                                    <Text style={styles.correctIndicatorText}>✓ Correct</Text>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                </ScrollView>
              )}

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setViewerModalVisible(false)}
                >
                  <Text style={styles.modalDoneBtnText}>← Back to Mock Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
        </Modal>

        {/* ── 2. Confirmation Modal: Replace Existing Questions ── */}
        <Modal
          visible={confirmModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setConfirmModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalBox}>
              <View style={styles.confirmIconCircle}>
                <Text style={{ fontSize: 32 }}>⚠️</Text>
              </View>

              <Text style={styles.confirmTitle}>Questions Already Exist!</Text>

              <Text style={styles.confirmBody}>
                <Text style={{ fontWeight: '800', color: COLORS.primary }}>{confirmData.model}</Text>-la already{' '}
                <Text style={{ fontWeight: '800', color: COLORS.danger }}>{confirmData.existingCount} questions</Text>{' '}
                upload aagi irukku.
                {'\n\n'}
                Pazhaiya <Text style={{ fontWeight: '800', color: COLORS.danger }}>{confirmData.existingCount} questions-ai remove pannitu</Text>, ipo intha{' '}
                <Text style={{ fontWeight: '800', color: COLORS.success }}>{confirmData.pendingQuestions.length} pudhiya questions-ai</Text> upload pannanuma?
              </Text>

              <View style={styles.confirmBtnRow}>
                <TouchableOpacity
                  style={styles.confirmNoBtn}
                  onPress={() => setConfirmModalVisible(false)}
                >
                  <Text style={styles.confirmNoBtnText}>❌ No, Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmYesBtn}
                  onPress={() => executeUpload(confirmData.pendingQuestions, confirmData.model, true)}
                >
                  <Text style={styles.confirmYesBtnText}>✅ Yes, Remove & Upload</Text>
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
    height: Platform.OS === 'web' ? '100vh' : '100%',
    overflowY: Platform.OS === 'web' ? 'auto' : 'visible',
  },
  scrollView: {
    flex: 1,
    height: Platform.OS === 'web' ? '100vh' : 'auto',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  // ── Search Bar Styles ─────────────────────────────────
  searchBox: {
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...SHADOWS.small,
  },
  searchIconText: {
    fontSize: 15,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 5,
    outlineStyle: 'none',
  },
  clearXBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearXText: {
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '700',
  },
  resultChip: {
    marginTop: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  resultChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  cardHeaderRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    color: COLORS.gray600,
    marginBottom: 12,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  modelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  modelCard: {
    backgroundColor: COLORS.gray100,
    borderRadius: 10,
    padding: 12,
    width: Platform.OS === 'web' ? '18%' : '48%',
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  selectedModelCard: {
    backgroundColor: COLORS.selectedBg,
    borderColor: COLORS.selectedBorder,
    borderWidth: 2,
  },
  modelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  selectedModelTitle: {
    color: COLORS.primary,
  },
  modelMeta: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 2,
  },
  autoDistributeBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  autoDistributeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  studentsList: {
    gap: 10,
  },
  studentItemCard: {
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  stInfoCol: {
    marginBottom: 6,
  },
  stName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stSub: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  modelPickerCol: {
    marginTop: 4,
  },
  assignedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  modelChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  smallChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  activeSmallChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  smallChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  activeSmallChipText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: COLORS.text,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  bankHeaderRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  filterChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  activeFilterChip: {
    backgroundColor: COLORS.selectedBg,
    borderColor: COLORS.selectedBorder,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  questionsList: {
    gap: 10,
  },
  qCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  qNum: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modelBadge: {
    color: COLORS.secondary,
    fontWeight: '800',
  },
  delText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  qText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  optText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
    marginTop: 6,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray600,
    fontSize: 14,
  },

  // ── Model Card Header & Actions ─────────────────────────
  modelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  qCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  qCountBadgeActive: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  qCountBadgeEmpty: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  qCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  qCountBadgeTextActive: {
    color: '#15803d',
  },
  viewQsActionBtn: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
  },
  viewQsActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── Full Screen Question Viewer Modal ───────────────────
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    width: '100%',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: Platform.OS === 'web' ? 'hidden' : 'visible',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  backToSettingsBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  backToSettingsText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  modalBadgeText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray600,
  },

  // ── Modal Toolbar ──────────────────────────────────────
  modalToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    flexWrap: 'wrap',
  },
  modalSearchBox: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    outlineStyle: 'none',
  },
  clearModelBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearModelBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Modal Questions List ───────────────────────────────
  modalScrollList: {
    flex: 1,
    padding: 20,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  modalQCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: 14,
    marginBottom: 14,
    ...SHADOWS.small,
  },
  modalQHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalQNumBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  modalQNumText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  modalQMeta: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  modalQDelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#fff1f2',
  },
  modalQDelText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  modalQText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  modalOptionsGrid: {
    gap: 6,
  },
  modalOptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalOptionCorrectBox: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
    borderWidth: 1.5,
  },
  modalOptLetter: {
    fontWeight: '800',
    fontSize: 13,
    color: COLORS.gray600,
    width: 22,
  },
  modalOptLetterCorrect: {
    color: '#15803d',
  },
  modalOptText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalOptTextCorrect: {
    color: '#15803d',
    fontWeight: '700',
  },
  correctIndicatorBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  correctIndicatorText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Empty State in Modal ────────────────────────────────
  emptyModalView: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyModalSub: {
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalUploadPromptBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalUploadPromptText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Modal Footer ────────────────────────────────────────
  modalFooter: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  modalDoneBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    ...SHADOWS.small,
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Confirmation Modal ──────────────────────────────────
  confirmModalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  confirmIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmBody: {
    fontSize: 14,
    color: COLORS.gray700,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmNoBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmNoBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  confirmYesBtn: {
    flex: 1.4,
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmYesBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
