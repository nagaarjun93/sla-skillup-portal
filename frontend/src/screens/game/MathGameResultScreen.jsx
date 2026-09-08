import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';

export default function MathGameResultScreen({ route, navigation }) {
  const {
    mode = 'level',
    levelNumber = 1,
    score = 0,
    correctCount = 0,
    totalQuestions = 10,
    unlockedNext = false,
    coinsEarned = 0,
    mistakesList = [],
  } = route.params || {};

  const handleNextLevel = () => {
    navigation.replace('math-game-play', {
      mode: 'level',
      levelNumber: levelNumber + 1,
    });
  };

  const handleRetry = () => {
    navigation.replace('math-game-play', {
      mode,
      levelNumber,
    });
  };

  const handleGoHome = () => {
    navigation.navigate('math-game-home');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.badgeText}>
          {mode === 'level' ? `Level ${levelNumber}` : 'Speed Challenge'}
        </Text>
        <Text style={styles.title}>Result Summary</Text>

        {/* ── 1. MARKS / SCORE ── */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>🎯 MARKS & SCORE</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreNumber}>{correctCount} / {totalQuestions}</Text>
              <Text style={styles.scoreSubLabel}>Marks Scored</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreNumber, { color: '#2563eb' }]}>{score}</Text>
              <Text style={styles.scoreSubLabel}>Total Points</Text>
            </View>
          </View>
        </View>

        {/* ── 2. MISTAKES BREAKDOWN ── */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>
            {mistakesList.length > 0 ? `❌ MISTAKES (${mistakesList.length})` : '✅ MISTAKES'}
          </Text>

          {mistakesList.length === 0 ? (
            <View style={styles.noMistakesCard}>
              <Text style={styles.noMistakesEmoji}>🎉</Text>
              <Text style={styles.noMistakesText}>Awesome! Zero Mistakes Made!</Text>
            </View>
          ) : (
            <View style={styles.mistakesList}>
              {mistakesList.map((m, idx) => (
                <View key={idx} style={styles.mistakeItem}>
                  <Text style={styles.mistakeQuestion}>
                    Q{idx + 1}: <Text style={{ fontWeight: '800' }}>{m.question}</Text>
                  </Text>
                  <View style={styles.mistakeAnswerRow}>
                    <Text style={styles.wrongAnswerText}>
                      Your Answer: <Text style={{ fontWeight: '700' }}>{m.userAnswer} ❌</Text>
                    </Text>
                    <Text style={styles.correctAnswerText}>
                      Correct: <Text style={{ fontWeight: '700' }}>{m.correctAnswer} ✅</Text>
                    </Text>
                  </View>
                  {m.tip ? (
                    <Text style={styles.mistakeTip}>💡 Shortcut: {m.tip}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── 3. COINS EARNED ── */}
        <View style={[styles.sectionBox, styles.coinsBox]}>
          <Text style={styles.coinsEmoji}>🪙</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.coinsTitle}>+{coinsEarned} Coins Earned!</Text>
            <Text style={styles.coinsSubtitle}>Saved to your MongoDB account wallet</Text>
          </View>
        </View>

        {/* ── ACTION BUTTONS ── */}
        <View style={styles.actionsContainer}>
          {unlockedNext && levelNumber < 50 && (
            <TouchableOpacity
              style={styles.nextLevelButton}
              onPress={handleNextLevel}
              activeOpacity={0.8}
            >
              <Text style={styles.nextLevelText}>Next Level ({levelNumber + 1}) ➔</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>🔄 Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <Text style={styles.homeButtonText}>🏠 Game Hub</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  contentContainer: {
    padding: 16,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#14217f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 16px rgba(20, 33, 127, 0.08)',
      },
    }),
  },
  badgeText: {
    alignSelf: 'center',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#14217f',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#cbd5e1',
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#10b981',
  },
  scoreSubLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  noMistakesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  noMistakesEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  noMistakesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
  },
  mistakesList: {
    gap: 8,
  },
  mistakeItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 10,
    padding: 10,
  },
  mistakeQuestion: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  mistakeAnswerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  wrongAnswerText: {
    fontSize: 12,
    color: '#ef4444',
  },
  correctAnswerText: {
    fontSize: 12,
    color: '#15803d',
  },
  mistakeTip: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  coinsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  coinsEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  coinsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#b45309',
  },
  coinsSubtitle: {
    fontSize: 11,
    color: '#92400e',
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 10,
    gap: 10,
  },
  nextLevelButton: {
    backgroundColor: '#14217f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextLevelText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  retryButton: {
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryText: {
    color: '#14217f',
    fontSize: 14,
    fontWeight: '700',
  },
  homeButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});