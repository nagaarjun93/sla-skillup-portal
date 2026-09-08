import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { weeklyService } from '../services/weeklyService';
import { COLORS, SHADOWS } from '../styles/theme';

export default function PreviousTestsScreen() {
  const router = useUniversalRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lockModalData, setLockModalData] = useState(null);

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

  const handleShowLockedPopup = (item, hours, mins) => {
    setLockModalData({
      title: item.weeklyTestId?.title || item.weeklyTestId?.weekName || `${item.category || 'Weekly'} Test`,
      hoursRemaining: hours,
      minutesRemaining: mins,
      score: `${item.score ?? 0} / ${item.total ?? 0}`,
    });
  };

  const renderHistoryItem = (item) => {
    const submittedTime = item.submittedAt ? new Date(item.submittedAt).getTime() : 0;
    const msPassed = Date.now() - submittedTime;
    const unlockMs = 24 * 60 * 60 * 1000;
    const isLocked = msPassed < unlockMs;
    const msRemaining = Math.max(0, unlockMs - msPassed);
    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <View key={item._id} style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.title}>
            {item.weeklyTestId?.title || item.weeklyTestId?.weekName || `${item.category || 'Weekly'} Test`}
          </Text>
          <Text style={styles.dateText}>
            {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : ''}
          </Text>
        </View>

        <Text style={styles.subText}>
          Topic: {item.category || item.weeklyTestId?.topic || 'Weekly Exam'}
        </Text>

        {/* Score Row: Completely hidden until 24-hour review unlock */}
        {isLocked ? (
          <View style={styles.lockedScoreCard}>
            <View style={styles.lockInfoBadge}>
              <Text style={styles.lockBadgeIcon}>🔒</Text>
              <Text style={styles.lockBadgeText}>Marks & Answers Locked for 24 Hours</Text>
            </View>
          </View>
        ) : (
          <View style={styles.scoreRow}>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreNumber}>{item.score ?? 0} / {item.total ?? 0}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <View style={styles.scoreCol}>
              <Text style={[styles.scoreNumber, { color: COLORS.success }]}>{item.correctAnswers ?? 0}</Text>
              <Text style={styles.scoreLabel}>Correct</Text>
            </View>
            <View style={styles.scoreCol}>
              <Text style={[styles.scoreNumber, { color: COLORS.danger }]}>{item.wrongAnswers ?? 0}</Text>
              <Text style={styles.scoreLabel}>Wrong</Text>
            </View>
          </View>
        )}

        {/* Review Action: Pop up lock explanation if clicked while locked */}
        <View style={styles.actionRow}>
          {isLocked ? (
            <TouchableOpacity
              style={styles.lockedBtn}
              onPress={() => handleShowLockedPopup(item, hoursRemaining, minutesRemaining)}
              activeOpacity={0.8}
            >
              <Text style={styles.lockedBtnText}>
                🔒 Review Mistakes (Unlocks in {hoursRemaining}h {minutesRemaining}m)
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.unlockedBtn}
              onPress={() => router.push('/view-mistakes', { id: item._id })}
            >
              <Text style={styles.unlockedBtnText}>
                📋 Review Mistakes & Answers →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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

        {/* 24-Hour Review Locked Modal Popup */}
        <Modal
          visible={!!lockModalData}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setLockModalData(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalIconCircle}>
                <Text style={styles.modalIconText}>🔒</Text>
              </View>

              <Text style={styles.modalTitle}>Review & Mistakes Locked</Text>
              <Text style={styles.modalSubTitle}>{lockModalData?.title}</Text>

              <Text style={styles.modalDesc}>
                To maintain fair competition and prevent question leakage, detailed correct answers, wrong answers, and question solutions unlock 24 hours after test submission.
              </Text>

              {/* Countdown Display */}
              <View style={styles.modalCountdownBox}>
                <Text style={styles.modalCountdownLabel}>⏳ Review Unlocks In:</Text>
                <Text style={styles.modalCountdownValue}>
                  {lockModalData?.hoursRemaining} Hours {lockModalData?.minutesRemaining} Mins
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setLockModalData(null)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCloseBtnText}>✓ Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scoreCol: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 2,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 2,
  },
  lockedBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  lockedBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  unlockedBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  unlockedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray600,
    fontSize: 14,
  },
  lockedScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lockInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  lockBadgeIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },
  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#fde68a',
  },
  modalIconText: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  modalCountdownBox: {
    width: '100%',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  modalCountdownLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalCountdownValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e3a8a',
  },
  modalScoreBox: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalScoreLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  modalScoreVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modalCloseBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
