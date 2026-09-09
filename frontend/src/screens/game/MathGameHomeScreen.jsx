import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useArjunAuth } from '../../context/AuthContext';
import {
  loadLevelsProgress,
  loadUserStats,
  loadGameSettings,
  saveGameSettings,
  resetGameProgress,
  loadGameEconomy,
} from '../../game/services/gameStorage';
import DailySpinModal from '../../game/components/DailySpinModal';
import DailyStreakModal from '../../game/components/DailyStreakModal';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import { COLORS } from '../../styles/theme';

export default function MathGameHomeScreen({ navigation }) {
  const { user } = useArjunAuth();

  const [stats, setStats] = useState({
    totalScore: 0,
    totalStars: 0,
    bestStreak: 0,
    speedChallengeHighScore: 0,
    levelsCompleted: 0,
  });
  const [settings, setSettings] = useState({ soundEnabled: true, vibrationEnabled: true });
  const [economy, setEconomy] = useState({
    coins: 0,
    dailyStreak: 0,
    canClaimStreak: false,
    canSpin: true,
    msUntilNextSpin: 0,
  });

  // Modal states
  const [spinModalVisible, setSpinModalVisible] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);

  const refreshData = useCallback(async () => {
    const s = await loadUserStats();
    const l = await loadLevelsProgress();
    const set = await loadGameSettings();
    const eco = await loadGameEconomy();
    setStats(s);
    setSettings(set);
    setEconomy(eco);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const toggleVibration = async () => {
    const updated = await saveGameSettings({ vibrationEnabled: !settings.vibrationEnabled });
    setSettings(updated);
  };

  const handleReset = () => {
    const doReset = async () => {
      await resetGameProgress();
      refreshData();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Reset all game progress back to Level 1?')) {
        doReset();
      }
    } else {
      Alert.alert(
        'Reset Progress',
        'Are you sure you want to reset all game levels and high scores back to Level 1?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: doReset },
        ]
      );
    }
  };

  // Calculate gamer rank title based on levels completed
  const completed = stats.levelsCompleted || 0;
  let gamerRank = '🌱 Novice Prodigy';
  let rankColor = '#10b981';
  if (completed >= 45) {
    gamerRank = '👑 Ramanujan Legend';
    rankColor = '#ec4899';
  } else if (completed >= 30) {
    gamerRank = '⚡ Mental Grandmaster';
    rankColor = '#8b5cf6';
  } else if (completed >= 15) {
    gamerRank = '🔥 Vedic Tactician';
    rankColor = '#f59e0b';
  } else if (completed >= 5) {
    gamerRank = '⚔️ Speed Apprentice';
    rankColor = '#3b82f6';
  }

  const progressPercent = Math.min(100, Math.round((completed / 50) * 100));

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <View style={styles.screenWrapper}>
        <Navbar
          title="Speed Math Arena"
          showBack={true}
          onBack={() => navigation.navigate('home')}
        />

        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* HERO GAMING HEADER */}
          <View style={styles.heroCard}>
        {/* Top bar inside hero: Greeting, Rank, Sound */}
        <View style={styles.heroTopRow}>
          <View style={styles.heroPlayerInfo}>
            <View style={styles.avatarCrest}>
              <Text style={styles.avatarCrestText}>⚡</Text>
            </View>
            <View>
              <Text style={styles.playerName} numberOfLines={1}>
                {user?.name ? user.name : 'Math Champion'}
              </Text>
              <View style={[styles.rankBadge, { backgroundColor: `${rankColor}25`, borderColor: rankColor }]}>
                <Text style={[styles.rankBadgeText, { color: rankColor }]}>{gamerRank}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.soundButton} onPress={toggleVibration} activeOpacity={0.8}>
            <Text style={styles.soundButtonText}>
              {settings.vibrationEnabled ? '📳 HAPTIC' : '📴 MUTE'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Campaign Journey Progress Bar */}
        <View style={styles.journeyBox}>
          <View style={styles.journeyHeader}>
            <Text style={styles.journeyTitle}>Campaign Progress</Text>
            <Text style={styles.journeyProgressText}>
              Level {Math.min(50, completed + 1)} / 50 • {progressPercent}%
            </Text>
          </View>
          <View style={styles.journeyTrack}>
            <View style={[styles.journeyFill, { width: `${Math.max(4, progressPercent)}%` }]} />
          </View>
        </View>

        {/* Quick Stats Strip */}
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>⭐ {stats.totalStars} <Text style={styles.statMax}>/ 150</Text></Text>
            <Text style={styles.heroStatLabel}>Stars Earned</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={[styles.heroStatValue, { color: '#fb923c' }]}>🔥 {stats.bestStreak}x</Text>
            <Text style={styles.heroStatLabel}>Best Combo</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={[styles.heroStatValue, { color: '#38bdf8' }]}>🏆 {stats.speedChallengeHighScore}</Text>
            <Text style={styles.heroStatLabel}>Speed High</Text>
          </View>
        </View>
      </View>

      {/* GAMIFICATION FLOATING VAULT BAR */}
      <View style={styles.vaultRow}>
        {/* 1. Coin Wallet Pill */}
        <TouchableOpacity
          style={styles.vaultPillGold}
          onPress={() => navigation.navigate('math-game-store')}
          activeOpacity={0.85}
        >
          <View style={styles.vaultPillIconBox}>
            <Text style={styles.vaultPillIcon}>🪙</Text>
          </View>
          <View style={styles.vaultPillInfo}>
            <Text style={styles.vaultPillVal}>{(economy.coins || 0).toLocaleString()}</Text>
            <Text style={styles.vaultPillSub}>COIN STORE ➔</Text>
          </View>
        </TouchableOpacity>

        {/* 2. Daily Streak Pill */}
        <TouchableOpacity
          style={[styles.vaultPillFlame, economy.canClaimStreak && styles.vaultPillPulseFlame]}
          onPress={() => setStreakModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.vaultPillIconBox, { backgroundColor: '#ffedd5' }]}>
            <Text style={styles.vaultPillIcon}>🔥</Text>
          </View>
          <View style={styles.vaultPillInfo}>
            <Text style={[styles.vaultPillVal, { color: '#c2410c' }]}>
              Day {economy.dailyStreak || 0}
            </Text>
            <Text style={[styles.vaultPillSub, economy.canClaimStreak && { color: '#ea580c', fontWeight: '900' }]}>
              {economy.canClaimStreak ? 'CLAIM FREE! 🎁' : 'STREAK'}
            </Text>
          </View>
          {economy.canClaimStreak && <View style={styles.notificationDot} />}
        </TouchableOpacity>

        {/* 3. Lucky Spin Pill */}
        <TouchableOpacity
          style={[styles.vaultPillSpin, economy.canSpin && styles.vaultPillPulseSpin]}
          onPress={() => setSpinModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.vaultPillIconBox, { backgroundColor: '#f3e8ff' }]}>
            <Text style={styles.vaultPillIcon}>🎡</Text>
          </View>
          <View style={styles.vaultPillInfo}>
            <Text style={[styles.vaultPillVal, { color: '#7e22ce' }]}>Lucky Spin</Text>
            <Text style={[styles.vaultPillSub, economy.canSpin && { color: '#9333ea', fontWeight: '900' }]}>
              {economy.canSpin ? 'FREE SPIN! 🎲' : 'COOLDOWN'}
            </Text>
          </View>
          {economy.canSpin && <View style={[styles.notificationDot, { backgroundColor: '#a855f7' }]} />}
        </TouchableOpacity>
      </View>

      {/* DAILY EVENT CALLOUT BANNER */}
      {(economy.canSpin || economy.canClaimStreak) && (
        <View style={styles.eventBanner}>
          <View style={styles.eventLeft}>
            <Text style={styles.eventEmoji}>🎉</Text>
            <View style={styles.eventTextWrapper}>
              <Text style={styles.eventTitle}>Daily Rewards Waiting!</Text>
              <Text style={styles.eventSubtitle}>
                {economy.canSpin && economy.canClaimStreak
                  ? 'Free spin & streak bonus coins are ready to claim!'
                  : economy.canSpin
                  ? 'Spin the prize wheel now for up to 1,500 coins!'
                  : 'Claim your consecutive daily streak bonus!'}
              </Text>
            </View>
          </View>
          <View style={styles.eventBtnRow}>
            {economy.canSpin && (
              <TouchableOpacity
                style={styles.eventActionBtnSpin}
                onPress={() => setSpinModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.eventActionBtnText}>🎡 Spin</Text>
              </TouchableOpacity>
            )}
            {economy.canClaimStreak && (
              <TouchableOpacity
                style={styles.eventActionBtnStreak}
                onPress={() => setStreakModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.eventActionBtnText}>🔥 Claim</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* GAME REWARDS & COIN STORE BANNER */}
      <TouchableOpacity
        style={styles.storeCardBanner}
        onPress={() => navigation.navigate('math-game-store')}
        activeOpacity={0.88}
      >
        <View style={styles.storeLeftCol}>
          <View style={styles.storeIconCrest}>
            <Text style={styles.storeIconEmoji}>🛍️</Text>
          </View>
          <View style={styles.storeTextCol}>
            <View style={styles.storeBadgeRow}>
              <Text style={styles.storeHeading}>Rewards & Badges Store</Text>
              <View style={styles.storeBadgeHot}>
                <Text style={styles.storeBadgeHotText}>STORE</Text>
              </View>
            </View>
            <Text style={styles.storeDescription}>
              Exchange your game coins for exclusive avatar borders, gamer titles, and gameplay boosters!
            </Text>
          </View>
        </View>
        <View style={styles.storeOpenButton}>
          <Text style={styles.storeOpenButtonText}>ENTER STORE ➔</Text>
        </View>
      </TouchableOpacity>

      {/* SECTION TITLE */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>ARCADE ARENA MODES</Text>
        <Text style={styles.sectionSubHeading}>CHOOSE YOUR CHALLENGE</Text>
      </View>

      {/* 1. CAMPAIGN LEVELS (50 LEVELS + 5 BOSSES) */}
      <TouchableOpacity
        style={[styles.arcadeCard, styles.cardCampaign]}
        onPress={() => navigation.navigate('math-game-levels')}
        activeOpacity={0.85}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.cardIconBox, { backgroundColor: '#dbeafe', borderColor: '#93c5fd' }]}>
            <Text style={styles.cardIcon}>🏆</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <View style={styles.cardTitleBadgeRow}>
              <Text style={styles.cardTitle}>Levels Campaign</Text>
              <View style={styles.bossFeatureBadge}>
                <Text style={styles.bossFeatureText}>5 BOSS BATTLES 👑</Text>
              </View>
            </View>
            <Text style={styles.cardTagline}>50 progressive stages from Novice to Grandmaster</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardDetailText}>
            Conquer boss fights at Levels 10, 20, 30, 40 & 50 to reap massive coin bounties and unlock 3-star accolades!
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.levelProgressPill}>
            <Text style={styles.levelProgressPillText}>
              Stage {Math.min(50, completed + 1)} of 50 Unlocked
            </Text>
          </View>
          <View style={[styles.arcadeBtn, { backgroundColor: '#1d4ed8', borderBottomColor: '#1e3a8a' }]}>
            <Text style={styles.arcadeBtnText}>PLAY CAMPAIGN ➔</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 2. SPEED CHALLENGE (60s BLITZ) */}
      <TouchableOpacity
        style={[styles.arcadeCard, styles.cardSpeed]}
        onPress={() =>
          navigation.navigate('math-game-play', {
            mode: 'speed',
            timeLimit: 60,
          })
        }
        activeOpacity={0.85}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.cardIconBox, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
            <Text style={styles.cardIcon}>⚡</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <View style={styles.cardTitleBadgeRow}>
              <Text style={styles.cardTitle}>Speed Challenge</Text>
              <View style={[styles.bossFeatureBadge, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                <Text style={[styles.bossFeatureText, { color: '#b45309' }]}>60s BLITZ</Text>
              </View>
            </View>
            <Text style={styles.cardTagline}>Time attack sprint! Solve rapid-fire math under pressure</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardDetailText}>
            Test your lightning instincts! Every correct answer stacks your combo streak multiplier and earns extra coins.
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.levelProgressPill, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
            <Text style={[styles.levelProgressPillText, { color: '#b45309' }]}>
              Best: {stats.speedChallengeHighScore} pts
            </Text>
          </View>
          <View style={[styles.arcadeBtn, { backgroundColor: '#ea580c', borderBottomColor: '#9a3412' }]}>
            <Text style={styles.arcadeBtnText}>START BLITZ ➔</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 3. 2-PLAYER SPLIT SCREEN DUEL */}
      <TouchableOpacity
        style={[styles.arcadeCard, styles.cardMultiplayer]}
        onPress={() => navigation.navigate('math-game-multiplayer')}
        activeOpacity={0.85}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.cardIconBox, { backgroundColor: '#fce7f3', borderColor: '#fbcfe8' }]}>
            <Text style={styles.cardIcon}>⚔️</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <View style={styles.cardTitleBadgeRow}>
              <Text style={styles.cardTitle}>2-Player Split Screen</Text>
              <View style={[styles.bossFeatureBadge, { backgroundColor: '#fdf2f8', borderColor: '#ec4899' }]}>
                <Text style={[styles.bossFeatureText, { color: '#be185d' }]}>LOCAL 1v1</Text>
              </View>
            </View>
            <Text style={styles.cardTagline}>Dual sprint battle on one phone! First to reach finish line wins 🏁</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardDetailText}>
            Place your smartphone on a table and duel a classmate or friend face-to-face with fresh, non-repeating math problems!
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.levelProgressPill, { backgroundColor: '#fdf2f8', borderColor: '#fbcfe8' }]}>
            <Text style={[styles.levelProgressPillText, { color: '#9d174d' }]}>
              Instant Head-to-Head
            </Text>
          </View>
          <View style={[styles.arcadeBtn, { backgroundColor: '#db2777', borderBottomColor: '#831843' }]}>
            <Text style={styles.arcadeBtnText}>CHALLENGE ➔</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 4. LEARN TRICKS ENCYCLOPEDIA */}
      <TouchableOpacity
        style={[styles.arcadeCard, styles.cardTricks]}
        onPress={() => navigation.navigate('math-game-tricks')}
        activeOpacity={0.85}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.cardIconBox, { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }]}>
            <Text style={styles.cardIcon}>💡</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <View style={styles.cardTitleBadgeRow}>
              <Text style={styles.cardTitle}>Learn Tricks & Rules</Text>
              <View style={[styles.bossFeatureBadge, { backgroundColor: '#f0fdfa', borderColor: '#0d9488' }]}>
                <Text style={[styles.bossFeatureText, { color: '#0f766e' }]}>21+ FORMULAS</Text>
              </View>
            </View>
            <Text style={styles.cardTagline}>Vedic Math shortcuts with instant practice drills</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardDetailText}>
            Complements, ×11, ×101, Ending-5 Squares, Near-100 Squaring, and Reversible % rules explained simply with examples.
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.levelProgressPill, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
            <Text style={[styles.levelProgressPillText, { color: '#0369a1' }]}>
              Master Mental Math
            </Text>
          </View>
          <View style={[styles.arcadeBtn, { backgroundColor: '#0284c7', borderBottomColor: '#0369a1' }]}>
            <Text style={styles.arcadeBtnText}>LEARN TRICKS ➔</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 5. STATS & HALL OF FAME */}
      <TouchableOpacity
        style={[styles.arcadeCard, styles.cardLeaderboard]}
        onPress={() => navigation.navigate('math-game-leaderboard')}
        activeOpacity={0.85}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.cardIconBox, { backgroundColor: '#f3e8ff', borderColor: '#e9d5ff' }]}>
            <Text style={styles.cardIcon}>📊</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardTitle}>Stats & Hall of Fame</Text>
            <Text style={styles.cardTagline}>Your lifetime accuracy, solved milestones & badges</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.levelProgressPill, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
            <Text style={[styles.levelProgressPillText, { color: '#7e22ce' }]}>
              {stats.totalSolved || 0} Questions Solved
            </Text>
          </View>
          <View style={[styles.arcadeBtn, { backgroundColor: '#7c3aed', borderBottomColor: '#4c1d95' }]}>
            <Text style={styles.arcadeBtnText}>VIEW STATS ➔</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Bottom Spacer for Tab Bar */}
      <View style={{ height: 90 }} />

      {/* DAILY SPIN MODAL */}
      <DailySpinModal
        visible={spinModalVisible}
        onClose={() => setSpinModalVisible(false)}
        canSpin={economy.canSpin}
        msUntilNextSpin={economy.msUntilNextSpin}
        onSpinComplete={() => refreshData()}
      />

      {/* DAILY STREAK MODAL */}
      <DailyStreakModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
        dailyStreak={economy.dailyStreak}
        canClaimStreak={economy.canClaimStreak}
        onStreakClaimed={() => refreshData()}
      />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    maxWidth: 620,
    alignSelf: 'center',
    width: '100%',
  },

  // HERO CARD - SLA Navy Signature
  heroCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 5px 16px rgba(30, 58, 138, 0.2)',
      },
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCrest: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#172554',
    borderWidth: 2,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarCrestText: {
    fontSize: 22,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  rankBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 3,
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  soundButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  soundButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },

  // JOURNEY PROGRESS
  journeyBox: {
    backgroundColor: '#172554',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 14,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journeyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  journeyProgressText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38bdf8',
  },
  journeyTrack: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  journeyFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4,
  },

  // HERO STATS ROW
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fbbf24',
  },
  statMax: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // VAULT BAR
  vaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  vaultPillGold: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderBottomWidth: 4,
    borderBottomColor: '#b45309',
  },
  vaultPillFlame: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#fdba74',
    borderBottomWidth: 4,
    borderBottomColor: '#c2410c',
    position: 'relative',
  },
  vaultPillPulseFlame: {
    backgroundColor: '#fff7ed',
    borderColor: '#ea580c',
  },
  vaultPillSpin: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#d8b4fe',
    borderBottomWidth: 4,
    borderBottomColor: '#7e22ce',
    position: 'relative',
  },
  vaultPillPulseSpin: {
    backgroundColor: '#faf5ff',
    borderColor: '#a855f7',
  },
  vaultPillIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  vaultPillIcon: {
    fontSize: 16,
  },
  vaultPillInfo: {
    flex: 1,
  },
  vaultPillVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#92400e',
  },
  vaultPillSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
    marginTop: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },

  // DAILY EVENT BANNER
  eventBanner: {
    backgroundColor: '#fdf4ff',
    borderColor: '#e879f9',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(168, 85, 247, 0.12)',
      },
    }),
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  eventEmoji: {
    fontSize: 26,
    marginRight: 10,
  },
  eventTextWrapper: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#86198f',
  },
  eventSubtitle: {
    fontSize: 10,
    color: '#a21caf',
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 14,
  },
  eventBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  eventActionBtnSpin: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  eventActionBtnStreak: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  eventActionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },

  // STORE CARD BANNER
  storeCardBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderBottomWidth: 3.5,
    borderBottomColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 3px 10px rgba(37, 99, 235, 0.12)',
      },
    }),
  },
  storeLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  storeIconCrest: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
  },
  storeIconEmoji: {
    fontSize: 22,
  },
  storeTextCol: {
    flex: 1,
  },
  storeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  storeHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e3a8a',
  },
  storeBadgeHot: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  storeBadgeHotText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
  storeDescription: {
    fontSize: 11,
    color: '#3b82f6',
    lineHeight: 14,
  },
  storeOpenButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  storeOpenButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },

  // SECTION HEADER
  sectionHeaderRow: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  sectionSubHeading: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // ARCADE CARDS
  arcadeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderBottomWidth: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    }),
  },
  cardCampaign: {
    borderColor: '#93c5fd',
    borderBottomColor: '#1d4ed8',
    backgroundColor: '#f8fbff',
  },
  cardSpeed: {
    borderColor: '#fcd34d',
    borderBottomColor: '#ea580c',
    backgroundColor: '#fffdf7',
  },
  cardMultiplayer: {
    borderColor: '#fbcfe8',
    borderBottomColor: '#db2777',
    backgroundColor: '#fff9fb',
  },
  cardTricks: {
    borderColor: '#7dd3fc',
    borderBottomColor: '#0284c7',
    backgroundColor: '#f6fcff',
  },
  cardLeaderboard: {
    borderColor: '#d8b4fe',
    borderBottomColor: '#7c3aed',
    backgroundColor: '#fbf8ff',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  bossFeatureBadge: {
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#f43f5e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bossFeatureText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#e11d48',
  },
  cardTagline: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 12,
  },
  cardDetailText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
  },
  levelProgressPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  levelProgressPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e40af',
  },
  arcadeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderBottomWidth: 3,
  },
  arcadeBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // RESET PROGRESS
  resetButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
});
