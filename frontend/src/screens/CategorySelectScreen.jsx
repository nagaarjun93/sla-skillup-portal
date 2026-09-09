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

export default function CategorySelectScreen() {
  const router = useUniversalRouter();
  const [topics, setTopics] = useState([]);
  const [dbCategories, setDbCategories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topicsData, catDetails] = await Promise.all([
        examService.getTopics(),
        examService.getCategoryDetails(),
      ]);

      setTopics(topicsData || []);

      const catMap = {};
      (catDetails || []).forEach(item => {
        catMap[item.category] = item;
      });
      setDbCategories(catMap);
    } catch (error) {
      console.error('Error fetching categories and topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const aptitudeTopics = topics.filter(t => (t.type || 'aptitude') === 'aptitude');
  const reasoningTopics = topics.filter(t => t.type === 'reasoning');

  // Open Paper & Pen Practice View for selected topic
  const handleOpenPaperPractice = (topicObj) => {
    const categoryName = topicObj.category || topicObj.name;
    router.push({
      pathname: '/topic-questions',
      params: {
        category: categoryName,
        topic: topicObj.name,
        title: topicObj.name,
      },
    });
  };

  // Start Timed Practice Exam for selected topic (Dynamic duration from DB)
  const handleStartTimedExam = (topicObj) => {
    const categoryName = topicObj.category || topicObj.name;
    const dbInfo = dbCategories[topicObj.name] || dbCategories[categoryName];
    router.push({
      pathname: '/exam',
      params: {
        category: categoryName,
        topic: topicObj.name,
        title: topicObj.name,
        duration: dbInfo?.durationMinutes || 30,
      },
    });
  };

  const renderTopicCard = (item) => {
    const categoryName = item.category || item.name;
    const dbInfo = dbCategories[item.name] || dbCategories[categoryName];
    const qCount = dbInfo ? dbInfo.totalQuestions : 0;
    const duration = dbInfo ? dbInfo.durationMinutes : 30;

    return (
      <View key={item._id || item.id || item.name} style={styles.categoryCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.topicIcon}>{item.icon || '📚'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.qCountBadge}>
                {qCount} Questions in DB
              </Text>
              <Text style={styles.durationBadge}>
                ⏱ {duration} Mins
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.paperPracticeBtn}
            onPress={() => handleOpenPaperPractice(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.paperBtnText}>📝 Practice (Q&A)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.timedExamBtn}
            onPress={() => handleStartTimedExam(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.timedBtnText}>⏱ Take Exam</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Navbar title="Practice by Topic" />

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
                <Text style={styles.sectionTitle}>🔢 Aptitude Topics ({aptitudeTopics.length})</Text>
              </View>
              <View style={styles.topicGrid}>
                {aptitudeTopics.map(renderTopicCard)}
              </View>

              {/* Reasoning Topics Section */}
              <View style={[styles.sectionHeader, { marginTop: 28 }]}>
                <Text style={styles.sectionTitle}>🧠 Reasoning Topics ({reasoningTopics.length})</Text>
              </View>
              <View style={styles.topicGrid}>
                {reasoningTopics.map(renderTopicCard)}
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
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  topicIcon: {
    fontSize: 26,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qCountBadge: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    backgroundColor: COLORS.selectedBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationBadge: {
    fontSize: 11,
    color: COLORS.gray600,
    fontWeight: '600',
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionsRow: {
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
  paperBtnText: {
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
  timedBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
