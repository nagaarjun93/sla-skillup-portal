import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { adminService } from '../services/adminService';
import { mockService } from '../services/mockService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function StudentManagementScreen() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkMockEligible, setBulkMockEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Live-filtered list based on searchQuery
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.trainerName || '').toLowerCase().includes(q) ||
      (s.courseName || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllStudents();
      const studentList = data || [];
      setStudents(studentList);
      
      const allowedCount = studentList.filter(s => s.mockTestAllowed || s.mockTestEligible).length;
      if (studentList.length > 0 && allowedCount === studentList.length) {
        setBulkMockEligible(true);
      } else {
        setBulkMockEligible(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (studentId, currentStatus) => {
    const newStatus = currentStatus === 'active' || currentStatus === 'ACTIVE' ? 'inactive' : 'active';
    try {
      await adminService.updateStudentStatus(studentId, newStatus);
      setStudents(prev =>
        prev.map(s => (s._id === studentId ? { ...s, status: newStatus.toUpperCase() } : s))
      );
    } catch (e) {
      Alert.alert('Error', 'Could not update student status');
    }
  };

  const handleToggleSingleMockAccess = async (studentId, currentAccess) => {
    const newAccess = !currentAccess;
    try {
      await mockService.updateStudentMockEligibility(studentId, newAccess);
      setStudents(prev =>
        prev.map(s => (s._id === studentId ? { ...s, mockTestAllowed: newAccess, mockTestEligible: newAccess } : s))
      );
      const msg = newAccess
        ? '🟢 Mock test access ENABLED for student!'
        : '🔴 Mock test access DISABLED for student.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Updated', msg);
    } catch (e) {
      Alert.alert('Error', 'Could not update student mock test access');
    }
  };

  const handleBulkMockToggle = async (val) => {
    setBulkMockEligible(val);
    setSaving(true);
    try {
      await mockService.setBulkMockEligibility(val);
      setStudents(prev => prev.map(s => ({ ...s, mockTestAllowed: val, mockTestEligible: val })));
      const msg = `Updated all students Mock Test Access to: ${val ? '🟢 Allowed' : '🔴 Locked'}`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Success', msg);
    } catch (e) {
      Alert.alert('Error', 'Could not update bulk mock access');
    } finally {
      setSaving(false);
    }
  };

  const renderStudentCard = (item) => {
    const isMockAllowed = !!(item.mockTestAllowed || item.mockTestEligible);
    const isActive = item.status === 'active' || item.status === 'ACTIVE';
    const assignedModel = item.assignedMockModel || 'Model 1';

    return (
      <View key={item._id} style={styles.card}>
        {/* Prominent Mock Test Access Status Badge Above Name */}
        <View style={styles.badgeTopRow}>
          <View style={[styles.mockBadge, isMockAllowed ? styles.mockAllowedBadge : styles.mockLockedBadge]}>
            <Text style={[styles.mockBadgeText, isMockAllowed ? styles.mockAllowedText : styles.mockLockedText]}>
              {isMockAllowed ? `🟢 Mock Test Allowed (${assignedModel})` : '🔴 Mock Test Locked'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}
            onPress={() => handleToggleStatus(item._id, item.status)}
          >
            <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
              {isActive ? '🟢 Active Account' : '🔴 Inactive Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.subText}>{item.email} | {item.phone}</Text>
            <Text style={styles.subText}>Course: {item.courseName || 'Full Stack Java'} | Trainer: {item.trainerName || 'SLA Faculty'}</Text>
          </View>
        </View>

        <View style={styles.mockAccessRow}>
          <View style={styles.mockAccessCol}>
            <Text style={styles.mockAccessLabel}>🎯 Official Mock Exam Access Switch:</Text>
            <Text style={styles.mockAccessSub}>
              {isMockAllowed ? 'Student is eligible to start the Official Mock Exam' : 'Access is currently locked'}
            </Text>
          </View>

          <Switch
            value={isMockAllowed}
            onValueChange={() => handleToggleSingleMockAccess(item._id, isMockAllowed)}
            trackColor={{ false: '#cbd5e1', true: '#bbf7d0' }}
            thumbColor={isMockAllowed ? COLORS.success : '#94a3b8'}
          />
        </View>
      </View>
    );
  };

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Student Management & Mock Access" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
        >
          <View style={styles.bulkBanner}>
            <View style={styles.bannerCol}>
              <Text style={styles.bannerTitle}>Bulk Mock Test Access (All Students)</Text>
              <Text style={styles.subheading}>Grant or revoke Official Mock Test access for ALL registered students at once</Text>
            </View>

            <Switch
              value={bulkMockEligible}
              onValueChange={handleBulkMockToggle}
              disabled={saving}
              trackColor={{ false: '#cbd5e1', true: '#bbf7d0' }}
              thumbColor={bulkMockEligible ? COLORS.success : '#94a3b8'}
            />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Student Name, Trainer, or Course..."
                placeholderTextColor={COLORS.gray600}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Result count chip */}
            {searchQuery.trim().length > 0 && (
              <View style={styles.resultChip}>
                <Text style={styles.resultChipText}>
                  {filteredStudents.length === 0
                    ? 'No students found'
                    : `${filteredStudents.length} of ${students.length} students matched`}
                </Text>
              </View>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : filteredStudents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `No students found for "${searchQuery}"`
                  : 'No registered students found.'}
              </Text>
              {searchQuery.trim().length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.list}>
              {filteredStudents.map(renderStudentCard)}
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
    // Do NOT set a fixed height here — it clips the ScrollView on web.
    // flex: 1 lets the navigator/root give us the full remaining height.
  },
  scrollView: {
    flex: 1,
    // On web, React Native's ScrollView needs overflow-y to be scrollable with mouse wheel
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    // Ensure content can expand naturally — do NOT set maxHeight here
    flexGrow: 1,
  },
  // ── Search Bar ──────────────────────────────────────────────
  searchContainer: {
    marginBottom: 14,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...SHADOWS.small,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 6,
    outlineStyle: 'none',  // web: removes blue focus outline since we style the border ourselves
  },
  clearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 14,
    color: COLORS.gray600,
    fontWeight: '700',
  },
  resultChip: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  resultChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  clearSearchBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  clearSearchText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  bulkBanner: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  bannerCol: {
    flex: 1,
    marginRight: 10,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
  },
  subheading: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  list: {
    gap: 12,
    flexDirection: 'column',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.small,
  },
  badgeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mockAllowedBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  mockLockedBadge: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  mockBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  mockAllowedText: {
    color: COLORS.success,
  },
  mockLockedText: {
    color: COLORS.danger,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subText: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#f0fdf4',
  },
  inactiveBadge: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeText: {
    color: COLORS.success,
  },
  inactiveText: {
    color: COLORS.danger,
  },
  mockAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  mockAccessCol: {
    flex: 1,
    marginRight: 10,
  },
  mockAccessLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  mockAccessSub: {
    fontSize: 11,
    color: COLORS.gray600,
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
