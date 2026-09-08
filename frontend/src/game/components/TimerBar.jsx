import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TimerBar({ timeLeft = 10, totalTime = 10, showText = true }) {
  const percentage = Math.max(0, Math.min(100, (timeLeft / (totalTime || 1)) * 100));

  // Determine dynamic color based on remaining percentage
  let barColor = '#10b981'; // Green
  if (percentage <= 25) {
    barColor = '#ef4444'; // Red
  } else if (percentage <= 55) {
    barColor = '#f59e0b'; // Amber / Orange
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      {showText && (
        <View style={styles.timeLabelRow}>
          <Text style={[styles.timeLabel, { color: barColor }]}>
            ⏱ {Math.ceil(timeLeft)}s
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  track: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  timeLabelRow: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});

