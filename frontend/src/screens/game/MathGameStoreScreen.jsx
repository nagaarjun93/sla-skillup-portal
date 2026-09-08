import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Vibration,
} from 'react-native';
import {
  loadGameEconomy,
  purchaseStoreItem,
  equipAvatarFrame,
} from '../../game/services/gameStorage';

// Catalog of store items tailored to the 3-month course
const STORE_ITEMS = [
  // --- MOCK EXAM PASSES ---
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

  // --- AVATAR FRAMES & BADGES ---
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
    title: 'Gold Grandmaster Halo',
    badge: 'Rank: Master',
    description: 'Radiant golden champion border earned by relentless problem solvers.',
    cost: 4000,
    icon: '🥇',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
    type: 'frame',
  },
  {
    id: 'frame_ramanujan',
    category: 'frames',
    title: 'Vedic Ramanujan Neon Crown',
    badge: 'Rank: Legend',
    description: 'Exclusive legendary neon purple/gold aura of mathematical mastery.',
    cost: 10000,
    icon: '✨',
    color: '#9333ea',
    bgColor: '#faf5ff',
    borderColor: '#d8b4fe',
    type: 'frame',
  },

  // --- GAME BOOSTERS ---
  {
    id: 'booster_hints_5',
    category: 'boosters',
    title: 'Instant Hint Keys (5-Pack)',
    badge: 'Consumable',
    description: '5 free shortcut hint keys without any score deduction.',
    cost: 500,
    icon: '🔑',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#7dd3fc',
    type: 'booster',
  },
  {
    id: 'booster_freeze_3',
    category: 'boosters',
    title: 'Time Freeze (3-Pack)',
    badge: 'Consumable',
    description: '3 time-freeze tokens. Adds +5 extra seconds to any question.',
    cost: 800,
    icon: '❄️',
    color: '#0891b2',
    bgColor: '#ecfeff',
    borderColor: '#67e8f9',
    type: 'booster',
  },
];

export default function MathGameStoreScreen({ navigation }) {
  const [economy, setEconomy] = useState({
    coins: 0,
    inventory: [],
    equippedFrame: 'default',
    boosterHints: 0,
    boosterTimeFreezes: 0,
  });
  const [activeTab, setActiveTab] = useState('passes'); // 'passes' | 'frames' | 'boosters'
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchEconomy = useCallback(async () => {
    const data = await loadGameEconomy();
    setEconomy(data);
  }, []);

  useEffect(() => {
    fetchEconomy();
  }, [fetchEconomy]);

  const triggerVibrate = (pattern) => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(pattern);
      } catch (e) {}
    }
  };

  const handlePurchase = async (item) => {
    if (isProcessing) return;

    if ((economy.coins || 0) < item.cost) {
      const shortage = item.cost - (economy.coins || 0);
      const msg = `You need ${shortage.toLocaleString()} more coins! Solve campaign levels, maintain your daily streak, or spin the lucky wheel to earn coins!`;

      if (Platform.OS === 'web') {
        window.alert(`Insufficient Coins!\n\n${msg}`);
      } else {
        Alert.alert('Insufficient Coins 🪙', msg, [{ text: 'Play Games', onPress: () => navigation.navigate('math-game-levels') }, { text: 'OK' }]);
      }
      return;
    }

    const confirmBuy = async () => {
      setIsProcessing(true);
      triggerVibrate(50);
      const res = await purchaseStoreItem(item);
      setIsProcessing(false);

      if (res.success) {
        triggerVibrate([0, 80, 50, 100]);
        await fetchEconomy();

        const successMsg = `Successfully unlocked "${item.title}"!`;
        if (Platform.OS === 'web') {
          window.alert(successMsg);
        } else {
          Alert.alert('Purchase Successful! 🎉', successMsg, [{ text: 'Awesome!' }]);
        }
      } else {
        const errorMsg = res.reason === 'already_owned' ? 'You already own this item!' : 'Purchase failed. Please try again.';
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('Notice', errorMsg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Buy "${item.title}" for ${item.cost.toLocaleString()} coins?`)) {
        confirmBuy();
      }
    } else {
      Alert.alert(
        'Confirm Purchase',
        `Do you want to unlock "${item.title}" for ${item.cost.toLocaleString()} coins?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock Now', onPress: confirmBuy },
        ]
      );
    }
  };

  const handleEquip = async (frameId) => {
    const res = await equipAvatarFrame(frameId);
    if (res.success) {
      triggerVibrate(30);
      await fetchEconomy();
    }
  };

  const filteredItems = STORE_ITEMS.filter((item) => item.category === activeTab);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛍️ Rewards Store</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Coin Wallet Banner */}
      <View style={styles.walletCard}>
        <View style={styles.walletLeft}>
          <Text style={styles.walletEmoji}>🪙</Text>
          <View>
            <Text style={styles.walletLabel}>Virtual Coin Wallet</Text>
            <Text style={styles.walletBalance}>{(economy.coins || 0).toLocaleString()} Coins</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.earnMoreBtn}
          onPress={() => navigation.navigate('math-game-levels')}
          activeOpacity={0.8}
        >
          <Text style={styles.earnMoreText}>+ Earn More</Text>
        </TouchableOpacity>
      </View>

      {/* 3-Month Progression Notice */}
      <View style={styles.infoPill}>
        <Text style={styles.infoPillText}>
          🎓 <Text style={{ fontWeight: '800' }}>3-Month Course Milestone Store:</Text> Practice math daily to earn real passes for Stage 1, Stage 2, and the Grand Mock Exam Finale!
        </Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'passes' && styles.tabBtnActive]}
          onPress={() => setActiveTab('passes')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'passes' && styles.tabBtnTextActive]}>
            📝 Mock Passes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'frames' && styles.tabBtnActive]}
          onPress={() => setActiveTab('frames')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'frames' && styles.tabBtnTextActive]}>
            🎭 Badges & Frames
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'boosters' && styles.tabBtnActive]}
          onPress={() => setActiveTab('boosters')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'boosters' && styles.tabBtnTextActive]}>
            ⚡ Boosters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Store Items List */}
      <View style={styles.itemsList}>
        {filteredItems.map((item) => {
          const isOwned = (economy.inventory || []).includes(item.id);
          const isEquipped = item.type === 'frame' && economy.equippedFrame === item.id;
          const canAfford = (economy.coins || 0) >= item.cost;

          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                { backgroundColor: item.bgColor, borderColor: item.borderColor },
              ]}
            >
              {/* Item Header */}
              <View style={styles.itemHeader}>
                <View style={styles.itemIconCircle}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <View style={[styles.badgeTag, { backgroundColor: item.color + '22' }]}>
                      <Text style={[styles.badgeTagText, { color: item.color }]}>
                        {item.badge}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                </View>
              </View>

              {/* Item Footer: Price and Action Button */}
              <View style={styles.itemFooter}>
                <View style={styles.priceContainer}>
                  <Text style={styles.coinIcon}>🪙</Text>
                  <Text style={styles.priceValue}>{item.cost.toLocaleString()}</Text>
                </View>

                {item.type === 'frame' && isOwned ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, isEquipped ? styles.equippedBtn : styles.equipBtn]}
                    onPress={() => handleEquip(item.id)}
                    disabled={isEquipped}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        isEquipped ? styles.equippedBtnText : styles.equipBtnText,
                      ]}
                    >
                      {isEquipped ? '✓ Equipped' : 'Equip Frame'}
                    </Text>
                  </TouchableOpacity>
                ) : isOwned && item.type === 'pass' ? (
                  <View style={styles.ownedBadge}>
                    <Text style={styles.ownedBadgeText}>✓ UNLOCKED</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      canAfford ? styles.buyBtn : styles.buyBtnDisabled,
                    ]}
                    onPress={() => handlePurchase(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.buyBtnText}>
                      {item.type === 'booster' && isOwned ? '+ Buy More' : 'Unlock Now'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Extra bottom padding */}
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
    marginTop: 8,
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14217f',
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1b4b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#1e1b4b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 14px rgba(30, 27, 75, 0.2)',
      },
    }),
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletEmoji: {
    fontSize: 34,
    marginRight: 12,
  },
  walletLabel: {
    fontSize: 12,
    color: '#a5b4fc',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletBalance: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24',
    marginTop: 2,
  },
  earnMoreBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  earnMoreText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  infoPill: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  infoPillText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      },
    }),
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#14217f',
    fontWeight: '900',
  },
  itemsList: {
    marginBottom: 10,
  },
  itemCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      },
    }),
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemIcon: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e293b',
    marginRight: 6,
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e293b',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  buyBtn: {
    backgroundColor: '#ea580c',
  },
  buyBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  buyBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
  ownedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  ownedBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#15803d',
  },
  equipBtn: {
    backgroundColor: '#3b82f6',
  },
  equipBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  equippedBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  equippedBtnText: {
    color: '#64748b',
    fontWeight: '800',
    fontSize: 12,
  },
});

