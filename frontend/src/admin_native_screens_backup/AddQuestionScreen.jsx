import React, { useState } from 'react';
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

export default function AddQuestionScreen() {
  const router = useUniversalRouter();

  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('Medium');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveQuestion = async () => {
    if (!questionText || !optionA || !optionB || !optionC || !optionD || !category) {
      Alert.alert('Required Fields', 'Please complete question text, options A-D, and category.');
      return;
    }

    setLoading(true);
    try {
      await adminService.addQuestionManual({
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        category,
        topic,
        difficultyLevel,
        explanation,
      });

      Alert.alert('Success', 'Question added to question bank!', [
        { text: 'Add Another', onPress: () => clearForm() },
        { text: 'View Questions', onPress: () => router.push('/view-questions') },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setExplanation('');
  };

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Add Question" />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.formTitle}>New Aptitude Question</Text>

              <Text style={styles.label}>Question Text *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter question text..."
                placeholderTextColor={COLORS.gray400}
                multiline
                numberOfLines={3}
                value={questionText}
                onChangeText={setQuestionText}
              />

              <Text style={styles.label}>Category (e.g. Vedic Math, Percentage) *</Text>
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
                placeholder="Topic name"
                placeholderTextColor={COLORS.gray400}
                value={topic}
                onChangeText={setTopic}
              />

              <Text style={styles.sectionLabel}>Options</Text>

              <Text style={styles.label}>Option A *</Text>
              <TextInput
                style={styles.input}
                placeholder="Option A"
                placeholderTextColor={COLORS.gray400}
                value={optionA}
                onChangeText={setOptionA}
              />

              <Text style={styles.label}>Option B *</Text>
              <TextInput
                style={styles.input}
                placeholder="Option B"
                placeholderTextColor={COLORS.gray400}
                value={optionB}
                onChangeText={setOptionB}
              />

              <Text style={styles.label}>Option C *</Text>
              <TextInput
                style={styles.input}
                placeholder="Option C"
                placeholderTextColor={COLORS.gray400}
                value={optionC}
                onChangeText={setOptionC}
              />

              <Text style={styles.label}>Option D *</Text>
              <TextInput
                style={styles.input}
                placeholder="Option D"
                placeholderTextColor={COLORS.gray400}
                value={optionD}
                onChangeText={setOptionD}
              />

              <Text style={styles.label}>Correct Option Key *</Text>
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
                placeholder="Step-by-step solution / explanation..."
                placeholderTextColor={COLORS.gray400}
                multiline
                numberOfLines={3}
                value={explanation}
                onChangeText={setExplanation}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleSaveQuestion}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save Question</Text>
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
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 4,
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

