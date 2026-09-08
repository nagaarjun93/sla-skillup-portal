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

const APTITUDE_TOPICS = [
  { id: '1', name: 'Vedic Math / Simplification', category: 'Vedic Math', icon: '🧮' },
  { id: '2', name: 'Ratio & Proportion / HCF & LCM', category: 'Ratio and Proportion', icon: '⚖️' },
  { id: '3', name: 'Percentage', category: 'Percentage', icon: '📊' },
  { id: '4', name: 'Time & Work / Pipes & Cistern', category: 'Time and Work', icon: '⏱️' },
  { id: '5', name: 'Time, Speed & Distance', category: 'Speed and Distance', icon: '🚗' },
  { id: '6', name: 'Trains, Boats & Streams', category: 'Trains and Boats', icon: '🚂' },
  { id: '7', name: 'Profit & Loss', category: 'Profit and Loss', icon: '📈' },
  { id: '8', name: 'Ages', category: 'Ages', icon: '👤' },
  { id: '9', name: 'Simple Interest', category: 'Simple Interest', icon: '💰' },
  { id: '10', name: 'Compound Interest', category: 'Compound Interest', icon: '🏦' },
  { id: '11', name: 'Permutation & Combination', category: 'Permutation', icon: '🎲' },
  { id: '12', name: 'Probability', category: 'Probability', icon: '🎯' },
];

const REASONING_TOPICS = [
  { id: '13', name: 'Alphabet Test / Letter Series', category: 'Alphabet Test', icon: '🔤' },
  { id: '14', name: 'Blood Relations', category: 'Blood Relation', icon: '👨‍👩‍👧‍👦' },
  { id: '15', name: 'Coding & Decoding', category: 'Coding Decoding', icon: '🔐' },
  { id: '16', name: 'Syllogism', category: 'Syllogism', icon: '🧠' },
  { id: '17', name: 'Mathematical Operations (MOT)', category: 'MOT', icon: '➕' },
  { id: '18', name: 'Seating Arrangement / Puzzles', category: 'Seating Arrangement', icon: '🪑' },
  { id: '19', name: 'Direction Test', category: 'Direction Test', icon: '🧭' },
];

export default function CategorySelectScreen() {
  const router = useUniversalRouter();
  const [dbCategories, setDbCategories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryDetails();
  }, []);

  const fetchCategoryDetails = async () => {
    setLoading(true);
    try {
      const data = await examService.getCategoryDetails();
      const catMap = {};
      (data || []).forEach(item => {
        catMap[item.category] = item;
      });
      setDbCategories(catMap);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open Paper & Pen Practice View for selected topic
  const handleOpenPaperPractice = (topicObj) => {
    const categoryName = topicObj.category || topicObj.name;
    router.push({
      pathname: '/topic-questions',
      params: {
        category: categoryName,
        title: topicObj.name,
      },
    });
  };

  // Start Timed Practice Exam for selected topic
  const handleStartTimedExam = (topicObj) => {
    const categoryName = topicObj.category || topicObj.name;
    const dbInfo = dbCategories[categoryName];
    router.push({
      pathname: '/exam',
      params: {
        category: categoryName,
        title: topicObj.name,
        duration: dbInfo?.durationMinutes || 30,
      },
    });
  };

  const renderTopicCard = (item) => {
    const dbInfo = dbCategories[item.category];
    const qCount = dbInfo ? dbInfo.totalQuestions : 0;
    const duration = dbInfo ? dbInfo.durationMinutes : 30;

    return (
      <View key={item.id} style={styles.categoryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconTitleRow}>
            <Text style={styles.topicIcon}>{item.icon}</Text>
            <Text style={styles.categoryTitle}>{item.name}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>📝 {qCount} Qs</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.paperPracticeBtn}
            onPress={() => handleOpenPaperPractice(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.paperPracticeText}>📄 View Practice Questions (Paper & Pen)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.timedExamBtn}
            onPress={() => handleStartTimedExam(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.timedExamText}>⏱️ Timed Test ({duration}m)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ProtectedRoute roleRequired="student">
      <View style={styles.container}>
        <Navbar title="Aptitude & Reasoning Practice Topics" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.headerBanner}>
            <Text style={styles.heading}>Choose a Topic to Practice</Text>
            <Text style={styles.subheading}>
              View questions to solve with paper & pen OR take a timed practice exam.
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Aptitude Topics Section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🔢 Aptitude Topics ({APTITUDE_TOPICS.length})</Text>
              </View>
              <View style={styles.topicGrid}>
                {APTITUDE_TOPICS.map(renderTopicCard)}
              </View>

              {/* Reasoning Topics Section */}
              <View style={[styles.sectionHeader, { marginTop: 28 }]}>
                <Text style={styles.sectionTitle}>🧠 Reasoning Topics ({REASONING_TOPICS.length})</Text>
              </View>
              <View style={styles.topicGrid}>
                {REASONING_TOPICS.map(renderTopicCard)}
              </View>
            </>
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
    paddingBottom: 100,
  },
  headerBanner: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.gray600,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  topicGrid: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  topicIcon: {
    fontSize: 22,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 10,
  },
  paperPracticeBtn: {
    flex: 1,
    backgroundColor: COLORS.selectedBg,
    borderWidth: 1,
    borderColor: COLORS.selectedBorder,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  paperPracticeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  timedExamBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  timedExamText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
