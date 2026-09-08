const Student = require('../models/Student');

const STREAK_REWARDS = [50, 75, 100, 150, 200, 300, 500];
const VALID_SPIN_PRIZES = [50, 100, 250, 500, 750, 1500];
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

// GET /api/student/game/status
exports.getGameStatus = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const now = Date.now();
    const timeSinceSpin = now - (student.lastSpinTimestamp || 0);
    const canSpin = timeSinceSpin >= COOLDOWN_MS;
    const msUntilNextSpin = Math.max(0, COOLDOWN_MS - timeSinceSpin);

    const todayStr = new Date().toISOString().split('T')[0];
    const canClaimStreak = student.lastStreakClaimDate !== todayStr;

    res.json({
      coins: student.gameCoins ?? 200,
      dailyStreak: student.dailyStreak || 1,
      inventory: student.inventory || [],
      equippedFrame: student.equippedFrame || 'default',
      canSpin,
      msUntilNextSpin,
      canClaimStreak,
      lastStreakDate: student.lastStreakClaimDate || null
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/student/game/spin
exports.recordSpin = async (req, res, next) => {
  try {
    const { prizeCoins } = req.body;
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const now = Date.now();
    const timeSinceSpin = now - (student.lastSpinTimestamp || 0);
    if (timeSinceSpin < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - timeSinceSpin;
      return res.status(400).json({
        success: false,
        message: 'Daily spin is on cooldown. Please wait 24 hours between spins.',
        msUntilNextSpin: remainingMs
      });
    }

    // Validate prize coins
    const coinsWon = Number(prizeCoins);
    if (!VALID_SPIN_PRIZES.includes(coinsWon)) {
      return res.status(400).json({ success: false, message: 'Invalid prize amount' });
    }

    student.gameCoins = (student.gameCoins ?? 200) + coinsWon;
    student.lastSpinTimestamp = now;
    await student.save();

    res.json({
      success: true,
      coinsWon,
      totalCoins: student.gameCoins,
      lastSpinTimestamp: student.lastSpinTimestamp
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/student/game/claim-streak
exports.claimStreakBonus = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (student.lastStreakClaimDate === todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Daily streak reward already claimed for today!'
      });
    }

    const streakCount = student.dailyStreak || 1;
    const streakDay = ((streakCount - 1) % 7) + 1;
    const coinsWon = STREAK_REWARDS[streakDay - 1] || 50;

    student.gameCoins = (student.gameCoins ?? 200) + coinsWon;
    student.lastStreakClaimDate = todayStr;
    await student.save();

    res.json({
      success: true,
      coinsWon,
      streakDay,
      totalCoins: student.gameCoins
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/student/game/award-coins
exports.awardCoins = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const coinsToAdd = Number(amount);
    if (!coinsToAdd || isNaN(coinsToAdd) || coinsToAdd <= 0 || coinsToAdd > 10000) {
      return res.status(400).json({ success: false, message: 'Invalid coins amount' });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.gameCoins = (student.gameCoins ?? 200) + coinsToAdd;
    await student.save();

    res.json({
      success: true,
      coinsAdded: coinsToAdd,
      totalCoins: student.gameCoins,
      reason: reason || 'game_reward'
    });
  } catch (error) {
    next(error);
  }
};

const DEFAULT_STORE_ITEMS = [
  {
    id: 'mock_pass_stage_1',
    category: 'passes',
    title: 'Mock Test 1 Pass',
    badge: 'Month 1 Milestone',
    description: 'Unlocks complete access to the Stage 1 Comprehensive Mock Exam.',
    cost: 5000,
    icon: '📝',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    type: 'pass',
  },
  {
    id: 'mock_pass_stage_2',
    category: 'passes',
    title: 'Mock Test 2 Pass',
    badge: 'Month 2 Milestone',
    description: 'Unlocks the Mid-Term Stage 2 High-Difficulty Mock Exam & Analytics.',
    cost: 12000,
    icon: '🎯',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#c4b5fd',
    type: 'pass',
  },
  {
    id: 'mock_pass_finale',
    category: 'passes',
    title: 'Grand Mock Exam Finale',
    badge: 'Month 3 Graduation',
    description: 'The Ultimate 3-Month Graduation Mock Exam + Official Certificate Eligibility!',
    cost: 25000,
    icon: '👑',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fdba74',
    type: 'pass',
  },
  {
    id: 'mock_retake_token',
    category: 'passes',
    title: 'Mock Exam Retake Token',
    badge: 'Rank Booster',
    description: 'Allows 1 extra fresh attempt on any locked/completed mock exam.',
    cost: 2500,
    icon: '🔄',
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    type: 'pass',
  },
  {
    id: 'frame_bronze',
    category: 'frames',
    title: 'Bronze Scholar Border',
    badge: 'Rank: Novice',
    description: 'Polished bronze badge border to show your early dedication.',
    cost: 500,
    icon: '🥉',
    color: '#b45309',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    type: 'frame',
  },
  {
    id: 'frame_silver',
    category: 'frames',
    title: 'Silver Speedster Border',
    badge: 'Rank: Apprentice',
    description: 'Sleek silver metallic trim symbolizing speed and precision.',
    cost: 1500,
    icon: '🥈',
    color: '#64748b',
    bgColor: '#f8fafc',
    borderColor: '#cbd5e1',
    type: 'frame',
  },
  {
    id: 'frame_gold',
    category: 'frames',
    title: 'Golden Tactician Trim',
    badge: 'Rank: Tactician',
    description: 'Gleaming 24k gold border representing top-tier mental arithmetic.',
    cost: 4000,
    icon: '🥇',
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
    type: 'frame',
  },
  {
    id: 'frame_diamond',
    category: 'frames',
    title: 'Diamond Grandmaster Aura',
    badge: 'Rank: Grandmaster',
    description: 'Radiant diamond aura border reserved for elite speed solvers.',
    cost: 10000,
    icon: '💎',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#7dd3fc',
    type: 'frame',
  },
  {
    id: 'frame_fire',
    category: 'frames',
    title: 'Inferno Ramanujan Glow',
    badge: 'Legendary',
    description: 'Blazing animated fire aura for the ultimate aptitude champion!',
    cost: 20000,
    icon: '🔥',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
    type: 'frame',
  },
  {
    id: 'booster_hints_5',
    category: 'boosters',
    title: 'Pack of 5 Smart Hints',
    badge: 'Gameplay Booster',
    description: 'Instantly highlights the mathematical shortcut trick during questions.',
    cost: 400,
    icon: '💡',
    color: '#eab308',
    bgColor: '#fefce8',
    borderColor: '#fef08a',
    type: 'booster',
    count: 5,
  },
  {
    id: 'booster_freeze_3',
    category: 'boosters',
    title: '3x Time Freezes (10s)',
    badge: 'Gameplay Booster',
    description: 'Pauses the question timer for 10 seconds without resetting your streak.',
    cost: 600,
    icon: '❄️',
    color: '#06b6d4',
    bgColor: '#ecfeff',
    borderColor: '#a5f3fc',
    type: 'booster',
    count: 3,
  }
];

// GET /api/student/game/store-items
exports.getStoreItems = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id);
    res.json({
      items: DEFAULT_STORE_ITEMS,
      inventory: student ? (student.inventory || []) : [],
      equippedFrame: student ? (student.equippedFrame || 'default') : 'default',
      coins: student ? (student.gameCoins ?? 200) : 0
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/student/game/purchase
exports.purchaseItem = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const item = DEFAULT_STORE_ITEMS.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in store catalog' });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if ((student.gameCoins || 0) < item.cost) {
      return res.status(400).json({
        success: false,
        reason: 'insufficient_coins',
        message: 'Insufficient coins in your wallet to purchase this item'
      });
    }

    const currentInventory = Array.isArray(student.inventory) ? student.inventory : [];
    if (item.type !== 'booster' && currentInventory.includes(item.id)) {
      return res.status(400).json({
        success: false,
        reason: 'already_owned',
        message: 'You already own this item'
      });
    }

    student.gameCoins -= item.cost;
    if (item.type !== 'booster') {
      student.inventory.push(item.id);
    }
    await student.save();

    res.json({
      success: true,
      item,
      totalCoins: student.gameCoins,
      inventory: student.inventory,
      message: `${item.title} purchased successfully!`
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/student/game/equip-frame
exports.equipFrame = async (req, res, next) => {
  try {
    const { frameId } = req.body;
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.equippedFrame = frameId || 'default';
    await student.save();

    res.json({
      success: true,
      equippedFrame: student.equippedFrame
    });
  } catch (error) {
    next(error);
  }
};



