import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Vibration } from 'react-native';

export default function GameKeypad({
  onDigitPress,
  onBackspace,
  onClear,
  onSubmit,
  disabled = false,
  vibration = true,
}) {
  const triggerHaptic = () => {
    if (vibration && Platform.OS !== 'web') {
      try {
        Vibration.vibrate(12);
      } catch (e) {
        // ignore
      }
    }
  };

  const handlePress = (char) => {
    if (disabled) return;
    triggerHaptic();
    onDigitPress(char);
  };

  const handleBackspace = () => {
    if (disabled) return;
    triggerHaptic();
    onBackspace();
  };

  const handleClear = () => {
    if (disabled) return;
    triggerHaptic();
    onClear();
  };

  const handleSubmit = () => {
    if (disabled) return;
    triggerHaptic();
    onSubmit();
  };

  const KEYPAD_ROWS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={styles.container}>
      {KEYPAD_ROWS.map((row, rIdx) => (
        <View key={`row_${rIdx}`} style={styles.row}>
          {row.map((val) => (
            <TouchableOpacity
              key={val}
              style={styles.keyButton}
              onPress={() => handlePress(val)}
              activeOpacity={0.6}
              disabled={disabled}
            >
              <Text style={styles.keyText}>{val}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Bottom Row: Clear, 0, Backspace */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.keyButton, styles.funcButton]}
          onPress={handleClear}
          activeOpacity={0.6}
          disabled={disabled}
        >
          <Text style={[styles.keyText, styles.clearText]}>C</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.keyButton}
          onPress={() => handlePress('0')}
          activeOpacity={0.6}
          disabled={disabled}
        >
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.keyButton, styles.funcButton]}
          onPress={handleBackspace}
          activeOpacity={0.6}
          disabled={disabled}
        >
          <Text style={[styles.keyText, styles.backspaceText]}>⌫</Text>
        </TouchableOpacity>
      </View>

      {/* Submit / Enter Action Button */}
      <TouchableOpacity
        style={[styles.submitButton, disabled && styles.disabledButton]}
        onPress={handleSubmit}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={styles.submitButtonText}>ENTER ↵</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  keyButton: {
    flex: 1,
    height: 56,
    marginHorizontal: 5,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#14217f',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      },
    }),
  },
  funcButton: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  clearText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 20,
  },
  backspaceText: {
    color: '#f59e0b',
    fontWeight: '800',
    fontSize: 22,
  },
  submitButton: {
    height: 50,
    marginHorizontal: 5,
    marginTop: 4,
    backgroundColor: '#14217f',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#14217f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(20,33,127,0.3)',
      },
    }),
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});

