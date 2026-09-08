/**
 * FloatingScrollButtons
 * ---------------------
 * Renders two floating ⬆ / ⬇ buttons fixed to the LEFT side of the screen.
 * Clicking them smoothly scrolls the main page up or down — works on ALL pages.
 * Web-only: on native iOS/Android the component renders null (not needed there).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';

export default function FloatingScrollButtons() {
  if (Platform.OS !== 'web') return null;
  return <FloatingScrollButtonsWeb />;
}

function FloatingScrollButtonsWeb() {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const scrollBy = (direction) => {
    const amount = direction === 'up' ? -300 : 300;

    // 1. Try the main window scroll
    window.scrollBy({ top: amount, behavior: 'smooth' });

    // 2. Scroll any overflow-y container on the page (React Native Web renders these)
    const overflowEls = document.querySelectorAll(
      '[style*="overflow-y: auto"], [style*="overflow-y: scroll"], ' +
      '[style*="overflow: auto"], [style*="overflow: scroll"]'
    );
    overflowEls.forEach((el) => {
      el.scrollBy({ top: amount, behavior: 'smooth' });
    });

    // 3. Also target the Expo/RN Web root scroll container
    const root = document.getElementById('root');
    if (root) {
      const firstChild = root.firstElementChild;
      if (firstChild) firstChild.scrollBy?.({ top: amount, behavior: 'smooth' });
    }
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
      {/* UP button */}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => scrollBy('up')}
        activeOpacity={0.75}
        accessibilityLabel="Scroll Up"
      >
        <Text style={styles.arrow}>▲</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* DOWN button */}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => scrollBy('down')}
        activeOpacity={0.75}
        accessibilityLabel="Scroll Down"
      >
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'fixed',
    left: 10,
    top: '50%',
    transform: [{ translateY: -48 }],
    zIndex: 9999,
    backgroundColor: '#1e3a8a',
    borderRadius: 28,
    paddingVertical: 4,
    alignItems: 'center',
    width: 42,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 12,
  },
  btn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  divider: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 2,
  },
  arrow: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
});
