import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Vibration,
  Animated,
} from 'react-native';
import {
  generateLevelQuestions,
  generateSpeedChallengeQuestions,
  generateQuestionForTrick,
  calculateQuestionScore,
  evaluateLevelStars,
} from '../../game/services/mathGameEngine';
import {
  saveLevelResult,
  saveSpeedChallengeResult,
  loadGameSettings,
} from '../../game/services/gameStorage';
import TimerBar from '../../game/components/TimerBar';
import GameKeypad from '../../game/components/GameKeypad';
import HintModal from '../../game/components/HintModal';

export default function MathGamePlayScreen({ route, navigation }) {
  const { mode = 'level', levelNumber = 1, trickId = null, timeLimit = 60 } = route.params || {};

  // Settings
  const [settings, setSettings] = useState({ soundEnabled: true, vibrationEnabled: true });

  // Level metadata (for boss levels)
  const [levelMeta, setLevelMeta] = useState(null);

  // Game questions & index
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // User input & feedback
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('neutral'); // 'neutral' | 'correct' | 'wrong'
  const [hintVisible, setHintVisible] = useState(false);
  const [usedHint, setUsedHint] = useState(false);

  // Scoring & Stats
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // Timer
  const isSpeedMode = mode === 'speed';
  const initialTime = isSpeedMode ? timeLimit : 14;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [totalTimeForCurrent, setTotalTimeForCurrent] = useState(initialTime);

  const timerRef = useRef(null);
  const isFinishedRef = useRef(false);
  const mistakesRef = useRef([]);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bossShakeAnim = useRef(new Animated.Value(0)).current;

  // Initialize questions
  useEffect(() => {
    let qList = [];
    if (mode === 'level') {
      const data = generateLevelQuestions(levelNumber);
      qList = data.questions;
      setLevelMeta(data.level);
    } else if (mode === 'speed') {
      qList = generateSpeedChallengeQuestions(50);
      setLevelMeta(null);
    } else if (mode === 'practice' && trickId) {
      // 10 focused questions for this specific trick
      for (let i = 0; i < 10; i++) {
        const q = generateQuestionForTrick(trickId);
        qList.push({
          ...q,
          id: `prac_${i}_${Date.now()}`,
          timeLimit: 14,
        });
      }
      setLevelMeta(null);
    } else {
      qList = generateSpeedChallengeQuestions(20);
      setLevelMeta(null);
    }

    setQuestions(qList);
    if (qList.length > 0) {
      setCurrentQuestion(qList[0]);
      const t = isSpeedMode ? timeLimit : qList[0].timeLimit || 14;
      setTimeLeft(t);
      setTotalTimeForCurrent(t);
    }

    loadGameSettings().then(setSettings);
  }, [mode, levelNumber, trickId]);

  // Main countdown timer
  useEffect(() => {
    if (!currentQuestion || isFinishedRef.current) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.2) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 0.2;
      });
    }, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, currentQuestion, isSpeedMode]);

  const triggerHapticFeedback = (isCorrect) => {
    if (settings.vibrationEnabled && Platform.OS !== 'web') {
      try {
        if (isCorrect) {
          Vibration.vibrate(25);
        } else {
          Vibration.vibrate([0, 40, 30, 40]);
        }
      } catch (e) {}
    }
  };

  const triggerVisualAnimation = (isCorrect) => {
    setFeedback(isCorrect ? 'correct' : 'wrong');
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: isCorrect ? 1.08 : 0.94,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFeedback('neutral');
    });

    // If Boss level and correct answer, trigger boss damage shake
    if (isCorrect && levelMeta?.isBoss) {
      Animated.sequence([
        Animated.timing(bossShakeAnim, { toValue: -12, duration: 40, useNativeDriver: true }),
        Animated.timing(bossShakeAnim, { toValue: 12, duration: 40, useNativeDriver: true }),
        Animated.timing(bossShakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
        Animated.timing(bossShakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
        Animated.timing(bossShakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  };

  // Finish round handler
  const finishGameRound = useCallback(
    async (finalScore, finalCorrect, finalWrong, finalMaxStreak) => {
      if (isFinishedRef.current) return;
      isFinishedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      const numericScore = Math.max(0, Math.round(Number(finalScore) || 0));

      let starsEarned = 0;
      let unlockedNext = false;
      let coinsEarned = 0;
      let isBossDefeated = false;
      const totalAnswered = finalCorrect + finalWrong;

      if (mode === 'level') {
        starsEarned = evaluateLevelStars(levelNumber, finalCorrect);
        const res = await saveLevelResult(
          levelNumber,
          starsEarned,
          finalScore,
          numericScore,
          finalCorrect,
          questions.length,
          finalMaxStreak,
          levelMeta?.isBoss,
          levelMeta?.bossCoinBounty || 0
        );
        unlockedNext = res?.unlockedNext || false;
        coinsEarned = res?.coinsEarned || 0;
        isBossDefeated = res?.isBossDefeated || false;
      } else if (mode === 'speed') {
        const res = await saveSpeedChallengeResult(finalScore, finalCorrect, totalAnswered, finalMaxStreak);
        const res = await saveSpeedChallengeResult(numericScore, finalCorrect, totalAnswered, finalMaxStreak);
        coinsEarned = res?.coinsEarned || 0;
      }

      navigation.replace('math-game-result', {
        mode,
        levelNumber,
        score: finalScore,
        score: numericScore,
        correctCount: finalCorrect,
        wrongCount: finalWrong,
        totalQuestions: mode === 'level' ? questions.length : totalAnswered,
        maxStreak: finalMaxStreak,
        starsEarned,
        unlockedNext,
        coinsEarned,
        mistakesList: mistakesRef.current || [],
        isBoss: levelMeta?.isBoss,
        bossName: levelMeta?.bossName,
        bossAvatar: levelMeta?.bossAvatar,
        bossDefeated: isBossDefeated,
      });
    },
    [mode, levelNumber, questions.length, navigation, levelMeta]
  );

  // Time expired for active question or speed run
  const handleTimeExpired = useCallback(() => {
    if (isFinishedRef.current) return;

    if (isSpeedMode) {
      // Entire 60s speed challenge finished!
      finishGameRound(score, correctCount, wrongCount, maxStreak);
      finishGameRound(Number(score) || 0, correctCount, wrongCount, maxStreak);
    } else {
      // In level or practice mode: current question timed out!
      if (currentQuestion) {
        mistakesRef.current.push({
          question: currentQuestion.question || currentQuestion.expression,
          userAnswer: 'Timed Out ⏱️',
          correctAnswer: currentQuestion.answer,
          tip: currentQuestion.tip || currentQuestion.trickTitle || ''
        });
      }
      triggerHapticFeedback(false);
      triggerVisualAnimation(false);
      const nextWrong = wrongCount + 1;
      setWrongCount(nextWrong);
      setStreak(0);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= questions.length) {
        finishGameRound(score, correctCount, nextWrong, maxStreak);
        finishGameRound(Number(score) || 0, correctCount, nextWrong, maxStreak);
      } else {
        advanceToNextQuestion(nextIndex);
      }
    }
  }, [
    isSpeedMode,
    currentQuestion,
    score,
    correctCount,
    wrongCount,
    maxStreak,
    currentIndex,
    questions.length,
    finishGameRound,
  ]);

  const advanceToNextQuestion = (nextIndex) => {
    setCurrentIndex(nextIndex);
    setCurrentQuestion(questions[nextIndex]);
    setUserInput('');
    setUsedHint(false);

    if (!isSpeedMode) {
      const t = questions[nextIndex]?.timeLimit || 14;
      setTimeLeft(t);
      setTotalTimeForCurrent(t);
    }
  };

  // Submit Answer
  const checkAnswer = useCallback(() => {
    if (!currentQuestion || userInput.trim() === '' || isFinishedRef.current) return;

    const parsedInput = parseFloat(userInput);
    const expected = currentQuestion.answer;
    const isCorrect = Math.abs(parsedInput - expected) < 0.01;

    triggerHapticFeedback(isCorrect);
    triggerVisualAnimation(isCorrect);

    if (isCorrect) {
      const nextStreak = streak + 1;
      const newMaxStreak = Math.max(maxStreak, nextStreak);
      setStreak(nextStreak);
      setMaxStreak(newMaxStreak);

      const nextCorrect = correctCount + 1;
      setCorrectCount(nextCorrect);

      // Score calculation with speed bonus
      const qScore = calculateQuestionScore(
      const qScoreObj = calculateQuestionScore(
        timeLeft,
        totalTimeForCurrent,
        nextStreak,
        usedHint,
        currentQuestion.difficulty || 'medium'
      );
      setScore((prev) => prev + qScore);
      const pointsAwarded = typeof qScoreObj === 'object' && qScoreObj !== null
        ? (Number(qScoreObj.pointsAwarded) || 0)
        : (Number(qScoreObj) || 0);

      const currentNumericScore = Number(score) || 0;
      const newScore = currentNumericScore + pointsAwarded;
      setScore(newScore);

      const nextIndex = currentIndex + 1;
      if (!isSpeedMode && nextIndex >= questions.length) {
        finishGameRound(score + qScore, nextCorrect, wrongCount, newMaxStreak);
        finishGameRound(newScore, nextCorrect, wrongCount, newMaxStreak);
      } else {
        advanceToNextQuestion(nextIndex);
      }
    } else {
      // Wrong answer
      if (currentQuestion) {
        mistakesRef.current.push({
          question: currentQuestion.question || currentQuestion.expression,
          userAnswer: userInput.trim() || 'Empty',
          correctAnswer: currentQuestion.answer,
          tip: currentQuestion.tip || currentQuestion.trickTitle || ''
        });
      }
      setStreak(0);
      const nextWrong = wrongCount + 1;
      setWrongCount(nextWrong);

      const currentNumericScore = Number(score) || 0;
      // In speed mode, give penalty of 20 points
      const updatedScore = isSpeedMode ? Math.max(0, currentNumericScore - 20) : currentNumericScore;
      if (isSpeedMode) {
        setScore((prev) => Math.max(0, prev - 20));
        setScore(updatedScore);
      }

      const nextIndex = currentIndex + 1;
      if (!isSpeedMode && nextIndex >= questions.length) {
        finishGameRound(score, correctCount, nextWrong, maxStreak);
        finishGameRound(updatedScore, correctCount, nextWrong, maxStreak);
      } else {
        advanceToNextQuestion(nextIndex);
      }
    }
  }, [
    currentQuestion,
    userInput,
    streak,
    maxStreak,
    correctCount,
    wrongCount,
    timeLeft,
    totalTimeForCurrent,
    usedHint,
    score,
    currentIndex,
    questions.length,
    isSpeedMode,
    finishGameRound,
  ]);

  // Keypad Handlers
  const handleDigit = (digit) => {
    if (userInput.length < 7) {
      setUserInput((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setUserInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setUserInput('');
  };

  const openHint = () => {
    setUsedHint(true);
    setHintVisible(true);
  };

  if (!currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Preparing Challenge...</Text>
      </View>
    );
  }

  // Answer box border color based on feedback
  let answerBorderColor = '#cbd5e1';
  let answerBgColor = '#ffffff';
  if (feedback === 'correct') {
    answerBorderColor = '#10b981';
    answerBgColor = '#ecfdf5';
  } else if (feedback === 'wrong') {
    answerBorderColor = '#ef4444';
    answerBgColor = '#fef2f2';
  }

  // Calculate Boss Remaining HP
  const bossRemainingHp = levelMeta?.isBoss
    ? Math.max(0, levelMeta.bossHp - correctCount)
    : 0;
  const bossHpPercent = levelMeta?.isBoss
    ? Math.max(0, Math.min(100, (bossRemainingHp / levelMeta.bossHp) * 100))
    : 0;

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.exitText}>✕ Exit</Text>
        </TouchableOpacity>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Score:</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        {streak >= 2 ? (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak}x</Text>
          </View>
        ) : (
          <View style={{ width: 45 }} />
        )}
      </View>

      {/* Timer Bar */}
      <TimerBar
        timeLeft={timeLeft}
        totalTime={totalTimeForCurrent}
        showText={true}
      />

      {/* Boss Fight Card (Only on Boss Levels: 10, 20, 30, 40, 50) */}
      {levelMeta?.isBoss && (
        <Animated.View
          style={[
            styles.bossCard,
            { transform: [{ translateX: bossShakeAnim }] },
          ]}
        >
          <View style={styles.bossAvatarBox}>
            <Text style={styles.bossAvatar}>{levelMeta.bossAvatar || '👹'}</Text>
          </View>
          <View style={styles.bossInfo}>
            <View style={styles.bossTitleRow}>
              <Text style={styles.bossName} numberOfLines={1}>{levelMeta.bossName}</Text>
              <View style={styles.bossBountyBadge}>
                <Text style={styles.bossBountyText}>🪙 +{levelMeta.bossCoinBounty}</Text>
              </View>
            </View>
            <Text style={styles.bossSubtitle}>{levelMeta.bossTitle}</Text>
            {/* HP Bar */}
            <View style={styles.hpTrack}>
              <View style={[styles.hpFill, { width: `${bossHpPercent}%` }]} />
            </View>
            <View style={styles.hpLabelRow}>
              <Text style={styles.hpLabelText}>
                Boss HP: {bossRemainingHp} / {levelMeta.bossHp}
              </Text>
              <Text style={styles.hpStatusText}>
                {bossRemainingHp === 0 ? '💥 DEFEATED!' : '⚔️ Active Battle'}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Progress & Hint Row */}
      <View style={styles.metaRow}>
        <Text style={styles.progressText}>
          {isSpeedMode
            ? `⚡ Solved: ${correctCount}`
            : `Question ${currentIndex + 1} of ${questions.length}`}
        </Text>
        <TouchableOpacity style={styles.hintButton} onPress={openHint} activeOpacity={0.7}>
          <Text style={styles.hintButtonText}>💡 Hint</Text>
        </TouchableOpacity>
      </View>

      {/* Question Card Display */}
      <Animated.View style={[styles.questionCard, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.trickTag}>{currentQuestion.trickTitle || 'Mental Math'}</Text>
        <Text style={styles.promptText}>{currentQuestion.prompt} = ?</Text>

        {/* Input display box */}
        <View style={[styles.answerBox, { borderColor: answerBorderColor, backgroundColor: answerBgColor }]}>
          <Text style={[styles.answerText, userInput === '' && styles.placeholderText]}>
            {userInput !== '' ? userInput : 'Type answer...'}
          </Text>
        </View>
      </Animated.View>

      {/* Responsive On-Screen Numeric Keypad */}
      <View style={styles.keypadWrapper}>
        <GameKeypad
          onDigitPress={handleDigit}
          onBackspace={handleBackspace}
          onClear={handleClear}
          onSubmit={checkAnswer}
          vibration={settings.vibrationEnabled}
        />
      </View>

      {/* Hint Modal */}
      <HintModal
        visible={hintVisible}
        onClose={() => setHintVisible(false)}
        trickTitle={currentQuestion.trickTitle}
        hint={currentQuestion.hint}
        trickRule={currentQuestion.trickRule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  exitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  exitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginRight: 6,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#14217f',
  },
  streakBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ea580c',
  },
  bossCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#ec4899',
    ...Platform.select({
      ios: {
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 3px 10px rgba(236, 72, 153, 0.3)',
      },
    }),
  },
  bossAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bossAvatar: {
    fontSize: 24,
  },
  bossInfo: {
    flex: 1,
  },
  bossTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bossName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    flex: 1,
    marginRight: 6,
  },
  bossBountyBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bossBountyText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1e1b4b',
  },
  bossSubtitle: {
    fontSize: 10,
    color: '#c7d2fe',
    fontWeight: '600',
    marginBottom: 4,
  },
  hpTrack: {
    height: 7,
    backgroundColor: '#4338ca',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  hpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  hpLabelText: {
    fontSize: 9,
    color: '#a5b4fc',
    fontWeight: '700',
  },
  hpStatusText: {
    fontSize: 9,
    color: '#f43f5e',
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
  },
  hintButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  hintButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  questionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#14217f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(20, 33, 127, 0.08)',
      },
    }),
  },
  trickTag: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  promptText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  answerBox: {
    width: '75%',
    maxWidth: 240,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  answerText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: 1,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94a3b8',
    letterSpacing: 0,
  },
  keypadWrapper: {
    paddingHorizontal: 16,
    marginTop: 6,
  },
});
