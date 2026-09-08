import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';

export default function WeeklyTestCard({ test, onStartTest }) {
  if (!test) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Live':
        return COLORS.success;
      case 'Upcoming':
        return COLORS.warning;
      case 'Completed':
        return COLORS.gray400;
      default:
        return COLORS.primary;
    }
  };

  const statusColor = test.alreadyAttempted ? COLORS.success : getStatusColor(test.status);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          <Text style={styles.weekTag}>Week {test.weekNumber || '#'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {test.alreadyAttempted ? 'Completed' : (test.status || 'Live')}
            </Text>
          </View>
        </View>
        <Text style={styles.durationText}>{test.duration} mins</Text>
      </View>

      <Text style={styles.title}>{test.title || test.weekName}</Text>
      <Text style={styles.topicText}>Topic: {test.topic}</Text>
      {test.description ? <Text style={styles.descText}>{test.description}</Text> : null}

      {test.alreadyAttempted ? (
        <View style={styles.completedBadgeBox}>
          <Text style={styles.completedBadgeText}>
            ✅ You have already submitted this Weekly Test!
          </Text>
        </View>
      ) : (
        test.status === 'Live' && onStartTest && (
          <TouchableOpacity style={styles.startBtn} onPress={() => onStartTest(test)}>
            <Text style={styles.startBtnText}>Attempt Test Now</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    ...SHADOWS.small,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekTag: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  durationText: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  topicText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  descText: {
    fontSize: 12,
    color: COLORS.gray600,
    marginBottom: 12,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  startBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  completedBadgeBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  completedBadgeText: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 13,
  },
});
