/**
 * Math Game Engine
 * Handles procedural question generation, scoring, streaks, and validation.
 */
import { TRICKS_DATA } from '../data/tricksData';
import { LEVELS_DATA } from '../data/levelsData';

// Lookup map for fast trick retrieval
const TRICKS_BY_ID = TRICKS_DATA.reduce((acc, trick) => {
  acc[trick.id] = trick;
  return acc;
}, {});

/**
 * Generate a procedural question for a specific trick ID
 */
export function generateQuestionForTrick(trickId) {
  const trick = TRICKS_BY_ID[trickId] || TRICKS_DATA[0];
  const qData = trick.generate();
  return {
    ...qData,
    trickId: trick.id,
    trickTitle: trick.title,
    trickRule: trick.rule,
  };
}

/**
 * Generate a full set of questions for a campaign level
 */
export function generateLevelQuestions(levelNumber) {
  const level = LEVELS_DATA.find((l) => l.level === levelNumber) || LEVELS_DATA[0];
  const questions = [];

  for (let i = 0; i < level.questionCount; i++) {
    // Pick random trick from this level's allowed trickIds
    const trickId = level.trickIds[Math.floor(Math.random() * level.trickIds.length)];
    const q = generateQuestionForTrick(trickId);
    questions.push({
      ...q,
      id: `l${levelNumber}_q${i + 1}_${Date.now()}_${Math.random()}`,
      timeLimit: level.timePerQuestion,
    });
  }

  return {
    level,
    questions,
  };
}

/**
 * Generate a set of questions for Speed Challenge mode (mixed operations)
 * @param {number} count Total questions count or high batch for timed mode
 * @param {string} difficulty 'normal' | 'hard'
 */
export function generateSpeedChallengeQuestions(count = 25, difficulty = 'normal') {
  const questions = [];
  const candidateTricks =
    difficulty === 'hard'
      ? TRICKS_DATA
      : TRICKS_DATA.filter((t) => t.difficulty !== 'Grandmaster');

  for (let i = 0; i < count; i++) {
    const trick = candidateTricks[Math.floor(Math.random() * candidateTricks.length)];
    const q = trick.generate();
    questions.push({
      ...q,
      id: `speed_q${i + 1}_${Date.now()}_${Math.random()}`,
      trickId: trick.id,
      trickTitle: trick.title,
      trickRule: trick.rule,
      timeLimit: 12,
    });
  }

  return questions;
}

/**
 * Calculate score for a correctly answered question
 * @param {number} timeLeftSeconds Remaining seconds on timer
 * @param {number} totalTimeSeconds Total initial timer seconds
 * @param {number} currentStreak Current streak count
 * @param {boolean} usedHint Whether student viewed hint
 */
export function calculateQuestionScore(
  timeLeftSeconds = 0,
  totalTimeSeconds = 12,
  currentStreak = 0,
  usedHint = false
) {
  const BASE_SCORE = 100;

  // Speed bonus up to 50 points based on % of time remaining
  const timeRatio = Math.max(0, Math.min(1, timeLeftSeconds / (totalTimeSeconds || 12)));
  const speedBonus = Math.round(timeRatio * 50);

  // Streak Multiplier
  let multiplier = 1.0;
  if (currentStreak >= 10) multiplier = 3.0;
  else if (currentStreak >= 6) multiplier = 2.0;
  else if (currentStreak >= 3) multiplier = 1.5;

  let total = Math.round((BASE_SCORE + speedBonus) * multiplier);

  // Minor hint deduction
  if (usedHint) {
    total = Math.max(30, total - 35);
  }

  return {
    pointsAwarded: total,
    speedBonus,
    multiplier,
    valueOf() { return total; },
    toString() { return String(total); },
  };
}

/**
 * Evaluate stars earned for a level completion
 */
export function evaluateLevelStars(levelNumber, correctCount) {
  const level = LEVELS_DATA.find((l) => l.level === levelNumber) || LEVELS_DATA[0];
  const { one, two, three } = level.starsThreshold;

  if (correctCount >= three) return 3;
  if (correctCount >= two) return 2;
  if (correctCount >= one) return 1;
  return 0; // Failed level
}

