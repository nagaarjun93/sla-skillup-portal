import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Vibration,
} from 'react-native';
import { TRICKS_DATA } from '../../game/data/tricksData';

// 7 Diverse Question Generators for 2-Player Split Screen Duel
const QUESTION_GENERATORS = [
  // 1. Vedic / Fast Addition
  () => {
    const tens1 = (Math.floor(Math.random() * 7) + 2) * 10;
    const num1 = tens1 + (Math.floor(Math.random() * 9) + 1);
    const num2 = Math.floor(Math.random() * 60) + 18;
    return {
      prompt: `${num1} + ${num2}`,
      answer: num1 + num2,
      category: 'Addition',
    };
  },
  // 2. Complements to 100 & 1000 / Subtraction
  () => {
    const is1000 = Math.random() > 0.5;
    if (is1000) {
      const num = Math.floor(Math.random() * 750) + 150;
      return {
        prompt: `1000 - ${num}`,
        answer: 1000 - num,
        category: 'Subtraction',
      };
    } else {
      const num = Math.floor(Math.random() * 85) + 12;
      return {
        prompt: `100 - ${num}`,
        answer: 100 - num,
        category: 'Subtraction',
      };
    }
  },
  // 3. Multiplication: ×5, ×11, ×15, ×25, ×101, ×9
  () => {
    const ops = ['x5', 'x11', 'x15', 'x25', 'x101', 'x9'];
    const pick = ops[Math.floor(Math.random() * ops.length)];
    if (pick === 'x5') {
      const n = (Math.floor(Math.random() * 45) + 12) * 2;
      return { prompt: `${n} × 5`, answer: n * 5, category: 'Multiply' };
    } else if (pick === 'x11') {
      const n = Math.floor(Math.random() * 75) + 14;
      return { prompt: `${n} × 11`, answer: n * 11, category: 'Multiply' };
    } else if (pick === 'x15') {
      const n = (Math.floor(Math.random() * 25) + 8) * 2;
      return { prompt: `${n} × 15`, answer: n * 15, category: 'Multiply' };
    } else if (pick === 'x25') {
      const mults = [12, 16, 20, 24, 28, 32, 36, 44, 48];
      const n = mults[Math.floor(Math.random() * mults.length)];
      return { prompt: `${n} × 25`, answer: n * 25, category: 'Multiply' };
    } else if (pick === 'x101') {
      const n = Math.floor(Math.random() * 70) + 15;
      return { prompt: `${n} × 101`, answer: n * 101, category: 'Multiply' };
    } else {
      const n = Math.floor(Math.random() * 60) + 12;
      return { prompt: `${n} × 9`, answer: n * 9, category: 'Multiply' };
    }
  },
  // 4. Division: ÷4, ÷5, ÷25, ÷50
  () => {
    const types = ['div5', 'div4', 'div25', 'div50'];
    const t = types[Math.floor(Math.random() * types.length)];
    if (t === 'div5') {
      const factor = Math.floor(Math.random() * 50) + 14;
      return { prompt: `${factor * 5} ÷ 5`, answer: factor, category: 'Division' };
    } else if (t === 'div4') {
      const factor = Math.floor(Math.random() * 50) + 12;
      return { prompt: `${factor * 4} ÷ 4`, answer: factor, category: 'Division' };
    } else if (t === 'div25') {
      const factor = Math.floor(Math.random() * 25) + 6;
      return { prompt: `${factor * 25} ÷ 25`, answer: factor, category: 'Division' };
    } else {
      const factor = Math.floor(Math.random() * 30) + 8;
      return { prompt: `${factor * 50} ÷ 50`, answer: factor, category: 'Division' };
    }
  },
  // 5. Squares: Ending in 5, Near 50, Near 100
  () => {
    const sub = ['end5', 'near50', 'near100'][Math.floor(Math.random() * 3)];
    if (sub === 'end5') {
      const candidates = [15, 25, 35, 45, 55, 65, 75, 85, 95];
      const n = candidates[Math.floor(Math.random() * candidates.length)];
      return { prompt: `${n}²`, answer: n * n, category: 'Square' };
    } else if (sub === 'near50') {
      const candidates = [47, 48, 49, 51, 52, 53, 54];
      const n = candidates[Math.floor(Math.random() * candidates.length)];
      return { prompt: `${n}²`, answer: n * n, category: 'Square' };
    } else {
      const candidates = [94, 96, 97, 98, 99, 102, 103, 104, 105];
      const n = candidates[Math.floor(Math.random() * candidates.length)];
      return { prompt: `${n}²`, answer: n * n, category: 'Square' };
    }
  },
  // 6. Vedic Sutras: Midpoints & Same Tens Sum 10
  () => {
    if (Math.random() > 0.5) {
      const tens = Math.floor(Math.random() * 7) + 2;
      const u1 = Math.floor(Math.random() * 8) + 1;
      const u2 = 10 - u1;
      const n1 = tens * 10 + u1;
      const n2 = tens * 10 + u2;
      return { prompt: `${n1} × ${n2}`, answer: n1 * n2, category: 'Vedic' };
    } else {
      const midpoints = [20, 30, 40, 50, 60];
      const M = midpoints[Math.floor(Math.random() * midpoints.length)];
      const d = Math.floor(Math.random() * 3) + 1;
      const n1 = M - d;
      const n2 = M + d;
      return { prompt: `${n1} × ${n2}`, answer: n1 * n2, category: 'Vedic' };
    }
  },
  // 7. Fast Percentages & Reversible %
  () => {
    if (Math.random() > 0.5) {
      const pcts = [10, 20, 30, 40, 50, 60, 70];
      const p = pcts[Math.floor(Math.random() * pcts.length)];
      const n = (Math.floor(Math.random() * 30) + 5) * 10;
      return { prompt: `${p}% of ${n}`, answer: (p * n) / 100, category: 'Percentage' };
    } else {
      const n = (Math.floor(Math.random() * 20) + 4) * 2;
      return { prompt: `${n}% of 50`, answer: n / 2, category: 'Percentage' };
    }
  },
];

export default function MathGameMultiplayerScreen({ navigation }) {
  const TARGET_SCORE = 10;

  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [winner, setWinner] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);

  // Set to track previously asked question prompts in this match so they NEVER repeat!
  const seenPromptsRef = useRef(new Set());
  const roundCounterRef = useRef(0);

  // Generate a strictly UNIQUE, diverse question with 4 smart distinct options
  const generateNewRound = useCallback(() => {
    let q = null;
    let attempts = 0;

    while (attempts < 50) {
      attempts++;
      const genIndex = (roundCounterRef.current + attempts) % QUESTION_GENERATORS.length;
      const candidate = QUESTION_GENERATORS[genIndex]();

      if (!seenPromptsRef.current.has(candidate.prompt)) {
        q = candidate;
        seenPromptsRef.current.add(candidate.prompt);
        roundCounterRef.current++;
        break;
      }
    }

    if (!q) {
      const randomTrick = TRICKS_DATA[Math.floor(Math.random() * TRICKS_DATA.length)];
      const tq = randomTrick.generate();
      q = { prompt: tq.prompt, answer: tq.answer, category: randomTrick.category };
      seenPromptsRef.current.add(q.prompt);
    }

    const correctAns = q.answer;

    // Generate 3 plausible distractors
    const distractors = new Set();
    let distAttempts = 0;
    while (distractors.size < 3 && distAttempts < 40) {
      distAttempts++;
      const deltas = [1, -1, 2, -2, 5, -5, 10, -10, 20, -20];
      const delta = deltas[Math.floor(Math.random() * deltas.length)];
      const wrong = correctAns + delta;

      if (wrong !== correctAns && wrong >= 0) {
        distractors.add(wrong);
      }
    }

    while (distractors.size < 3) {
      const fallbackWrong = correctAns + (distractors.size + 1) * 3;
      distractors.add(fallbackWrong);
    }

    const allOpts = [correctAns, ...Array.from(distractors)].sort(() => Math.random() - 0.5);

    setCurrentQuestion(q);
    setOptions(allOpts);
  }, []);

  useEffect(() => {
    generateNewRound();
  }, [generateNewRound]);

  const handlePlayerAnswer = (player, chosenOption) => {
    if (winner || !currentQuestion) return;

    const isCorrect = chosenOption === currentQuestion.answer;

    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(isCorrect ? 30 : 60);
      } catch (e) {
        // ignore
      }
    }

    if (player === 'p1') {
      const nextP1 = Math.max(0, p1Score + (isCorrect ? 1 : -1));
      setP1Score(nextP1);
      if (nextP1 >= TARGET_SCORE) {
        setWinner('p1');
        return;
      }
    } else {
      const nextP2 = Math.max(0, p2Score + (isCorrect ? 1 : -1));
      setP2Score(nextP2);
      if (nextP2 >= TARGET_SCORE) {
        setWinner('p2');
        return;
      }
    }

    generateNewRound();
  };

  const handleRestart = () => {
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
    seenPromptsRef.current.clear();
    roundCounterRef.current = 0;
    generateNewRound();
  };

  if (!currentQuestion) return null;

  return (
    <View style={styles.container}>
      {/* PLAYER 1 HALF (TOP - Rotated 180° for opposite seating) */}
      <View style={[styles.playerHalf, styles.p1Half]}>
        <View style={styles.rotatedWrapper}>
          <View style={styles.playerMetaRow}>
            <View style={styles.badgeRow}>
              <Text style={[styles.playerBadge, { backgroundColor: '#fee2e2', color: '#dc2626' }]}>
                PLAYER 1
              </Text>
              {currentQuestion.category && (
                <Text style={styles.categoryTag}>{currentQuestion.category}</Text>
              )}
            </View>
            <View style={styles.speedGoalBadge}>
              <Text style={styles.speedGoalText}>🏁 Reach Finish Line</Text>
            </View>
          </View>

          {/* SPEED SPRINT LINE (Progress Track) */}
          <View style={styles.sprintTrackContainer}>
            <View style={styles.sprintTrackBackdrop}>
              <View
                style={[
                  styles.sprintTrackFill,
                  styles.p1TrackFill,
                  { width: `${Math.min(100, Math.round((p1Score / TARGET_SCORE) * 100))}%` }
                ]}
              />
            </View>
            <View style={styles.sprintTrackMarkerRow}>
              <Text style={styles.sprintMarkerText}>🏎️ START</Text>
              <Text style={styles.sprintMarkerText}>FINISH 🏁</Text>
            </View>
          </View>

          <View style={styles.questionBanner}>
            <Text style={styles.questionText}>{currentQuestion.prompt} = ?</Text>
          </View>

          <View style={styles.optionsRow}>
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={`p1_opt_${idx}`}
                style={[styles.optionBtn, styles.p1Btn]}
                onPress={() => handlePlayerAnswer('p1', opt)}
                activeOpacity={0.7}
                disabled={!!winner}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* CENTER DIVIDER / STATUS BAR */}
      <View style={styles.centerBar}>
        <TouchableOpacity
          style={styles.centerExitBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.centerExitText}>✕ Exit</Text>
        </TouchableOpacity>

        <View style={styles.centerDuelStatus}>
          <Text style={styles.centerDuelText}>⚡ SPEED SPRINT DUEL 🏁</Text>
        </View>

        <TouchableOpacity
          style={styles.centerResetBtn}
          onPress={handleRestart}
          activeOpacity={0.7}
        >
          <Text style={styles.centerResetText}>🔄 Reset</Text>
        </TouchableOpacity>
      </View>

      {/* PLAYER 2 HALF (BOTTOM - Normal orientation) */}
      <View style={[styles.playerHalf, styles.p2Half]}>
        <View style={styles.normalWrapper}>
          <View style={styles.playerMetaRow}>
            <View style={styles.badgeRow}>
              <Text style={[styles.playerBadge, { backgroundColor: '#dbeafe', color: '#2563eb' }]}>
                PLAYER 2
              </Text>
              {currentQuestion.category && (
                <Text style={styles.categoryTag}>{currentQuestion.category}</Text>
              )}
            </View>
            <View style={styles.speedGoalBadge}>
              <Text style={styles.speedGoalText}>🏁 Reach Finish Line</Text>
            </View>
          </View>

          {/* SPEED SPRINT LINE (Progress Track) */}
          <View style={styles.sprintTrackContainer}>
            <View style={styles.sprintTrackBackdrop}>
              <View
                style={[
                  styles.sprintTrackFill,
                  styles.p2TrackFill,
                  { width: `${Math.min(100, Math.round((p2Score / TARGET_SCORE) * 100))}%` }
                ]}
              />
            </View>
            <View style={styles.sprintTrackMarkerRow}>
              <Text style={styles.sprintMarkerText}>🚀 START</Text>
              <Text style={styles.sprintMarkerText}>FINISH 🏁</Text>
            </View>
          </View>

          <View style={styles.questionBanner}>
            <Text style={styles.questionText}>{currentQuestion.prompt} = ?</Text>
          </View>

          <View style={styles.optionsRow}>
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={`p2_opt_${idx}`}
                style={[styles.optionBtn, styles.p2Btn]}
                onPress={() => handlePlayerAnswer('p2', opt)}
                activeOpacity={0.7}
                disabled={!!winner}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* WINNER OVERLAY */}
      {winner && (
        <View style={styles.winnerOverlay}>
          <View style={styles.winnerCard}>
            <Text style={styles.winnerTrophy}>🏆</Text>
            <Text style={styles.winnerText}>
              {winner === 'p1' ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!'}
            </Text>
            <Text style={styles.winnerSubText}>Reached the finish line first with lightning speed! ⚡🏁</Text>

            <TouchableOpacity
              style={styles.rematchBtn}
              onPress={handleRestart}
              activeOpacity={0.8}
            >
              <Text style={styles.rematchText}>Race Again! ⚔️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exitModalBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.exitModalText}>Exit to Hub</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  playerHalf: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  p1Half: {
    backgroundColor: '#fff1f2',
  },
  p2Half: {
    backgroundColor: '#eff6ff',
  },
  rotatedWrapper: {
    transform: [{ rotate: '180deg' }],
    width: '100%',
    alignItems: 'center',
  },
  normalWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  playerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '900',
    fontSize: 13,
  },
  categoryTag: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  speedGoalBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  speedGoalText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  sprintTrackContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 8,
  },
  sprintTrackBackdrop: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  sprintTrackFill: {
    height: '100%',
    borderRadius: 6,
  },
  p1TrackFill: {
    backgroundColor: '#ef4444',
  },
  p2TrackFill: {
    backgroundColor: '#2563eb',
  },
  sprintTrackMarkerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  sprintMarkerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  questionBanner: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
  },
  optionBtn: {
    flex: 1,
    height: 52,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
  },
  p1Btn: {
    borderColor: '#fca5a5',
  },
  p2Btn: {
    borderColor: '#93c5fd',
  },
  optionText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  centerBar: {
    height: 48,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  centerExitBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  centerExitText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  centerDuelStatus: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#334155',
  },
  centerDuelText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerResetBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  centerResetText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  winnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 99,
  },
  winnerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  winnerTrophy: {
    fontSize: 60,
    marginBottom: 10,
  },
  winnerText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#14217f',
    marginBottom: 6,
  },
  winnerSubText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  rematchBtn: {
    backgroundColor: '#10b981',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  rematchText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  exitModalBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  exitModalText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});