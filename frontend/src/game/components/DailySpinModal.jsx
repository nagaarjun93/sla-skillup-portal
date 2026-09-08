import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Platform,
  Vibration,
} from 'react-native';
import { recordDailySpin } from '../services/gameStorage';

// 6 Colorful Prize Wedges
const PRIZES = [
  { id: 0, label: '50', coins: 50, color: '#3b82f6', icon: '🪙' },
  { id: 1, label: '100', coins: 100, color: '#10b981', icon: '🪙' },
  { id: 2, label: '250', coins: 250, color: '#8b5cf6', icon: '💰' },
  { id: 3, label: '500', coins: 500, color: '#f59e0b', icon: '💎' },
  { id: 4, label: '750', coins: 750, color: '#ec4899', icon: '🔥' },
  { id: 5, label: '1,500', coins: 1500, color: '#ef4444', icon: '👑' }, // JACKPOT
];

export default function DailySpinModal({
  visible,
  onClose,
  canSpin = true,
  msUntilNextSpin = 0,
  onSpinComplete,
}) {
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);
  const [countdownStr, setCountdownStr] = useState('');

  const spinValue = useRef(new Animated.Value(0)).current;
  const currentAngle = useRef(0);

  // Countdown timer for next spin
  useEffect(() => {
    if (canSpin) return;

    const updateTimer = () => {
      const remaining = Math.max(0, msUntilNextSpin);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);

      const pad = (n) => String(n).padStart(2, '0');
      setCountdownStr(`${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [canSpin, msUntilNextSpin]);

  const triggerVibrate = (pattern) => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(pattern);
      } catch (e) {}
    }
  };

  const handleSpin = () => {
    if (spinning || !canSpin) return;

    setSpinning(true);
    setWonPrize(null);
    triggerVibrate(40);

    // Pick weighted random prize:
    // Higher chance for 50/100/250, rare chance for 1500 Jackpot
    const rand = Math.random() * 100;
    let selectedIndex = 0;
    if (rand < 35) selectedIndex = 0; // 50 (35%)
    else if (rand < 65) selectedIndex = 1; // 100 (30%)
    else if (rand < 82) selectedIndex = 2; // 250 (17%)
    else if (rand < 92) selectedIndex = 3; // 500 (10%)
    else if (rand < 97) selectedIndex = 4; // 750 (5%)
    else selectedIndex = 5; // 1,500 Jackpot! (3%)

    const segmentAngle = 360 / PRIZES.length; // 60 deg each
    // Offset so top arrow (270 deg / -90 deg) points directly to winning segment
    const fullRotations = 5 + Math.floor(Math.random() * 3); // 5 to 7 full circles
    const targetAngle = fullRotations * 360 + (360 - selectedIndex * segmentAngle - segmentAngle / 2);

    spinValue.setValue(currentAngle.current % 360);

    Animated.timing(spinValue, {
      toValue: targetAngle,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      currentAngle.current = targetAngle;
      setSpinning(false);
      const prize = PRIZES[selectedIndex];
      setWonPrize(prize);
      triggerVibrate([0, 100, 50, 150]);

      // Save to storage
      await recordDailySpin(prize.coins);
      if (onSpinComplete) {
        onSpinComplete(prize.coins);
      }
    });
  };

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={spinning}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Title Header */}
          <Text style={styles.title}>🎡 Daily Lucky Spin</Text>
          <Text style={styles.subtitle}>
            Spin the wheel every 24 hours to win free mock test coins!
          </Text>

          {/* Wheel Container */}
          <View style={styles.wheelWrapper}>
            {/* Top Indicator Arrow */}
            <View style={styles.indicatorWrapper}>
              <Text style={styles.indicator}>🔻</Text>
            </View>

            {/* Rotating Wheel Body */}
            <Animated.View
              style={[
                styles.wheelCircle,
                { transform: [{ rotate: spinInterpolate }] },
              ]}
            >
              {PRIZES.map((prize, idx) => {
                const angle = idx * 60;
                return (
                  <View
                    key={prize.id}
                    style={[
                      styles.slice,
                      {
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  >
                    <View style={[styles.slicePill, { backgroundColor: prize.color }]}>
                      <Text style={styles.sliceIcon}>{prize.icon}</Text>
                      <Text style={styles.sliceLabel}>{prize.label}</Text>
                    </View>
                  </View>
                );
              })}
              {/* Wheel Center Hub */}
              <View style={styles.wheelCenter}>
                <Text style={styles.wheelCenterText}>⭐</Text>
              </View>
            </Animated.View>
          </View>

          {/* Won Prize Celebration Card */}
          {wonPrize && (
            <View style={styles.celebrationBox}>
              <Text style={styles.congratsText}>🎉 CONGRATULATIONS! 🎉</Text>
              <Text style={styles.prizeWonText}>
                +{wonPrize.coins.toLocaleString()} Coins Added!
              </Text>
            </View>
          )}

          {/* Action Button / Cooldown */}
          {canSpin ? (
            <TouchableOpacity
              style={[styles.spinBtn, spinning && styles.spinBtnDisabled]}
              onPress={handleSpin}
              disabled={spinning}
              activeOpacity={0.85}
            >
              <Text style={styles.spinBtnText}>
                {spinning ? 'SPINNING...' : '🎲 SPIN FREE NOW!'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.cooldownBox}>
              <Text style={styles.cooldownLabel}>Next Free Spin Available in:</Text>
              <Text style={styles.cooldownTimer}>⏳ {countdownStr || 'Calculating...'}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      },
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e1b4b',
    marginTop: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  wheelWrapper: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  indicatorWrapper: {
    position: 'absolute',
    top: -14,
    zIndex: 20,
  },
  indicator: {
    fontSize: 28,
  },
  wheelCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 6,
    borderColor: '#312e81',
    backgroundColor: '#1e1b4b',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slice: {
    position: 'absolute',
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  slicePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 52,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  sliceIcon: {
    fontSize: 14,
  },
  sliceLabel: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 11,
  },
  wheelCenter: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  wheelCenterText: {
    fontSize: 22,
  },
  celebrationBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 14,
    width: '100%',
  },
  congratsText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#047857',
  },
  prizeWonText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#065f46',
    marginTop: 2,
  },
  spinBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    marginTop: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)',
      },
    }),
  },
  spinBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  spinBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cooldownBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cooldownLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  cooldownTimer: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '800',
    marginTop: 4,
  },
});

