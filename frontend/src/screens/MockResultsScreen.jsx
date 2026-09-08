import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { mockService } from '../services/mockService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function MockResultsScreen() {
  const router = useUniversalRouter();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await mockService.getMockResultsAdmin();
      setResults(data || []);
    } catch (e) {
      console.error('Failed to fetch mock results', e);
    } finally {
      setLoading(false);
    }
  };

  // Live filter
  const filtered = results.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const s = r.student || {};
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.courseName || '').toLowerCase().includes(q) ||
      (s.trainerName || '').toLowerCase().includes(q) ||
      (r.passStatus || '').toLowerCase().includes(q)
    );
  });

  // ── CSV Download ────────────────────────────────────────────
  const handleDownloadCSV = () => {
    if (Platform.OS !== 'web') return;

    const headers = [
      'Student Name', 'Email', 'Phone', 'Course', 'Trainer',
      'Assigned Model', 'Score', 'Total', 'Correct', 'Wrong',
      'Percentage', 'Status', 'Submitted At'
    ];

    const rows = filtered.map((r) => {
      const s = r.student || {};
      return [
        s.name || '',
        s.email || '',
        s.phone || '',
        s.courseName || '',
        s.trainerName || '',
        s.assignedMockModel || '',
        r.score ?? '',
        r.total ?? '',
        r.correctAnswers ?? '',
        r.wrongAnswers ?? '',
        r.percentage != null ? r.percentage.toFixed(2) + '%' : '',
        r.passStatus || '',
        r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN') : '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mock_test_results_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const passCount = results.filter(r => r.passStatus === 'PASS').length;
  const failCount = results.filter(r => r.passStatus === 'FAIL').length;

  return (
    <ProtectedRoute roleRequired="admin">
      <View style={styles.container}>
        <Navbar title="Mock Test Results" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderColor: '#bfdbfe' }]}>
              <Text style={styles.summaryNum}>{results.length}</Text>
              <Text style={styles.summaryLabel}>Total Attempted</Text>
            </View>
            <View style={[styles.summaryCard, { borderColor: '#bbf7d0' }]}>
              <Text style={[styles.summaryNum, { color: COLORS.success }]}>{passCount}</Text>
              <Text style={styles.summaryLabel}>Passed</Text>
            </View>
            <View style={[styles.summaryCard, { borderColor: '#fecaca' }]}>
              <Text style={[styles.summaryNum, { color: COLORS.danger }]}>{failCount}</Text>
              <Text style={styles.summaryLabel}>Failed</Text>
            </View>
          </View>

          {/* Search + CSV Bar */}
          <View style={styles.actionRow}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, email, course, status..."
                placeholderTextColor={COLORS.gray600}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {Platform.OS === 'web' && (
              <TouchableOpacity style={styles.csvBtn} onPress={handleDownloadCSV}>
                <Text style={styles.csvBtnText}>⬇️ Download CSV</Text>
              </TouchableOpacity>
            )}
          </View>

          {search.trim().length > 0 && (
            <View style={styles.resultChip}>
              <Text style={styles.resultChipText}>
                {filtered.length === 0
                  ? 'No results matched'
                  : `${filtered.length} of ${results.length} results shown`}
              </Text>
            </View>
          )}

          {/* Results List */}
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {search.trim() ? `No results found for "${search}"` : 'No mock test results yet.'}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filtered.map((r, idx) => {
                const s = r.student || {};
                const isPassed = r.passStatus === 'PASS';
                return (
                  <View key={r._id || idx} style={styles.resultCard}>
                    {/* Top row: name + PASS/FAIL badge */}
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{s.name || 'Unknown'}</Text>
                        <Text style={styles.studentSub}>
                          {s.email || ''}{s.phone ? ` | ${s.phone}` : ''}
                        </Text>
                        <Text style={styles.studentSub}>
                          Course: {s.courseName || '—'} | Trainer: {s.trainerName || '—'}
                        </Text>
                        <Text style={styles.studentSub}>
                          Model: {s.assignedMockModel || '—'}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, isPassed ? styles.passBadge : styles.failBadge]}>
                        <Text style={[styles.statusText, isPassed ? styles.passText : styles.failText]}>
                          {isPassed ? '✅ PASS' : '❌ FAIL'}
                        </Text>
                      </View>
                    </View>

                    {/* Score details */}
                    <View style={styles.scoreRow}>
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreVal}>{r.score ?? 0} / {r.total ?? 0}</Text>
                        <Text style={styles.scoreLabel}>Score</Text>
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={[styles.scoreVal, { color: COLORS.success }]}>{r.correctAnswers ?? 0}</Text>
                        <Text style={styles.scoreLabel}>Correct</Text>
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={[styles.scoreVal, { color: COLORS.danger }]}>{r.wrongAnswers ?? 0}</Text>
                        <Text style={styles.scoreLabel}>Wrong</Text>
                      </View>
                      <View style={styles.scoreItem}>
                        <Text style={[styles.scoreVal, { color: COLORS.primary }]}>
                          {r.percentage != null ? r.percentage.toFixed(1) + '%' : '—'}
                        </Text>
                        <Text style={styles.scoreLabel}>Percentage</Text>
                      </View>
                    </View>

                    {/* Bottom Row: Submitted Date & View Mistakes Button */}
                    <View style={styles.cardBottomRow}>
                      <Text style={styles.submittedAt}>
                        {r.submittedAt
                          ? `🕐 ${new Date(r.submittedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : ''}
                      </Text>

                      <TouchableOpacity
                        style={styles.viewMistakesBtn}
                        onPress={() => router.push('/view-mistakes', { id: r._id, isMock: 'true' })}
                      >
                        <Text style={styles.viewMistakesBtnText}>View Mistakes →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
  },
  scrollContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, alignItems: 'center', borderWidth: 1.5, ...SHADOWS.small,
  },
  summaryNum: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray600, marginTop: 2 },

  actionRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 10, marginBottom: 10, alignItems: 'center',
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.primary,
    paddingHorizontal: 10, paddingVertical: 6, ...SHADOWS.small,
  },
  searchIcon: { fontSize: 15, marginRight: 6 },
  searchInput: {
    flex: 1, fontSize: 13, color: COLORS.text, paddingVertical: 4,
    outlineStyle: 'none',
  },
  clearBtn: { paddingHorizontal: 6 },
  clearBtnText: { fontSize: 13, color: COLORS.gray600, fontWeight: '700' },

  csvBtn: {
    backgroundColor: '#059669', paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 10, ...SHADOWS.small,
  },
  csvBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  resultChip: {
    alignSelf: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 3, borderWidth: 1,
    borderColor: '#bfdbfe', marginBottom: 10,
  },
  resultChipText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },

  list: { gap: 12 },
  resultCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: COLORS.gray200, ...SHADOWS.small,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  studentName: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  studentSub: { fontSize: 11, color: COLORS.gray600, marginTop: 2 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginLeft: 10 },
  passBadge: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  failBadge: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  statusText: { fontSize: 13, fontWeight: '800' },
  passText: { color: COLORS.success },
  failText: { color: COLORS.danger },

  scoreRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: COLORS.gray100, borderRadius: 10, padding: 10, marginBottom: 8,
  },
  scoreItem: { alignItems: 'center' },
  scoreVal: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  scoreLabel: { fontSize: 10, fontWeight: '600', color: COLORS.gray600, marginTop: 2 },

  submittedAt: { fontSize: 11, color: COLORS.gray600, fontStyle: 'italic' },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  viewMistakesBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewMistakesBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  emptyCard: { backgroundColor: COLORS.white, padding: 30, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: COLORS.gray600, fontSize: 14 },
});
