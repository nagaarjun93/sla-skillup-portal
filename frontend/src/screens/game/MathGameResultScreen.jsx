import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import StarRating from '../../game/components/StarRating';

export default function MathGameResultScreen({ route, navigation }) {
  const {
    mode = 'level',
    levelNumber = 1,
    score = 0,
    correctCount = 0,
    wrongCount = 0,
    totalQuestions = 10,
    maxStreak = 0,
    starsEarned = 0,
    unlockedNext = false,
    coinsEarned = 0,
    isBoss = false,
    bossName = '',
    bossAvatar = '👹',
    bossDefeated = false,
  } = route.params || {};

  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isPassed = mode === 'level' ? starsEarned >= 1 : correctCount > 0;

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

  const handleGoToLevels = () => {
    navigation.navigate('math-game-levels');
  };

  const handleGoToStore = () => {
    navigation.navigate('math-game-store');
  };

  const handleGoHome = () => {
    navigation.navigate('math-game-home');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Result Card */}
      <View style={styles.card}>
        {/* Status Icon & Title */}
        <Text style={styles.trophyIcon}>
          {isBoss && bossDefeated
            ? '👑'
            : starsEarned === 3
            ? '🏆'
            : isPassed
            ? '⭐'
            : '💪'}
        </Text>

        <Text style={styles.resultTitle}>
          {isBoss && bossDefeated
            ? `${bossName} DEFEATED!`
            : mode === 'speed'
            ? 'Speed Run Finished!'
            : isPassed
            ? `Level ${levelNumber} Passed!`
            : `Level ${levelNumber} Incomplete`}
        </Text>

        <Text style={styles.resultSubtitle}>
          {isBoss && bossDefeated
            ? 'Epic Victory! You conquered this boss stage and claimed the bounty!'
            : mode === 'speed'
            ? 'Great speed and mental stamina!'
            : isPassed
            ? 'Awesome mental agility! Keep sharpening your skills.'
            : 'Practice the shortcut tricks and try again!'}
        </Text>

        {/* Stars */}
        {mode === 'level' && (
          <View style={styles.starsWrapper}>
            <StarRating stars={starsEarned} size={36} />
          </View>
        )}

        {/* Boss Defeated Banner */}
        {isBoss && bossDefeated && (
          <View style={styles.bossBanner}>
            <Text style={styles.bossBannerText}>
              ⚔️ {bossAvatar} BOSS SLAIN! Massive Coin Bounty Earned!
            </Text>
          </View>
        )}

        {/* Unlocked next level banner */}
        {unlockedNext && levelNumber < 50 && (
          <View style={styles.unlockedBanner}>
            <Text style={styles.unlockedText}>
              🔓 Level {levelNumber + 1} Unlocked!
            </Text>
          </View>
        )}

        {/* Coins Earned Box */}
        {coinsEarned > 0 && (
          <View style={styles.coinsRewardBox}>
            <Text style={styles.coinsRewardEmoji}>🪙</Text>
            <View>
              <Text style={styles.coinsRewardTitle}>+{coinsEarned.toLocaleString()} Coins Earned!</Text>
              <Text style={styles.coinsRewardSubtitle}>Saved to your mock exam wallet</Text>
            </View>
          </View>
        )}

        {/* Score Display */}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Final Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        {/* Breakdown Grid */}
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownVal, { color: '#10b981' }]}>
              {correctCount}
            </Text>
            <Text style={styles.breakdownLabel}>Correct</Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownVal, { color: '#ef4444' }]}>
              {wrongCount}
            </Text>
            <Text style={styles.breakdownLabel}>Mistakes</Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownVal, { color: '#2563eb' }]}>
              {accuracy}%
            </Text>
            <Text style={styles.breakdownLabel}>Accuracy</Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownVal, { color: '#ea580c' }]}>
              🔥 {maxStreak}
            </Text>
            <Text style={styles.breakdownLabel}>Best Streak</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
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

        {/* Store Quick Link */}
        <TouchableOpacity
          style={styles.storeButton}
          onPress={handleGoToStore}
          activeOpacity={0.8}
        >
          <Text style={styles.storeButtonText}>🛍️ Spend Coins in Rewards Store</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          {mode === 'level' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleGoToLevels}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>🗺️ All Levels</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoHome}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>🏠 Game Hub</Text>
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
    padding: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#14217f',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 6px 20px rgba(20, 33, 127, 0.1)',
      },
    }),
  },
  trophyIcon: {
    fontSize: 54,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#14217f',
    textAlign: 'center',
    marginBottom: 6,
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  starsWrapper: {
    marginBottom: 16,
  },
  bossBanner: {
    backgroundColor: '#fdf2f8',
    borderColor: '#ec4899',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    width: '100%',
  },
  bossBannerText: {
    color: '#be185d',
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'center',
  },
  unlockedBanner: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  unlockedText: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 14,
  },
  coinsRewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
  },
  coinsRewardEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  coinsRewardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#b45309',
  },
  coinsRewardSubtitle: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  scoreBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#14217f',
    marginTop: 2,
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 20,
    width: '100%',
  },
  nextLevelButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
      },
    }),
  },
  nextLevelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  retryButton: {
    backgroundColor: '#14217f',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  storeButton: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  storeButtonText: {
    color: '#c2410c',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
});