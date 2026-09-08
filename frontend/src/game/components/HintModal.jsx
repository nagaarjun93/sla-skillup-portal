import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';

export default function HintModal({ visible, onClose, trickTitle, hint, trickRule }) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.icon}>💡</Text>
            <Text style={styles.title}>Mental Math Trick</Text>
          </View>

          {trickTitle ? (
            <View style={styles.trickBadge}>
              <Text style={styles.trickBadgeText}>{trickTitle}</Text>
            </View>
          ) : null}

          {hint ? (
            <View style={styles.hintBox}>
              <Text style={styles.hintHeading}>Shortcut for this question:</Text>
              <Text style={styles.hintText}>{hint}</Text>
            </View>
          ) : null}

          {trickRule ? (
            <View style={styles.ruleBox}>
              <Text style={styles.ruleHeading}>General Rule:</Text>
              <Text style={styles.ruleText}>{trickRule}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Got It!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14217f',
  },
  trickBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e7eefd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 14,
  },
  trickBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14217f',
  },
  hintBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginBottom: 12,
  },
  hintHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#92400e',
  },
  ruleBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  ruleHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  ruleText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
  },
  closeButton: {
    backgroundColor: '#14217f',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

