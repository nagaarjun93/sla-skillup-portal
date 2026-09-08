import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LEVELS_DATA } from '../../game/data/levelsData';
import { loadLevelsProgress } from '../../game/services/gameStorage';
import StarRating from '../../game/components/StarRating';

export default function MathGameLevelsScreen({ navigation }) {
  const [levelsState, setLevelsState] = useState({});

  const refreshLevels = useCallback(async () => {
    const progress = await loadLevelsProgress();
    setLevelsState(progress);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshLevels();
    }, [refreshLevels])
  );

  const handleLevelPress = (lvl) => {
    const isUnlocked = levelsState[lvl.level]?.unlocked ?? (lvl.level === 1);
    if (!isUnlocked) return;

    navigation.navigate('math-game-play', {
      mode: 'level',
      levelNumber: lvl.level,
    });
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Novice':
        return '#10b981';
      case 'Apprentice':
        return '#0284c7';
      case 'Intermediate':
        return '#f59e0b';
      case 'Advanced':
        return '#ea580c';
      case 'Master':
      case 'Grandmaster':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Campaign Levels (50)</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.subtitle}>
        Conquer all 50 levels and defeat the 5 Epic Bosses to claim the Grandmaster title!
      </Text>

      {/* Levels List */}
      <View style={styles.levelsGrid}>
        {LEVELS_DATA.map((lvl) => {
          const progress = levelsState[lvl.level] || {
            unlocked: lvl.level === 1,
            stars: 0,
            highScore: 0,
          };
          const isUnlocked = progress.unlocked;
          const stars = progress.stars || 0;
          const diffColor = getDifficultyColor(lvl.difficulty);
          const isBoss = lvl.isBoss;

          return (
            <TouchableOpacity
              key={`level_${lvl.level}`}
              style={[
                styles.levelCard,
                !isUnlocked && styles.levelCardLocked,
                isUnlocked && styles.levelCardUnlocked,
                isBoss && isUnlocked && styles.bossCardUnlocked,
              ]}
              onPress={() => handleLevelPress(lvl)}
              activeOpacity={isUnlocked ? 0.75 : 1}
              disabled={!isUnlocked}
            >
              {/* Left Column: Number or Boss Icon or Lock */}
              <View
                style={[
                  styles.levelNumberBox,
                  isUnlocked
                    ? isBoss
                      ? styles.numberBoxBoss
                      : styles.numberBoxUnlocked
                    : styles.numberBoxLocked,
                ]}
              >
                {isUnlocked ? (
                  isBoss ? (
                    <Text style={styles.bossIconText}>{lvl.bossAvatar || '👑'}</Text>
                  ) : (
                    <Text style={styles.levelNumberText}>{lvl.level}</Text>
                  )
                ) : (
                  <Text style={styles.lockIcon}>🔒</Text>
                )}
              </View>

              {/* Middle Column: Title & Details */}
              <View style={styles.levelDetails}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.levelTitle,
                      isBoss && styles.bossTitleText,
                      !isUnlocked && styles.lockedText,
                    ]}
                    numberOfLines={1}
                  >
                    {isBoss ? `🔥 Boss: ${lvl.title}` : lvl.title}
                  </Text>
                  {isBoss ? (
                    <View style={styles.bossTag}>
                      <Text style={styles.bossTagText}>👑 BOSS</Text>
                    </View>
                  ) : (
                    <View style={[styles.diffBadge, { backgroundColor: `${diffColor}18` }]}>
                      <Text style={[styles.diffBadgeText, { color: diffColor }]}>
                        {lvl.difficulty}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[styles.levelSubtitle, !isUnlocked && styles.lockedSubText]}
                  numberOfLines={1}
                >
                  {isBoss ? `Bounty: 🪙 +${lvl.bossCoinBounty} Coins • ${lvl.bossTitle}` : lvl.subtitle}
                </Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>
                    🎯 {lvl.questionCount} Qs • ⏱ {lvl.timePerQuestion}s/Q
                  </Text>
                  {isUnlocked && progress.highScore > 0 && (
                    <Text style={styles.highScoreText}>Best: {progress.highScore} pts</Text>
                  )}
                </View>
              </View>

              {/* Right Column: Stars Earned */}
              <View style={styles.starsBox}>
                {isUnlocked ? (
                  <StarRating stars={stars} size={18} />
                ) : (
                  <Text style={styles.lockedLabel}>Locked</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 80 }} />
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
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14217f',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14217f',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 16,
  },
  levelsGrid: {
    width: '100%',
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      },
    }),
  },
  levelCardUnlocked: {
    borderColor: '#bfdbfe',
  },
  levelCardLocked: {
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    opacity: 0.7,
  },
  bossCardUnlocked: {
    borderColor: '#ec4899',
    backgroundColor: '#fff1f2',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(236, 72, 153, 0.15)',
      },
    }),
  },
  levelNumberBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberBoxUnlocked: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#93c5fd',
  },
  numberBoxBoss: {
    backgroundColor: '#ffe4e6',
    borderWidth: 2,
    borderColor: '#f43f5e',
  },
  numberBoxLocked: {
    backgroundColor: '#f1f5f9',
  },
  levelNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1d4ed8',
  },
  bossIconText: {
    fontSize: 22,
  },
  lockIcon: {
    fontSize: 16,
  },
  levelDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    marginRight: 6,
  },
  bossTitleText: {
    color: '#9f1239',
    fontWeight: '900',
  },
  lockedText: {
    color: '#94a3b8',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bossTag: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f43f5e',
  },
  bossTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#e11d48',
  },
  levelSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  lockedSubText: {
    color: '#cbd5e1',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  highScoreText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
  },
  starsBox: {
    marginLeft: 8,
    alignItems: 'center',
  },
  lockedLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
