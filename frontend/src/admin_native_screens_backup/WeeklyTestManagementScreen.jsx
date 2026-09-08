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
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { weeklyService } from '../services/weeklyService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function WeeklyTestManagementScreen() {
  const router = useUniversalRouter();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [weekNumber, setWeekNumber] = useState('');
  const [weekName, setWeekName] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('30');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const data = await weeklyService.getAllWeeklyTestsAdmin();
      setTests(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async () => {
    if (!weekName || !topic || !duration) {
      Alert.alert('Required Fields', 'Please enter Week Name, Topic, and Duration');
      return;
    }

    setSubmitting(true);
    try {
      await weeklyService.createWeeklyTest({
        weekNumber: Number(weekNumber) || 1,
        title: weekName,
        weekName,
        topic,
        duration: Number(duration),
        active: true,
      });

      setModalVisible(false);
      setWeekNumber('');
      setWeekName('');
      setTopic('');
      fetchTests();

      Alert.alert(
        'Weekly Test Created! 📋',
        'Weekly test has been created successfully!\n\nPlease upload or attach questions now so students can take this test.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Upload Questions Now 📁',
            onPress: () => router.push('/question-upload'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create weekly test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTest = (id) => {
    Alert.alert('Delete Test', 'Are you sure you want to delete this weekly test?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await weeklyService.deleteWeeklyTest(id);
            fetchTests();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete weekly test');
          }
        },
      },
    ]);
  };

  const renderTestItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.weekTag}>Week #{item.weekNumber || 1}</Text>
        <Text style={styles.statusText}>{item.status || 'Live'}</Text>
      </View>

      <Text style={styles.title}>{item.weekName || item.title}</Text>
      <Text style={styles.sub}>Topic: {item.topic} | Duration: {item.duration} mins</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => router.push('/question-upload')}
        >
          <Text style={styles.uploadBtnText}>📁 Upload CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.questionsBtn}
          onPress={() => router.push({ pathname: '/this-week-questions', params: { testId: item._id } })}
        >
          <Text style={styles.questionsBtnText}>📝 Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteTest(item._id)}>
          <Text style={styles.deleteBtnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Weekly Test Management" />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Scheduled Weekly Tests</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.createBtnText}>+ New Test</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={tests}
              keyExtractor={(item) => item._id}
              renderItem={renderTestItem}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No weekly tests created yet.</Text>
                </View>
              }
            />
          )}
        </View>

        <Modal visible={modalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <View style={styles.modalOverlay}>
              <ScrollView contentContainerStyle={styles.modalCard} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>Schedule Weekly Test</Text>

                <Text style={styles.label}>Week Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="number-pad"
                  value={weekNumber}
                  onChangeText={setWeekNumber}
                />

                <Text style={styles.label}>Week Name / Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Week 1 - Vedic Math Basics"
                  placeholderTextColor={COLORS.gray400}
                  value={weekName}
                  onChangeText={setWeekName}
                />

                <Text style={styles.label}>Topic *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vedic Math"
                  placeholderTextColor={COLORS.gray400}
                  value={topic}
                  onChangeText={setTopic}
                />

                <Text style={styles.label}>Duration (Minutes) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="number-pad"
                  value={duration}
                  onChangeText={setDuration}
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveBtn, submitting && styles.disabledBtn]}
                    onPress={handleCreateTest}
                    disabled={submitting}
                  >
                    {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveText}>Save Test</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekTag: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    color: COLORS.gray600,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    alignItems: 'center',
  },
  uploadBtn: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  uploadBtnText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 12,
  },
  questionsBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  questionsBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelText: {
    color: COLORS.gray600,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.7,
  },
});

