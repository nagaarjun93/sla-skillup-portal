import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { weeklyService } from '../services/weeklyService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function PreviousTestsScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await weeklyService.getStudentWeeklyHistory();
      setHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = (item) => (
    <View key={item._id} style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{item.weeklyTestId?.title || item.weeklyTestId?.weekName || `${item.category || 'Aptitude'} Practice Test`}</Text>
        <Text style={styles.dateText}>{new Date(item.submittedAt).toLocaleDateString()}</Text>
      </View>

      <Text style={styles.subText}>Category / Topic: {item.category || item.weeklyTestId?.topic || 'General'}</Text>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Submitted Successfully</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ProtectedRoute roleRequired="student">
      <View style={styles.container}>
        <Navbar title="Finished Tests History" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.heading}>Past Weekly & Practice Tests</Text>
          <Text style={styles.subheading}>Review completed tests from previous weeks</Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No completed weekly tests found in history.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {history.map(renderHistoryItem)}
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
    paddingBottom: 100,
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
    marginBottom: 16,
  },
  list: {
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
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  subText: {
    fontSize: 13,
    color: COLORS.gray600,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: COLORS.selectedBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
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
