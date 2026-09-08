import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Vibration,
} from 'react-native';
import { STREAK_REWARDS, claimDailyStreakBonus } from '../services/gameStorage';

export default function DailyStreakModal({
  visible,
  onClose,
  dailyStreak = 0,
  canClaimStreak = false,
  onStreakClaimed,
}) {
  const [claiming, setClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);

  const handleClaim = async () => {
    if (claiming || !canClaimStreak) return;
    setClaiming(true);

    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate([0, 60, 40, 100]);
      } catch (e) {}
    }

    const res = await claimDailyStreakBonus();
    setClaiming(false);

    if (res.success) {
      setClaimedReward(res);
      if (onStreakClaimed) {
        onStreakClaimed(res);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={claiming}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Header */}
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.title}>Daily Login Streak</Text>
          <Text style={styles.subtitle}>
            Log in every day to claim compounding coin bonuses for your mock exam passes!
          </Text>

          {/* Current Streak Indicator */}
          <View style={styles.streakIndicator}>
            <Text style={styles.streakCountText}>
              Current Streak: <Text style={{ color: '#ea580c', fontWeight: '900' }}>{dailyStreak} Days</Text>
            </Text>
          </View>

          {/* 7 Days Grid */}
          <View style={styles.grid}>
            {STREAK_REWARDS.map((item) => {
              const isPastClaimed = item.day <= dailyStreak && !canClaimStreak;
              const isTodayTarget =
                canClaimStreak && (dailyStreak % 7) + 1 === item.day;
              const isFuture = !isPastClaimed && !isTodayTarget;

              return (
                <View
                  key={item.day}
                  style={[
                    styles.dayCard,
                    isPastClaimed && styles.dayCardClaimed,
                    isTodayTarget && styles.dayCardToday,
                    item.day === 7 && styles.dayCardGrand,
                  ]}
                >
                  <Text style={styles.dayNum}>Day {item.day}</Text>
                  <Text style={styles.dayIcon}>
                    {item.day === 7 ? '👑' : isPastClaimed ? '✅' : '🪙'}
                  </Text>
                  <Text
                    style={[
                      styles.dayCoins,
                      isTodayTarget && { color: '#ea580c', fontWeight: '900' },
                      item.day === 7 && { color: '#b45309', fontWeight: '900' },
                    ]}
                  >
                    +{item.coins}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Claim Success Banner */}
          {claimedReward && (
            <View style={styles.successBanner}>
              <Text style={styles.successTitle}>🎉 Claimed Successfully!</Text>
              <Text style={styles.successText}>
                +{claimedReward.coinsWon} Coins Added to your wallet! Streak is now {claimedReward.streakDay} days!
              </Text>
            </View>
          )}

          {/* Action Button */}
          {canClaimStreak && !claimedReward ? (
            <TouchableOpacity
              style={[styles.claimBtn, claiming && styles.claimBtnDisabled]}
              onPress={handleClaim}
              disabled={claiming}
              activeOpacity={0.85}
            >
              <Text style={styles.claimBtnText}>
                {claiming ? 'CLAIMING...' : '🎁 CLAIM TODAY’S REWARD'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.alreadyClaimedBox}>
              <Text style={styles.alreadyClaimedText}>
                ✅ Already claimed today! Come back tomorrow to keep the flame burning!
              </Text>
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
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 390,
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
  streakEmoji: {
    fontSize: 40,
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e1b4b',
    marginTop: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 12,
    lineHeight: 16,
  },
  streakIndicator: {
    backgroundColor: '#fff7ed',
    borderColor: '#ffedd5',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  streakCountText: {
    fontSize: 13,
    color: '#9a3412',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  dayCard: {
    width: '23%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  dayCardClaimed: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  dayCardToday: {
    backgroundColor: '#fff7ed',
    borderColor: '#ea580c',
    transform: [{ scale: 1.05 }],
  },
  dayCardGrand: {
    width: '48%',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  dayNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  dayIcon: {
    fontSize: 18,
    marginVertical: 3,
  },
  dayCoins: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#047857',
  },
  successText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  claimBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
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
  claimBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  alreadyClaimedBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  alreadyClaimedText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
});

