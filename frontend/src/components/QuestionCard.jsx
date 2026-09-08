import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  selectedAnswer,
  onSelectAnswer,
  isFlagged,
  onToggleFlag,
}) {
  if (!question) return null;

  const options = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.qNumText}>
          Question {questionNumber} of {totalQuestions}
        </Text>
        {onToggleFlag && (
          <TouchableOpacity onPress={onToggleFlag} style={styles.flagBtn}>
            <Text style={[styles.flagText, isFlagged && styles.flaggedActiveText]}>
              {isFlagged ? '★ Flagged' : '☆ Flag'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.questionText}>{question.questionText}</Text>

      <View style={styles.optionsList}>
        {options.map((opt) => {
          const isSelected = selectedAnswer === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              activeOpacity={0.7}
              onPress={() => onSelectAnswer(opt.key)}
              style={[
                styles.optionItem,
                isSelected ? styles.optionSelected : styles.optionUnselected,
              ]}
            >
              <View
                style={[
                  styles.radioCircle,
                  isSelected ? styles.radioCircleSelected : styles.radioCircleUnselected,
                ]}
              >
                <Text
                  style={[
                    styles.radioText,
                    isSelected ? styles.radioTextSelected : styles.radioTextUnselected,
                  ]}
                >
                  {opt.key}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {opt.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 18,
    marginVertical: 10,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  qNumText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  flagBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.gray100,
  },
  flagText: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '600',
  },
  flaggedActiveText: {
    color: COLORS.warning,
  },
  questionText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
  },
  optionUnselected: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  optionSelected: {
    backgroundColor: COLORS.selectedBg,
    borderWidth: 2,
    borderColor: COLORS.selectedBorder,
  },
  radioCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleUnselected: {
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray400,
  },
  radioCircleSelected: {
    backgroundColor: COLORS.primary,
  },
  radioText: {
    fontSize: 13,
    fontWeight: '700',
  },
  radioTextUnselected: {
    color: COLORS.gray600,
  },
  radioTextSelected: {
    color: COLORS.white,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
