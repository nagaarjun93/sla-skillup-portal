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
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter'; 
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { adminService } from '../services/adminService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function EditQuestionScreen() {
  const router = useUniversalRouter();
  const { id } = router.params || {};

  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchQuestion();
  }, [id]);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const q = await adminService.getQuestionById(id);
      if (q) {
        setQuestionText(q.questionText || '');
        setOptionA(q.optionA || '');
        setOptionB(q.optionB || '');
        setOptionC(q.optionC || '');
        setOptionD(q.optionD || '');
        setCorrectAnswer(q.correctAnswer || 'A');
        setCategory(q.category || '');
        setTopic(q.topic || '');
        setExplanation(q.explanation || '');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch question details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!questionText || !optionA || !optionB || !optionC || !optionD || !category) {
      Alert.alert('Required Fields', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      await adminService.updateQuestion(id, {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        category,
        topic,
        explanation,
      });

      Alert.alert('Success', 'Question updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Edit Question" />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.formTitle}>Edit Question</Text>

              <Text style={styles.label}>Question Text *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Question text"
                placeholderTextColor={COLORS.gray400}
                multiline
                numberOfLines={3}
                value={questionText}
                onChangeText={setQuestionText}
              />

              <Text style={styles.label}>Category *</Text>
              <TextInput
                style={styles.input}
                placeholder="Category"
                placeholderTextColor={COLORS.gray400}
                value={category}
                onChangeText={setCategory}
              />

              <Text style={styles.label}>Topic</Text>
              <TextInput
                style={styles.input}
                placeholder="Topic"
                placeholderTextColor={COLORS.gray400}
                value={topic}
                onChangeText={setTopic}
              />

              <Text style={styles.label}>Option A *</Text>
              <TextInput style={styles.input} value={optionA} onChangeText={setOptionA} />

              <Text style={styles.label}>Option B *</Text>
              <TextInput style={styles.input} value={optionB} onChangeText={setOptionB} />

              <Text style={styles.label}>Option C *</Text>
              <TextInput style={styles.input} value={optionC} onChangeText={setOptionC} />

              <Text style={styles.label}>Option D *</Text>
              <TextInput style={styles.input} value={optionD} onChangeText={setOptionD} />

              <Text style={styles.label}>Correct Answer Key *</Text>
              <View style={styles.optionKeyRow}>
                {['A', 'B', 'C', 'D'].map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.keyBtn, correctAnswer === key && styles.keyBtnSelected]}
                    onPress={() => setCorrectAnswer(key)}
                  >
                    <Text style={[styles.keyText, correctAnswer === key && styles.keyTextSelected]}>
                      Option {key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Explanation</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={explanation}
                onChangeText={setExplanation}
                multiline
              />

              <TouchableOpacity
                style={[styles.primaryBtn, saving && styles.disabledBtn]}
                onPress={handleUpdate}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Update Question</Text>
                )}
              </TouchableOpacity>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.medium,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  optionKeyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  keyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  keyBtnSelected: {
    backgroundColor: COLORS.selectedBg,
    borderColor: COLORS.selectedBorder,
    borderWidth: 2,
  },
  keyText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  keyTextSelected: {
    color: COLORS.primary,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
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

