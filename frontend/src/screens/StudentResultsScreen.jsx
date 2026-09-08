import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { adminService } from '../services/adminService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function StudentResultsScreen() {
  const router = useUniversalRouter();

  const [activeTab, setActiveTab] = useState('attempted');
  const [results, setResults] = useState([]);
  const [notAttempted, setNotAttempted] = useState([]);
  const [viewAllWeeks, setViewAllWeeks] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab, viewAllWeeks]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'attempted') {
        const data = await adminService.getResults({ viewAll: viewAllWeeks });
        setResults(data || []);
      } else {
        const notData = await adminService.getNotAttemptedStudents();
        setNotAttempted(notData || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvExport = () => {
    Alert.alert('CSV Export', `Exporting ${results.length} result records to CSV format.`);
  };

  const renderResultItem = (item) => (
    <View key={item._id} style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.studentName}>{item.student?.name || 'Student'}</Text>
          <Text style={styles.subText}>{item.student?.courseName} | {item.student?.phone}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{item.score} / {item.total}</Text>
        </View>
      </View>

      <Text style={styles.categoryText}>Category: {item.category}</Text>

      <View style={styles.bottomRow}>
        <Text style={styles.dateText}>{new Date(item.submittedAt).toLocaleDateString()}</Text>
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => router.push('/view-mistakes', { id: item._id })}
        >
          <Text style={styles.detailsText}>View Mistakes →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotAttemptedItem = (item) => (
    <View key={item._id} style={styles.card}>
      <Text style={styles.studentName}>{item.name}</Text>
      <Text style={styles.subText}>{item.email} | {item.phone}</Text>
      <Text style={styles.subText}>Course: {item.courseName} | Trainer: {item.trainerName}</Text>
      <Text style={[styles.dateText, { marginTop: 6, color: COLORS.danger }]}>
        ⚠️ Has not attempted current weekly test
      </Text>
    </View>
  );

  const listData = activeTab === 'attempted' ? results : notAttempted;

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Student Test Results" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'attempted' && styles.activeTabBtn]}
              onPress={() => setActiveTab('attempted')}
            >
              <Text style={[styles.tabText, activeTab === 'attempted' && styles.activeTabText]}>
                Attempted Results ({results.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'not-attempted' && styles.activeTabBtn]}
              onPress={() => setActiveTab('not-attempted')}
            >
              <Text style={[styles.tabText, activeTab === 'not-attempted' && styles.activeTabText]}>
                Not Attempted ({notAttempted.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'attempted' && (
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterToggle, viewAllWeeks && styles.filterToggleActive]}
                onPress={() => setViewAllWeeks(!viewAllWeeks)}
              >
                <Text style={[styles.filterText, viewAllWeeks && styles.filterTextActive]}>
                  {viewAllWeeks ? 'Showing All Weeks' : 'Current Week Only'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.csvBtn} onPress={handleCsvExport}>
                <Text style={styles.csvText}>📥 Export CSV</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : listData.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {activeTab === 'attempted' ? 'No test results found.' : 'All active students have attempted the test! 🎉'}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {activeTab === 'attempted'
                ? results.map(renderResultItem)
                : notAttempted.map(renderNotAttemptedItem)}
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
    paddingBottom: 80,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  filterToggle: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  filterToggleActive: {
    backgroundColor: COLORS.selectedBg,
    borderColor: COLORS.selectedBorder,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  csvBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  csvText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subText: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 1,
  },
  scoreBadge: {
    backgroundColor: COLORS.selectedBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    marginVertical: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: 8,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.gray600,
  },
  detailsBtn: {},
  detailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
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
