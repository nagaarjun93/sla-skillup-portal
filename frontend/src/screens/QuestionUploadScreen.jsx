import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../services/api';
import { adminService } from '../services/adminService';
import { mockService } from '../services/mockService';
import { weeklyService } from '../services/weeklyService';
import { COLORS, SHADOWS } from '../styles/theme';

const ALL_TOPICS = [
  { label: 'Vedic Math / Simplification', category: 'Vedic Math' },
  { label: 'Ratio & Proportion / HCF & LCM', category: 'Ratio and Proportion' },
  { label: 'Percentage', category: 'Percentage' },
  { label: 'Time & Work / Pipes & Cistern', category: 'Time and Work' },
  { label: 'Time, Speed & Distance', category: 'Speed and Distance' },
  { label: 'Trains, Boats & Streams', category: 'Trains and Boats' },
  { label: 'Profit & Loss', category: 'Profit and Loss' },
  { label: 'Ages', category: 'Ages' },
  { label: 'Simple Interest', category: 'Simple Interest' },
  { label: 'Compound Interest', category: 'Compound Interest' },
  { label: 'Permutation & Combination', category: 'Permutation' },
  { label: 'Probability', category: 'Probability' },
  { label: 'Alphabet Test / Letter Series', category: 'Alphabet Test' },
  { label: 'Blood Relations', category: 'Blood Relation' },
  { label: 'Coding & Decoding', category: 'Coding Decoding' },
  { label: 'Syllogism', category: 'Syllogism' },
  { label: 'Mathematical Operations (MOT)', category: 'MOT' },
  { label: 'Seating Arrangement / Puzzles', category: 'Seating Arrangement' },
  { label: 'Direction Test', category: 'Direction Test' }
];

const formatTestDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const datePart = d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart}, ${timePart}`;
  } catch (e) {
    return String(dateStr);
  }
};

export default function QuestionUploadScreen() {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'mock'
  const [weeklyTests, setWeeklyTests] = useState([]);
  const [dbTopics, setDbTopics] = useState(ALL_TOPICS);
  const [selectedWeeklyTestId, setSelectedWeeklyTestId] = useState('');
  const [selectedTopicLabel, setSelectedTopicLabel] = useState('Vedic Math / Simplification');
  const [selectedMockModel, setSelectedMockModel] = useState('Model 1');
  
  const [csvText, setCsvText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTests, setLoadingTests] = useState(true);

  // Status Banner for explicit visual feedback
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchWeeklyTests();
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await api.get('/topics');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(t => ({
          label: t.name,
          category: t.category || t.name
        }));
        setDbTopics(mapped);
      }
    } catch (e) {
      console.warn('Could not load topics from server, using defaults');
    }
  };

  const fetchWeeklyTests = async () => {
    setLoadingTests(true);
    try {
      const tests = await weeklyService.getAllWeeklyTestsAdmin();
      setWeeklyTests(tests || []);
    } catch (e) {
      console.error('Failed to fetch weekly tests for upload screen:', e);
    } finally {
      setLoadingTests(false);
    }
  };

  // Web file handler for CSV, PDF, DOC, TXT
  const handleWebFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleDocumentSelected(file);
  };

  const handleDocumentSelected = (file) => {
    if (!file) return;

    setStatusMessage(null);
    setSelectedFileName(file.name);
    const ext = file.name.split('.').pop().toLowerCase();
    setSelectedFileType(ext);

    if (ext === 'csv' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setCsvText(text);
        const successMsg = `Loaded ${file.name} successfully. Review detected lines below before saving.`;
        setStatusMessage({ type: 'info', text: successMsg });
      };
      reader.onerror = () => {
        const errorMsg = `Failed to read file ${file.name}`;
        setStatusMessage({ type: 'error', text: errorMsg });
        Alert.alert('File Read Error', errorMsg);
      };
      reader.readAsText(file);
    } else {
      const infoMsg = `Attached binary file: ${file.name}. Please ensure questions text format is pasted in the area below.`;
      setStatusMessage({ type: 'info', text: infoMsg });
      if (Platform.OS === 'web') {
        window.alert(infoMsg);
      } else {
        Alert.alert('File Attached', infoMsg);
      }
    }
  };

  const handlePickDocument = async () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    try {
      const DocumentPicker = require('expo-document-picker');
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const picked = res.assets[0];
        setSelectedFileName(picked.name);
        const ext = picked.name.split('.').pop().toLowerCase();
        setSelectedFileType(ext);

        if (ext === 'csv' || ext === 'txt') {
          setLoading(true);
          const formData = new FormData();
          formData.append('file', {
            uri: picked.uri,
            name: picked.name,
            type: picked.mimeType || 'text/csv',
          });

          if (activeTab === 'mock') {
            formData.append('targetModelSet', selectedMockModel);
            await mockService.uploadMockQuestionsCsv(formData);
            const successMsg = `Uploaded mock questions from ${picked.name} into ${selectedMockModel} successfully!`;
            setStatusMessage({ type: 'success', text: successMsg });
            Alert.alert('Upload Success', successMsg);
          } else {
            await adminService.uploadQuestionsCsv(formData);
            const successMsg = `Uploaded practice questions successfully from file: ${picked.name}`;
            setStatusMessage({ type: 'success', text: successMsg });
            Alert.alert('Upload Success', successMsg);
          }
          setLoading(false);
        }
      }
    } catch (e) {
      const errorMsg = 'Could not process file upload. Try pasting text directly into the area below.';
      setStatusMessage({ type: 'error', text: errorMsg });
      Alert.alert('File Upload Error', errorMsg);
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    setStatusMessage(null);

    if (!csvText.trim()) {
      const errorMsg = 'Please enter question content or pick a CSV/PDF/DOC file to upload.';
      setStatusMessage({ type: 'error', text: errorMsg });
      Alert.alert('Validation Error', errorMsg);
      return;
    }

    setLoading(true);
    try {
      const splitCsvRow = (text) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            if (inQuotes && text[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const sanitizeAnswer = (val, optA, optB, optC, optD) => {
        if (!val) return 'A';
        const raw = String(val).trim().toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(raw)) return raw;
        if (raw.startsWith('OPTION')) {
          const last = raw.replace('OPTION', '').trim();
          if (['A', 'B', 'C', 'D'].includes(last)) return last;
        }
        if (raw === '1') return 'A';
        if (raw === '2') return 'B';
        if (raw === '3') return 'C';
        if (raw === '4') return 'D';
        const rawLower = String(val).trim().toLowerCase();
        if (optA && rawLower === String(optA).trim().toLowerCase()) return 'A';
        if (optB && rawLower === String(optB).trim().toLowerCase()) return 'B';
        if (optC && rawLower === String(optC).trim().toLowerCase()) return 'C';
        if (optD && rawLower === String(optD).trim().toLowerCase()) return 'D';
        return 'A';
      };

      const rawLines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
      const questions = [];

      const activeTopicObj = dbTopics.find(t => t.label === selectedTopicLabel) || { label: selectedTopicLabel, category: 'Vedic Math' };
      const categoryName = activeTopicObj.category;
      const topicLabel = activeTopicObj.label;

      if (rawLines.length > 0) {
        const firstRowParts = splitCsvRow(rawLines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const hasHeader = firstRowParts.some(h => h.includes('question') || h.includes('option') || h.includes('ans'));
        
        let headerIndices = null;
        if (hasHeader) {
          headerIndices = {
            questionText: firstRowParts.findIndex(h => h.includes('question')),
            category: firstRowParts.findIndex(h => h.includes('cat')),
            topic: firstRowParts.findIndex(h => h.includes('top')),
            optionA: firstRowParts.findIndex(h => h === 'optiona' || h === 'a' || h === 'opta'),
            optionB: firstRowParts.findIndex(h => h === 'optionb' || h === 'b' || h === 'optb'),
            optionC: firstRowParts.findIndex(h => h === 'optionc' || h === 'c' || h === 'optc'),
            optionD: firstRowParts.findIndex(h => h === 'optiond' || h === 'd' || h === 'optd'),
            correctAnswer: firstRowParts.findIndex(h => h.includes('correct') || h.includes('answer') || h === 'ans'),
            explanation: firstRowParts.findIndex(h => h.includes('expla')),
            modelSet: firstRowParts.findIndex(h => h.includes('model'))
          };
        }

        const dataLines = hasHeader ? rawLines.slice(1) : rawLines;
        dataLines.forEach((line) => {
          const parts = splitCsvRow(line);
          if (parts.length < 5) return;

          let qText = '', optA = '', optB = '', optC = '', optD = '', cAns = '', cat = '', top = '', mSet = '', expl = '';

          if (headerIndices && headerIndices.questionText !== -1) {
            qText = parts[headerIndices.questionText] || '';
            optA = headerIndices.optionA !== -1 ? parts[headerIndices.optionA] : '';
            optB = headerIndices.optionB !== -1 ? parts[headerIndices.optionB] : '';
            optC = headerIndices.optionC !== -1 ? parts[headerIndices.optionC] : '';
            optD = headerIndices.optionD !== -1 ? parts[headerIndices.optionD] : '';
            cAns = headerIndices.correctAnswer !== -1 ? parts[headerIndices.correctAnswer] : '';
            cat = headerIndices.category !== -1 ? parts[headerIndices.category] : '';
            top = headerIndices.topic !== -1 ? parts[headerIndices.topic] : '';
            mSet = headerIndices.modelSet !== -1 ? parts[headerIndices.modelSet] : '';
            expl = headerIndices.explanation !== -1 ? parts[headerIndices.explanation] : '';
          } else if (parts.length >= 8 && (parts[1] === 'Vedic Math' || parts[1] === 'Mock Test' || parts[1] === 'General' || parts[1].length > 15)) {
            // Format A: question_text, category, topic, option_a, option_b, option_c, option_d, correct_option_key, explanation
            qText = parts[0];
            cat = parts[1];
            top = parts[2];
            optA = parts[3];
            optB = parts[4];
            optC = parts[5];
            optD = parts[6];
            cAns = parts[7];
            expl = parts[8] || '';
          } else {
            // Format B: questionText, optionA, optionB, optionC, optionD, correctAnswer, category, topic
            qText = parts[0];
            optA = parts[1];
            optB = parts[2];
            optC = parts[3];
            optD = parts[4];
            cAns = parts[5];
            cat = parts[6];
            top = parts[7];
            mSet = parts[8];
          }

          if (qText && optA && optB && optC && optD) {
            const finalAnswer = sanitizeAnswer(cAns, optA, optB, optC, optD);
            questions.push({
              questionText: qText,
              optionA: optA,
              optionB: optB,
              optionC: optC,
              optionD: optD,
              correctAnswer: finalAnswer,
              explanation: expl || '',
              category: cat || categoryName || (activeTab === 'mock' ? 'Mock Test' : 'General'),
              topic: top || topicLabel || (activeTab === 'mock' ? 'Official Mock' : 'General'),
              modelSet: activeTab === 'mock' ? (mSet || selectedMockModel) : 'Model 1',
              weeklyTestId: activeTab === 'weekly' && selectedWeeklyTestId ? selectedWeeklyTestId : null
            });
          }
        });
      }

      if (questions.length === 0) {
        const formatErrMsg = 'No valid questions parsed. Please ensure each row contains Question Text, Option A, Option B, Option C, Option D, and Correct Answer.';
        setStatusMessage({ type: 'error', text: formatErrMsg });
        Alert.alert('Format Error', formatErrMsg);
        setLoading(false);
        return;
      }

      if (activeTab === 'mock') {
        // Check existing question count for selectedMockModel
        let existingCount = 0;
        try {
          const stats = await mockService.getMockModelsStats();
          const targetStat = (stats || []).find(s => s.modelSet === selectedMockModel);
          existingCount = targetStat ? targetStat.questionCount : 0;
        } catch (e) {
          console.warn('Failed to check mock stats:', e);
        }

        if (existingCount > 0) {
          const confirmMsg = `${selectedMockModel}-la already ${existingCount} questions upload aagi irukku.\n\nPazhaiya questions-ai remove pannitu, ipo intha ${questions.length} questions-ai upload pannanuma?`;
          let userConfirmed = false;
          if (Platform.OS === 'web') {
            userConfirmed = window.confirm(`⚠️ Questions Already Exist!\n\n${confirmMsg}`);
          } else {
            userConfirmed = await new Promise((resolve) => {
              Alert.alert(
                'Questions Already Exist!',
                confirmMsg,
                [
                  { text: '❌ No, Cancel', style: 'cancel', onPress: () => resolve(false) },
                  { text: '✅ Yes, Replace & Upload', style: 'destructive', onPress: () => resolve(true) }
                ]
              );
            });
          }

          if (!userConfirmed) {
            setLoading(false);
            return;
          }

          await mockService.saveBulkMockQuestions(questions, selectedMockModel, true);
          const successMsg = `✅ ${selectedMockModel}-la pazhaiya questions remove aagi ${questions.length} pudhiya questions upload aagiduchu!`;
          setStatusMessage({ type: 'success', text: successMsg });
          if (Platform.OS === 'web') window.alert(successMsg);
          else Alert.alert('Upload Success', successMsg);
        } else {
          await mockService.saveBulkMockQuestions(questions, selectedMockModel, false);
          const successMsg = `✅ Questions Uploaded Successfully!\n\n${questions.length} questions saved into ${selectedMockModel}.`;
          setStatusMessage({ type: 'success', text: successMsg });
          if (Platform.OS === 'web') window.alert(successMsg);
          else Alert.alert('Upload Success', successMsg);
        }
      } else {
        await adminService.saveBulkQuestions(questions, selectedWeeklyTestId || null);
        const targetName = selectedWeeklyTestId 
          ? weeklyTests.find(t => t._id === selectedWeeklyTestId)?.title || 'Weekly Test'
          : `Practice Topic: ${topicLabel}`;
        const successMsg = `✅ Questions Uploaded Successfully!\n\n${questions.length} questions saved into ${targetName}.`;
        setStatusMessage({ type: 'success', text: successMsg });
        if (Platform.OS === 'web') {
          window.alert(successMsg);
        } else {
          Alert.alert('Upload Success', successMsg);
        }
      }   

      setCsvText('');
      setSelectedFileName('');
      fetchWeeklyTests();
    } catch (error) {
      const errorDetail = error.response?.data?.message || error.message || 'Failed to save questions to database';
      const failMsg = `❌ Upload Failed: ${errorDetail}`;
      setStatusMessage({ type: 'error', text: failMsg });
      Alert.alert('Upload Error', failMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedTestObj = weeklyTests.find(t => t._id === selectedWeeklyTestId);

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Practice & Mock Question Importer" />

        {/* Hidden file input for web */}
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.pdf,.doc,.docx,.txt,text/csv,application/pdf,application/msword"
            style={{ display: 'none' }}
            onChange={handleWebFileChange}
          />
        )}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            
            {/* Top Bank Selection Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'weekly' && styles.activeTabBtn]}
                onPress={() => { setActiveTab('weekly'); setStatusMessage(null); }}
              >
                <Text style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>
                  📚 Topic Practice & Weekly Test Bank
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'mock' && styles.activeTabBtn]}
                onPress={() => { setActiveTab('mock'); setStatusMessage(null); }}
              >
                <Text style={[styles.tabText, activeTab === 'mock' && styles.activeTabText]}>
                  🎯 Official Mock Test Bank
                </Text>
              </TouchableOpacity>
            </View>

            {/* Status Alert Banner */}
            {statusMessage && (
              <View style={[
                styles.statusBanner,
                statusMessage.type === 'success' ? styles.successBanner : styles.errorBanner
              ]}>
                <Text style={[
                  styles.statusBannerText,
                  statusMessage.type === 'success' ? styles.successBannerText : styles.errorBannerText
                ]}>
                  {statusMessage.text}
                </Text>
              </View>
            )}

            {/* Two-Column Responsive Layout: Left Sidebar Instructions + Right Main Importer */}
            <View style={styles.layoutRow}>
              
              {/* LEFT SIDEBAR: Instructions & Order Guide for CSV, PDF, DOC */}
              <View style={styles.leftSidebar}>
                <Text style={styles.sidebarTitle}>📋 File Format Instructions</Text>
                <Text style={styles.sidebarSub}>Follow the order below for CSV, PDF, or DOC file uploads:</Text>

                {/* 1. CSV Format Guide */}
                <View style={styles.guideCard}>
                  <Text style={styles.guideHeader}>1. CSV File (.csv)</Text>
                  <Text style={styles.guideBody}>
                    Columns Order:{'\n'}
                    <Text style={styles.codeText}>questionText, optionA, optionB, optionC, optionD, correctAnswer (A/B/C/D), category, topic</Text>
                  </Text>
                </View>

                {/* 2. PDF Format Guide */}
                <View style={styles.guideCard}>
                  <Text style={styles.guideHeader}>2. PDF File (.pdf)</Text>
                  <Text style={styles.guideBody}>
                    Text line layout order:{'\n'}
                    Line 1: Question text{'\n'}
                    Line 2: A) Option A text{'\n'}
                    Line 3: B) Option B text{'\n'}
                    Line 4: C) Option C text{'\n'}
                    Line 5: D) Option D text{'\n'}
                    Line 6: Answer: A
                  </Text>
                </View>

                {/* 3. DOC / DOCX Format Guide */}
                <View style={styles.guideCard}>
                  <Text style={styles.guideHeader}>3. Word Document (.doc / .docx)</Text>
                  <Text style={styles.guideBody}>
                    Save document lines as text or comma-separated rows per question matching the CSV order above.
                  </Text>
                </View>

                {/* Practice Topic Picker */}
                {activeTab === 'weekly' && (
                  <View style={styles.topicSelectBox}>
                    <Text style={styles.sidebarTitle}>🎯 Target Practice Topic:</Text>
                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                      {dbTopics.map((topicObj) => {
                        const isSelected = selectedTopicLabel === topicObj.label;
                        return (
                          <TouchableOpacity
                            key={topicObj.label}
                            style={[
                              styles.topicChip,
                              isSelected && styles.activeTopicChip
                            ]}
                            onPress={() => setSelectedTopicLabel(topicObj.label)}
                          >
                            <Text style={[styles.topicChipText, isSelected && styles.activeTopicChipText]}>
                              {isSelected ? '✓ ' : ''}{topicObj.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* RIGHT MAIN PANEL: Upload & Content Area */}
              <View style={styles.rightMainPanel}>
                
                {activeTab === 'weekly' ? (
                  <>
                    <Text style={styles.title}>Practice & Weekly Question Importer</Text>
                    <Text style={styles.sub}>
                      Select target Weekly Test or Topic, then pick a CSV/PDF/DOC file or paste text below.
                    </Text>

                    {/* Target Weekly Test Selector */}
                    <View style={styles.targetSection}>
                      <Text style={styles.targetLabel}>Select Target Weekly Test (Optional):</Text>
                      {loadingTests ? (
                        <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: 8 }} />
                      ) : (
                        <View style={styles.pickerContainer}>
                          <TouchableOpacity
                            style={[
                              styles.targetItemCard,
                              !selectedWeeklyTestId && styles.selectedTargetCard
                            ]}
                            onPress={() => setSelectedWeeklyTestId('')}
                          >
                            <Text style={[styles.targetItemTitle, !selectedWeeklyTestId && styles.selectedTargetText]}>
                              🌐 General Practice Topic Bank ({selectedTopicLabel})
                            </Text>
                            <Text style={styles.targetItemSub}>Assigned to category: {selectedTopicLabel}</Text>
                          </TouchableOpacity>

                          {weeklyTests.map((t) => {
                            const isSelected = selectedWeeklyTestId === t._id;
                            return (
                              <TouchableOpacity
                                key={t._id}
                                style={[styles.targetItemCard, isSelected && styles.selectedTargetCard]}
                                onPress={() => setSelectedWeeklyTestId(t._id)}
                              >
                                <View style={styles.targetHeaderRow}>
                                  <Text style={[styles.targetItemTitle, isSelected && styles.selectedTargetText]}>
                                    📅 {t.weekName || `Week ${t.weekNumber || 1}`} - {t.title || t.topic}
                                  </Text>
                                  <View style={styles.badgeGroupRow}>
                                    <Text style={styles.targetBadge}>
                                      {t.totalQuestions || 0} Qs
                                    </Text>
                                    <Text style={styles.targetDurationBadge}>
                                      ⏳ {t.duration || 30} mins
                                    </Text>
                                  </View>
                                </View>

                                <Text style={styles.targetItemSub}>
                                  Topic: {t.topic} {t.active ? '• 🟢 Active Test' : '• ⚪ Inactive'}
                                </Text>

                                {/* Day, Date & Time Row */}
                                <View style={styles.targetDateTimeRow}>
                                  <Text style={styles.targetCreatedText}>
                                    🗓️ Created: {formatTestDateTime(t.createdAt)}
                                  </Text>
                                  {t.startTime && (
                                    <Text style={styles.targetScheduledText}>
                                      ⏰ Starts: {formatTestDateTime(t.startTime)}
                                    </Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {selectedWeeklyTestId && selectedTestObj && (
                        <View style={styles.selectedTargetBanner}>
                          <Text style={styles.selectedTargetBannerTitle}>
                            🎯 Selected Target Test: {selectedTestObj.weekName || selectedTestObj.title} ({selectedTestObj.topic})
                          </Text>
                          <Text style={styles.selectedTargetBannerSub}>
                            🗓️ Created: {formatTestDateTime(selectedTestObj.createdAt)} • ⏳ Duration: {selectedTestObj.duration || 30} mins • Questions: {selectedTestObj.totalQuestions || 0}
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.title}>Official Mock Test Importer</Text>
                    <Text style={styles.sub}>
                      Upload questions specifically into the Official Aptitude Mock Exam Bank.
                    </Text>
                    
                    <View style={styles.mockBanner}>
                      <Text style={styles.mockBannerTitle}>🎯 Official Mock Exam Bank</Text>
                      <Text style={styles.mockBannerSub}>
                        Questions uploaded here will be served to eligible students during the Official Aptitude Mock Test.
                      </Text>
                    </View>

                    <View style={styles.targetSection}>
                      <Text style={styles.targetLabel}>Select Target Mock Model Paper (Model 1 to 10):</Text>
                      <Text style={styles.targetSub}>Choose which question paper model set these questions will be uploaded into:</Text>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                          {['Model 1', 'Model 2', 'Model 3', 'Model 4', 'Model 5', 'Model 6', 'Model 7', 'Model 8', 'Model 9', 'Model 10'].map((m) => {
                            const isSelected = selectedMockModel === m;
                            return (
                              <TouchableOpacity
                                key={m}
                                style={[styles.modelChip, isSelected && styles.selectedModelChip]}
                                onPress={() => setSelectedMockModel(m)}
                              >
                                <Text style={[styles.modelChipText, isSelected && styles.selectedModelChipText]}>
                                  {isSelected ? '✓ ' : ''}{m}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  </>
                )}

                {/* File Picker Supporting CSV, PDF, DOC */}
                <TouchableOpacity style={styles.filePickerBtn} onPress={handlePickDocument}>
                  <Text style={styles.filePickerText}>
                    📁 {selectedFileName ? `✅ Selected: ${selectedFileName} (${selectedFileType.toUpperCase()})` : 'Pick CSV, PDF, or DOC File from Device'}
                  </Text>
                </TouchableOpacity>

                {/* Text Area */}
                <Text style={styles.label}>Or Paste Question Content Below (CSV / Comma Format)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder={`Example:\nWhat is 15% of 200?, 20, 30, 40, 50, B, Percentage, Aptitude\nWhat is 25% of 400?, 50, 75, 100, 125, C, Percentage, Aptitude`}
                  placeholderTextColor={COLORS.gray400}
                  multiline
                  numberOfLines={8}
                  value={csvText}
                  onChangeText={setCsvText}
                />

                {csvText.length > 0 && (
                  <Text style={styles.previewText}>
                    📊 Preview: ~{csvText.split('\n').filter(l => l.trim()).length} question lines detected
                  </Text>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.disabledBtn]}
                  onPress={handleBulkSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {activeTab === 'mock' ? '🎯 Upload & Save Mock Questions' : '⬆️ Upload & Save Questions'}
                    </Text>
                  )}
                </TouchableOpacity>

              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabBtn: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  activeTabText: {
    color: '#ffffff',
  },
  statusBanner: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderLeftColor: COLORS.success,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftColor: COLORS.danger,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  successBannerText: {
    color: COLORS.success,
  },
  errorBannerText: {
    color: COLORS.danger,
  },
  layoutRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
  },
  leftSidebar: {
    width: Platform.OS === 'web' ? 320 : '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  sidebarSub: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
  modelChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  selectedModelChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modelChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  selectedModelChipText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  guideCard: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  guideHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  guideBody: {
    fontSize: 11,
    color: COLORS.gray600,
    lineHeight: 16,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.primary,
  },
  topicSelectBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  topicChip: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: COLORS.gray100,
  },
  activeTopicChip: {
    backgroundColor: COLORS.selectedBg,
    borderWidth: 1,
    borderColor: COLORS.selectedBorder,
  },
  topicChipText: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '600',
  },
  activeTopicChipText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  rightMainPanel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: COLORS.gray600,
    marginBottom: 16,
    lineHeight: 18,
  },
  targetSection: {
    marginBottom: 16,
  },
  targetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  pickerContainer: {
    gap: 8,
  },
  targetItemCard: {
    backgroundColor: COLORS.gray100,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  selectedTargetCard: {
    backgroundColor: COLORS.selectedBg,
    borderColor: COLORS.selectedBorder,
    borderWidth: 2,
  },
  targetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  targetItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectedTargetText: {
    color: COLORS.primary,
  },
  badgeGroupRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  targetBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  targetDurationBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  targetItemSub: {
    fontSize: 12,
    color: COLORS.gray600,
    marginBottom: 4,
  },
  targetDateTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  targetCreatedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f766e',
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  targetScheduledText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  selectedTargetBanner: {
    marginTop: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
  },
  selectedTargetBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
  },
  selectedTargetBannerSub: {
    fontSize: 11.5,
    color: '#1e40af',
    fontWeight: '600',
  },
  mockBanner: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  mockBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: 4,
  },
  mockBannerSub: {
    fontSize: 12,
    color: COLORS.gray600,
    lineHeight: 18,
  },
  filePickerBtn: {
    backgroundColor: COLORS.selectedBg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.selectedBorder,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  filePickerText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  previewText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 2,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
