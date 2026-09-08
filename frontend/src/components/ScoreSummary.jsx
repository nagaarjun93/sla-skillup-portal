import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';

export default function ScoreSummary({ score, total, correctAnswers, wrongAnswers }) {
  return (
    <View style={styles.card}>
      <Text style={styles.headerTitle}>Score Summary (Admin View)</Text>

      <View style={styles.scoreRow}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreNumber}>{score} / {total}</Text>
          <Text style={styles.scoreLabel}>Total Score</Text>
        </View>
      </View>

      <View style={styles.breakdownRow}>
        <Text style={[styles.breakdownText, { color: COLORS.success }]}>
          ✓ Correct: {correctAnswers !== undefined ? correctAnswers : score}
        </Text>
        <Text style={[styles.breakdownText, { color: COLORS.danger }]}>
          ✗ Wrong: {wrongAnswers !== undefined ? wrongAnswers : total - score}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 18,
    marginVertical: 10,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray600,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 10,
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray600,
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
  },
  breakdownText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
