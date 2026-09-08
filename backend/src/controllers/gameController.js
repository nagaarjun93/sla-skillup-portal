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


