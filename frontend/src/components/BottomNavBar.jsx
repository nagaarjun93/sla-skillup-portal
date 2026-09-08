import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useArjunAuth } from '../context/AuthContext';
import { COLORS } from '../styles/theme';
import NavIcon from './NavIcon';

// Routes where the bottom navigation bar should NOT be shown
const HIDDEN_ROUTES = [
  'RoleSelection',
  'student-login',
  'student-register',
  'student-forgot-password',
  'admin-login',
  'exam', // Timed active student exam requires full-screen focus
  'math-game-play', // Active gameplay needs full keypad focus
  'math-game-multiplayer', // Split-screen local duel needs full screen
];

// Student Tabs: 5 options with Game in the Center (Home, Mock, Game, Ranking, Results)
const STUDENT_TABS = [
  {
    key: 'home',
    label: 'Home',
    iconName: 'home',
    route: 'home',
    matches: ['home'],
  },
  {
    key: 'mock',
    label: 'Mock',
    iconName: 'mock',
    route: 'student-mock-exam',
    matches: ['student-mock-exam'],
  },
  {
    key: 'game',
    label: 'Game',
    iconName: 'game',
    route: 'math-game-home',
    matches: [
      'math-game-home',
      'math-game-levels',
      'math-game-tricks',
      'math-game-leaderboard',
      'math-game-result',
      'math-game-store',
    ],
  },
  {
    key: 'ranking',
    label: 'Ranking',
    iconName: 'ranking',
    route: 'leaderboard',
    matches: ['leaderboard'],
  },
  {
    key: 'results',
    label: 'Results',
    iconName: 'results',
    route: 'previous-tests',
    matches: ['previous-tests'],
  },
];

// Admin Tabs on Mobile: Exactly 4 options (Dashboard, Mock Settings, Students, Results)
const ADMIN_TABS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    iconName: 'dashboard',
    route: 'admin-dashboard',
    matches: ['admin-dashboard'],
  },
  {
    key: 'mock-settings',
    label: 'Mock Settings',
    iconName: 'mock',
    route: 'mock-test-management',
    matches: ['mock-test-management'],
  },
  {
    key: 'students',
    label: 'Students',
    iconName: 'students',
    route: 'student-management',
    matches: ['student-management'],
  },
  {
    key: 'results',
    label: 'Results',
    iconName: 'results',
    route: 'student-results',
    matches: ['student-results', 'mock-results', 'view-mistakes'],
  },
];

export default function BottomNavBar({ currentRoute, navigationRef }) {
  const { isAuthenticated, role } = useArjunAuth();
  const insets = useSafeAreaInsets();

  // Guard: Hide if not logged in or in an excluded screen
  if (!isAuthenticated || !role || !currentRoute || HIDDEN_ROUTES.includes(currentRoute)) {
    return null;
  }

  const tabs = role === 'admin' ? ADMIN_TABS : STUDENT_TABS;

  const handleTabPress = (tab) => {
    if (navigationRef?.current) {
      navigationRef.current.navigate(tab.route);
    }
  };

  const isTabActive = (tab) => {
    return tab.matches.includes(currentRoute);
  };

  const bottomInset = Math.max(insets?.bottom || 0, 10);
  const bottomPosition = Platform.OS === 'ios' ? bottomInset + 6 : 14;

  return (
    <View style={[styles.outerContainer, { bottom: bottomPosition }]} pointerEvents="box-none">
      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const active = isTabActive(tab);
          const isGame = tab.key === 'game';
          const iconColor = isGame ? (active ? '#ea580c' : '#f59e0b') : (active ? COLORS.primary : '#64748b');

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                active && (isGame ? styles.activeGameTabItem : styles.activeTabItem),
                isGame && !active && styles.gameTabItem,
              ]}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={styles.iconContainer}>
                <NavIcon
                  name={tab.iconName}
                  color={iconColor}
                  size={20}
                  active={active}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  active && styles.activeTabLabel,
                  isGame && (active ? styles.activeGameLabel : styles.gameLabel),
                ]}
              >
                {tab.label}
              </Text>
              {active && (
                <View
                  style={[
                    styles.activeDot,
                    isGame && { backgroundColor: '#ea580c' },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    width: Platform.OS === 'web' ? '92%' : '94%',
    maxWidth: 500,
    borderRadius: 30,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(20, 33, 127, 0.09)',
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#14217f',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 8px 24px rgba(20, 33, 127, 0.14)',
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 18,
    marginHorizontal: 2,
  },
  activeTabItem: {
    backgroundColor: '#e7eefd',
  },
  gameTabItem: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  activeGameTabItem: {
    backgroundColor: '#ffedd5',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  gameLabel: {
    color: '#d97706',
    fontWeight: '700',
  },
  activeGameLabel: {
    color: '#ea580c',
    fontWeight: '800',
  },
  iconContainer: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
});