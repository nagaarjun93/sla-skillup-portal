import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { adminService } from '../services/adminService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function ViewQuestionsScreen() {
  const router = useUniversalRouter();

  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllQuestions();
      setQuestions(data || []);
      setFilteredQuestions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredQuestions(questions);
    } else {
      const query = text.toLowerCase();
      const filtered = questions.filter(
        (q) =>
          q.questionText?.toLowerCase().includes(query) ||
          q.category?.toLowerCase().includes(query) ||
          q.topic?.toLowerCase().includes(query)
      );
      setFilteredQuestions(filtered);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this question?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteQuestion(id);
            setQuestions((prev) => prev.filter((q) => q._id !== id));
            setFilteredQuestions((prev) => prev.filter((q) => q._id !== id));
            Alert.alert('Deleted', 'Question deleted successfully');
          } catch (e) {
            Alert.alert('Error', 'Failed to delete question');
          }
        },
      },
    ]);
  };

  const renderQuestionItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.categoryBadge}>{item.category || 'General'}</Text>
        <Text style={styles.correctBadge}>Answer: Option {item.correctAnswer}</Text>
      </View>

      <Text style={styles.questionText}>
        {index + 1}. {item.questionText}
      </Text>

      <View style={styles.optionsBox}>
        <Text style={styles.optionText}>A: {item.optionA}</Text>
        <Text style={styles.optionText}>B: {item.optionB}</Text>
        <Text style={styles.optionText}>C: {item.optionC}</Text>
        <Text style={styles.optionText}>D: {item.optionD}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push({ pathname: '/edit-question', params: { id: item._id } })}
        >
          <Text style={styles.editBtnText}>✏️ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Text style={styles.deleteBtnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Question Bank Management" />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            <View style={styles.topRow}>
              <TextInput
                style={[styles.searchInput, { flex: 1 }]}
                placeholder="Search by question text or category..."
                placeholderTextColor={COLORS.gray400}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredQuestions}
                keyExtractor={(item) => item._id}
                renderItem={renderQuestionItem}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No questions found in database.</Text>
                  </View>
                }
              />
            )}
          </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    paddingBottom: 60,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.selectedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  correctBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  optionsBox: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 10,
    gap: 4,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 13,
    color: COLORS.gray600,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editBtn: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 12,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray600,
    fontSize: 14,
  },
});

