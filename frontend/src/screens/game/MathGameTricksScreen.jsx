import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { TRICKS_DATA, TRICK_CATEGORIES } from '../../game/data/tricksData';

export default function MathGameTricksScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(TRICKS_DATA[0]?.id || null);

  const filteredTricks =
    selectedCategory === 'All'
      ? TRICKS_DATA
      : TRICKS_DATA.filter((t) => t.category === selectedCategory);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handlePractice = (trick) => {
    navigation.navigate('math-game-play', {
      mode: 'practice',
      trickId: trick.id,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Mental Math Tricks</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.subtitle}>
        Learn Vedic & mental math shortcuts, then test yourself with targeted practice!
      </Text>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {TRICK_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  isSelected && styles.categoryPillTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tricks List */}
      <View style={styles.tricksList}>
        {filteredTricks.map((trick) => {
          const isExpanded = expandedId === trick.id;

          return (
            <View key={trick.id} style={styles.trickCard}>
              {/* Card Header */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(trick.id)}
                activeOpacity={0.75}
              >
                <View style={styles.badgeBox}>
                  <Text style={styles.badgeText}>{trick.badge}</Text>
                </View>

                <View style={styles.headerInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.trickTitle}>{trick.title}</Text>
                    <View style={styles.diffPill}>
                      <Text style={styles.diffText}>{trick.difficulty}</Text>
                    </View>
                  </View>
                  <Text style={styles.trickSummary} numberOfLines={isExpanded ? undefined : 2}>
                    {trick.summary}
                  </Text>
                </View>

                <Text style={styles.arrowIcon}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {/* Expandable Details */}
              {isExpanded && (
                <View style={styles.cardBody}>
                  <View style={styles.divider} />

                  {/* Rule */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionLabel}>The Shortcut Rule:</Text>
                    <Text style={styles.ruleText}>{trick.rule}</Text>
                  </View>

                  {/* Step by step */}
                  {trick.steps && trick.steps.length > 0 && (
                    <View style={styles.sectionBox}>
                      <Text style={styles.sectionLabel}>Step-by-Step Method:</Text>
                      {trick.steps.map((step, idx) => (
                        <View key={`step_${idx}`} style={styles.stepRow}>
                          <Text style={styles.stepBullet}>{idx + 1}.</Text>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Walkthrough Example */}
                  {trick.example && (
                    <View style={styles.exampleBox}>
                      <View style={styles.exampleHeaderRow}>
                        <Text style={styles.exampleLabel}>Example Walkthrough:</Text>
                        <Text style={styles.exampleQuestion}>{trick.example.question}</Text>
                      </View>
                      {trick.example.steps.map((s, idx) => (
                        <Text key={`ex_s_${idx}`} style={styles.exampleStep}>
                          • {s}
                        </Text>
                      ))}
                      <View style={styles.exampleResultRow}>
                        <Text style={styles.exampleResultLabel}>Answer:</Text>
                        <Text style={styles.exampleResultVal}>{trick.example.answer}</Text>
                      </View>
                    </View>
                  )}

                  {/* Practice Button */}
                  <TouchableOpacity
                    style={styles.practiceButton}
                    onPress={() => handlePractice(trick)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.practiceButtonText}>
                      🎯 Practice This Trick (10 Qs)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

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
    marginTop: 10,
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14217f',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14217f',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
    textAlign: 'center',
  },
  categoryScroll: {
    paddingBottom: 12,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#14217f',
    borderColor: '#14217f',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  tricksList: {
    marginTop: 6,
  },
  trickCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  badgeBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1d4ed8',
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trickTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
  },
  diffPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  trickSummary: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  arrowIcon: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 8,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  sectionBox: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#14217f',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  ruleText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stepBullet: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    width: 20,
  },
  stepText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    lineHeight: 18,
  },
  exampleBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  exampleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  exampleQuestion: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14217f',
  },
  exampleStep: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  exampleResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  exampleResultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginRight: 6,
  },
  exampleResultVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
  practiceButton: {
    backgroundColor: '#14217f',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  practiceButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});