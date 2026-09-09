/**
 * Game Local Storage Service
 * Persists levels progress, stars, high scores, streaks, settings,
 * virtual coin economy, daily streak bonuses, lucky spin, and store inventory.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const STORAGE_KEYS = {
  LEVELS_PROGRESS: '@math_game_levels_progress_v1',
  USER_STATS: '@math_game_user_stats_v1',
  SETTINGS: '@math_game_settings_v1',
  ECONOMY: '@math_game_economy_v1',
};

// 50 Levels default progress
const createDefaultLevelsProgress = () => {
  const initial = {};
  for (let i = 1; i <= 50; i++) {
    initial[i] = {
      level: i,
      unlocked: i === 1,
      stars: 0,
      highScore: 0,
      playedCount: 0,
    };
  }
  return initial;
};

// Default user stats
const DEFAULT_USER_STATS = {
  totalScore: 0,
  totalStars: 0,
  totalSolved: 0,
  totalCorrect: 0,
  bestStreak: 0,
  speedChallengeHighScore: 0,
  levelsCompleted: 0,
};

// Default settings
const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
};

// 7-Day streak rewards ladder
export const STREAK_REWARDS = [
  { day: 1, coins: 50, label: 'Day 1 Starter' },
  { day: 2, coins: 75, label: 'Day 2 Spark' },
  { day: 3, coins: 100, label: 'Day 3 Flame' },
  { day: 4, coins: 150, label: 'Day 4 Blaze' },
  { day: 5, coins: 200, label: 'Day 5 Inferno' },
  { day: 6, coins: 300, label: 'Day 6 Ultra' },
  { day: 7, coins: 500, label: 'Day 7 Champion' },
];

// Default gamification economy
const DEFAULT_ECONOMY = {
  coins: 200, // 200 welcome bonus coins!
  dailyStreak: 0,
  lastStreakDate: null,
  lastSpinTimestamp: 0,
  inventory: [], // IDs of purchased items: mock passes, borders, etc.
  equippedFrame: 'default',
  boosterHints: 3,
  boosterTimeFreezes: 1,
};

/**
 * Load complete level progress map (all 50 levels)
 */
export async function loadLevelsProgress() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LEVELS_PROGRESS);
    const def = createDefaultLevelsProgress();
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.LEVELS_PROGRESS, JSON.stringify(def));
      return def;
    }
    const parsed = JSON.parse(raw);
    const merged = { ...def, ...parsed };
    // Defensively sanitize any corrupted strings or objects
    for (const key of Object.keys(merged)) {
      if (merged[key]) {
        merged[key].highScore = Math.max(0, Math.round(Number(merged[key].highScore) || 0));
        merged[key].stars = Math.max(0, Math.min(3, Math.round(Number(merged[key].stars) || 0)));
        merged[key].playedCount = Math.max(0, Math.round(Number(merged[key].playedCount) || 0));
      }
    }
    return merged;
  } catch (error) {
    console.error('Error loading levels progress:', error);
    return createDefaultLevelsProgress();
  }
}

/**
 * Load user lifetime game stats
 */
export async function loadUserStats() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_STATS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(DEFAULT_USER_STATS));
      return DEFAULT_USER_STATS;
    }
    const parsed = JSON.parse(raw) || {};
    return {
      ...DEFAULT_USER_STATS,
      ...parsed,
      totalScore: Math.max(0, Math.round(Number(parsed.totalScore) || 0)),
      totalStars: Math.max(0, Math.round(Number(parsed.totalStars) || 0)),
      totalSolved: Math.max(0, Math.round(Number(parsed.totalSolved) || 0)),
      totalCorrect: Math.max(0, Math.round(Number(parsed.totalCorrect) || 0)),
      bestStreak: Math.max(0, Math.round(Number(parsed.bestStreak) || 0)),
      speedChallengeHighScore: Math.max(0, Math.round(Number(parsed.speedChallengeHighScore) || 0)),
      levelsCompleted: Math.max(0, Math.round(Number(parsed.levelsCompleted) || 0)),
    };
  } catch (error) {
    console.error('Error loading user stats:', error);
    return DEFAULT_USER_STATS;
  }
}

/**
 * Load economy & gamification state
 */
export async function loadGameEconomy() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ECONOMY);
    let economy = DEFAULT_ECONOMY;
    if (raw) {
      economy = { ...DEFAULT_ECONOMY, ...JSON.parse(raw) };
    }

    // Try fetching live cloud state from MongoDB!
    try {
      const { data } = await api.get('/student/game/status');
      if (data) {
        economy.coins = data.coins !== undefined ? data.coins : economy.coins;
        economy.dailyStreak = data.dailyStreak !== undefined ? data.dailyStreak : economy.dailyStreak;
        economy.lastStreakDate = data.lastStreakDate;
        if (Array.isArray(data.inventory)) {
          economy.inventory = data.inventory;
        }
        if (data.equippedFrame) {
          economy.equippedFrame = data.equippedFrame;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.ECONOMY, JSON.stringify(economy));

        return {
          ...economy,
          dailyStreak: data.dailyStreak,
          canClaimStreak: data.canClaimStreak,
          canSpin: data.canSpin,
          msUntilNextSpin: data.msUntilNextSpin,
        };
      }
    } catch (apiErr) {
      // Offline fallback: calculate locally
    }

    // Fallback local calculations
    const todayStr = new Date().toISOString().split('T')[0];
    let canClaimStreak = false;
    let currentStreak = economy.dailyStreak || 0;

    if (!economy.lastStreakDate) {
      canClaimStreak = true;
    } else if (economy.lastStreakDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (economy.lastStreakDate === yesterdayStr) {
        canClaimStreak = true;
      } else {
        canClaimStreak = true;
        currentStreak = 0;
      }
    }

    const now = Date.now();
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const timeSinceSpin = now - (economy.lastSpinTimestamp || 0);
    const canSpin = timeSinceSpin >= COOLDOWN_MS;
    const msUntilNextSpin = Math.max(0, COOLDOWN_MS - timeSinceSpin);

    return {
      ...economy,
      dailyStreak: currentStreak,
      canClaimStreak,
      canSpin,
      msUntilNextSpin,
    };
  } catch (error) {
    console.error('Error loading game economy:', error);
    return {
      ...DEFAULT_ECONOMY,
      canClaimStreak: true,
      canSpin: true,
      msUntilNextSpin: 0,
    };
  }
}

/**
 * Add virtual coins (Synced to MongoDB Atlas)
 */
export async function addCoins(amount) {
  try {
    const economy = await loadGameEconomy();
    let newCoins = Math.max(0, (economy.coins || 0) + amount);

    // Sync to MongoDB Cloud!
    try {
      const { data } = await api.post('/student/game/award-coins', {
        amount,
        reason: 'level_completion'
      });
      if (data && data.success && data.totalCoins !== undefined) {
        newCoins = data.totalCoins;
      }
    } catch (apiErr) {
      // Offline fallback: use local calculation
    }

    const updated = { ...economy, coins: newCoins };
    await AsyncStorage.setItem(STORAGE_KEYS.ECONOMY, JSON.stringify(updated));
    return newCoins;
  } catch (error) {
    console.error('Error adding coins:', error);
    return 0;
  }
}


/**
 * Spend virtual coins
 */
export async function spendCoins(amount) {
  try {
    const economy = await loadGameEconomy();
    if ((economy.coins || 0) < amount) {
      return { success: false, reason: 'insufficient_coins', currentCoins: economy.coins };
    }
    const newCoins = (economy.coins || 0) - amount;
    const updated = { ...economy, coins: newCoins };
    await AsyncStorage.setItem(STORAGE_KEYS.ECONOMY, JSON.stringify(updated));
    return { success: true, currentCoins: newCoins };
  } catch (error) {
    console.error('Error spending coins:', error);
    return { success: false, reason: error.message };
  }
}

/**
 * Claim Daily Streak Bonus
 */
export async function claimDailyStreakBonus() {
  try {
    const economy = await loadGameEconomy();
    const todayStr = new Date().toISOString().split('T')[0];

    if (economy.lastStreakDate === todayStr) {
      return { success: false, message: 'Already claimed today!' };
    }

    let nextStreak = (economy.dailyStreak || 0) + 1;
    if (nextStreak > 7) {
      nextStreak = 1; // Cycle repeats after day 7
    }

    const reward = STREAK_REWARDS[nextStreak - 1] || { coins: 50 };
    let coinsWon = reward.coins;
    let newCoins = (economy.coins || 0) + coinsWon;

    // Sync to backend MongoDB Atlas!
    try {
      const { data } = await api.post('/student/game/claim-streak');
      if (data && data.success) {
        coinsWon = data.coinsWon;
        nextStreak = data.streakDay;
        newCoins = data.totalCoins;
      }
    } catch (apiErr) {
      if (apiErr.response?.data?.message) {
        return { success: false, message: apiErr.response.data.message };
      }
    }

    const updated = {
      ...economy,
      coins: newCoins,
      dailyStreak: nextStreak,
      lastStreakDate: todayStr,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.ECONOMY, JSON.stringify(updated));

    return {
      success: true,
      coinsWon,
      streakDay: nextStreak,
      totalCoins: newCoins,
    };
  } catch (error) {
    console.error('Error claiming streak:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Record Lucky Spin Result
 */
export async function recordDailySpin(prizeCoins) {
  try {
    const economy = await loadGameEconomy();
    let newCoins = (economy.coins || 0) + prizeCoins;

    // Sync spin to backend MongoDB Atlas!
    try {
      const { data } = await api.post('/student/game/spin', { prizeCoins });
      if (data && data.totalCoins !== undefined) {
        newCoins = data.totalCoins;
      }
    } catch (apiErr) {
      // Offline fallback: keep local computation
    }

    const updated = {
      ...economy,
      coins: newCoins,
      lastSpinTimestamp: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.ECONOMY, JSON.stringify(updated));
    return { success: true, coinsWon: prizeCoins, totalCoins: newCoins };
  } catch (error) {
    console.error('Error recording spin:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Fetch dynamic store items catalog from backend
 */
export async function fetchStoreCatalog() {
  try {
    const { data } = await api.get('/student/game/store-items');
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Could not fetch store catalog from backend:', err);
  }
  return null;
}

/**
 * Purchase item from Rewards Store (Synced to MongoDB Atlas)
 */
export async function purchaseStoreItem(item) {
  try {
    const economy = await loadGameEconomy();
    const { id, cost, type } = item;

    if ((economy.coins || 0) < cost) {
      return { success: false, reason: 'insufficient_coins' };
    }

    const currentInventory = Array.isArray(economy.inventory) ? economy.inventory : [];
    // If it's a unique pass or badge and already owned:
    if (type !== 'booster' && currentInventory.includes(id)) {
      return { success: false, reason: 'already_owned' };
    }

    let newCoins = economy.coins - cost;
    let newInventory = type !== 'booster' ? [...currentInventory, id] : currentInventory;

    // Sync to MongoDB Cloud!
    try {
      const { data } = await api.post('/student/game/purchase', {
        itemId: id,
        cost,
        type,
      });
      if (data && data.success) {
        newCoins = data.coins !== undefined ? data.coins : newCoins;
        newInventory = Array.isArray(data.inventory) ? data.inventory : newInventory;
      }
    } catch (apiErr) {
      console.warn('Backend store purchase sync error:', apiErr);
      if (apiErr.response?.data?.message === 'Insufficient coins') {
        return { success: false, reason: 'insufficient_coins' };
      }
    }

    let boosterHints = economy.boosterHints || 0;
    let boosterTimeFreezes = economy.boosterTimeFreezes || 0;

    if (id === 'booster_hints_5') {
      boosterHints += 5;
    } else if (id === 'booster_freeze_3') {
      boosterTimeFreezes += 3;
    }

    const updated = {
      ...economy,
      coins: newCoins,
      inventory: newInventory,
      boosterHints,
      boosterTimeFreezes,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.ECONOMY, JSON.stringify(updated));

    return {
      success: true,
      totalCoins: newCoins,
      inventory: newInventory,
      boosterHints,
      boosterTimeFreezes,
    };
  } catch (error) {
    console.error('Error purchasing store item:', error);
    return { success: false, reason: error.message };
  }
}

/**
 * Equip Avatar Frame (Synced to MongoDB Atlas)
 */
export async function equipAvatarFrame(frameId) {
  try {
    const economy = await loadGameEconomy();
    
    // Sync to backend MongoDB!
    try {
      await api.post('/student/game/equip-frame', { frameId });
    } catch (apiErr) {
      console.warn('Backend equip frame sync error:', apiErr);
    }

    const updated = { ...economy, equippedFrame: frameId };
    await AsyncStorage.setItem(STORAGE_KEYS.ECONOMY, JSON.stringify(updated));
    return { success: true, equippedFrame: frameId };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Save result after playing a campaign level
 */
export async function saveLevelResult(
  levelNum,
  stars,
  score,
  correctCount,
  totalQuestions,
  maxStreak = 0,
  isBoss = false,
  bossBounty = 0
) {
  try {
    const levels = await loadLevelsProgress();
    const stats = await loadUserStats();

    const currentLevel = levels[levelNum] || {
      level: levelNum,
      unlocked: true,
      stars: 0,
      highScore: 0,
      playedCount: 0,
    };

    // Update level data
    const numericScore = Math.max(0, Math.round(Number(score) || 0));
    const oldStars = Math.max(0, Math.round(Number(currentLevel.stars) || 0));
    const newStars = Math.max(oldStars, stars);
    const currentHighScore = Math.max(0, Math.round(Number(currentLevel.highScore) || 0));
    const newHighScore = Math.max(currentHighScore, numericScore);
    const starDelta = Math.max(0, newStars - oldStars);

    levels[levelNum] = {
      ...currentLevel,
      stars: newStars,
      highScore: newHighScore,
      playedCount: (currentLevel.playedCount || 0) + 1,
    };

    // Unlock next level if passed (at least 1 star) and next level exists
    if (stars >= 1 && levelNum < 50) {
      const nextLevelNum = levelNum + 1;
      if (!levels[nextLevelNum]) {
        levels[nextLevelNum] = {
          level: nextLevelNum,
          unlocked: true,
          stars: 0,
          highScore: 0,
          playedCount: 0,
        };
      } else {
        levels[nextLevelNum].unlocked = true;
      }
    }

    // Count how many levels have at least 1 star
    const completedCount = Object.values(levels).filter((l) => l.stars >= 1).length;

    // Coins calculation
    let coinsEarned = 0;
    if (stars === 1) coinsEarned = 25;
    else if (stars === 2) coinsEarned = 50;
    else if (stars === 3) coinsEarned = 100;

    // Boss bonus
    if (isBoss && stars >= 1 && bossBounty > 0) {
      coinsEarned += bossBounty;
    }

    // Speed / accuracy bonus
    if (correctCount === totalQuestions && totalQuestions > 0) {
      coinsEarned += 20; // Perfect score bonus
    }

    if (coinsEarned > 0) {
      await addCoins(coinsEarned);
    }

    // Update lifetime stats
    const updatedStats = {
      ...stats,
      totalScore: (Number(stats.totalScore) || 0) + numericScore,
      totalStars: (Number(stats.totalStars) || 0) + starDelta,
      totalSolved: (Number(stats.totalSolved) || 0) + totalQuestions,
      totalCorrect: (Number(stats.totalCorrect) || 0) + correctCount,
      bestStreak: Math.max(Number(stats.bestStreak) || 0, maxStreak),
      levelsCompleted: completedCount,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.LEVELS_PROGRESS, JSON.stringify(levels));
    await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(updatedStats));

    return {
      levels,
      stats: updatedStats,
      unlockedNext: stars >= 1 && levelNum < 50,
      isNewHighScore: numericScore > currentHighScore,
      coinsEarned,
      isBossDefeated: isBoss && stars >= 1,
    };
  } catch (error) {
    console.error('Error saving level result:', error);
    return null;
  }
}

/**
 * Save result after playing Speed Challenge mode
 */
export async function saveSpeedChallengeResult(score, correctCount, totalCount, maxStreak) {
  try {
    const stats = await loadUserStats();
    const numericScore = Math.max(0, Math.round(Number(score) || 0));
    const currentSpeedHighScore = Math.max(0, Math.round(Number(stats.speedChallengeHighScore) || 0));
    const isNewHighScore = numericScore > currentSpeedHighScore;

    const updatedStats = {
      ...stats,
      totalScore: (Number(stats.totalScore) || 0) + numericScore,
      speedChallengeHighScore: Math.max(currentSpeedHighScore, numericScore),
      totalSolved: (Number(stats.totalSolved) || 0) + totalCount,
      totalCorrect: (Number(stats.totalCorrect) || 0) + correctCount,
      bestStreak: Math.max(Number(stats.bestStreak) || 0, maxStreak),
    };

    // Coins based on score (1 coin per 25 points, minimum 10 if score > 0)
    const coinsEarned = score > 0 ? Math.max(10, Math.floor(score / 25)) : 0;
    if (coinsEarned > 0) {
      await addCoins(coinsEarned);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(updatedStats));
    return { stats: updatedStats, isNewHighScore, coinsEarned };
  } catch (error) {
    console.error('Error saving speed challenge result:', error);
    return null;
  }
}

/**
 * Load settings
 */
export async function loadGameSettings() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings
 */
export async function saveGameSettings(newSettings) {
  try {
    const current = await loadGameSettings();
    const updated = { ...current, ...newSettings };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Reset all progress back to Level 1
 */
export async function resetGameProgress() {
  try {
    const freshLevels = createDefaultLevelsProgress();
    await AsyncStorage.setItem(STORAGE_KEYS.LEVELS_PROGRESS, JSON.stringify(freshLevels));
    await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(DEFAULT_USER_STATS));
    await AsyncStorage.setItem(STORAGE_KEYS.ECONOMY, JSON.stringify(DEFAULT_ECONOMY));
    return { levels: freshLevels, stats: DEFAULT_USER_STATS, economy: DEFAULT_ECONOMY };
  } catch (error) {
    console.error('Error resetting game progress:', error);
    return null;
  }
}
