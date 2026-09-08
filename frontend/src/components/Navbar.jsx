import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import { useArjunAuth } from '../context/AuthContext';
import { COLORS } from '../styles/theme';
import NavIcon from './NavIcon';

export default function Navbar({ title = 'SLA SkillUp', showBack = true, showLogout = true, onBack }) {
  const router = useUniversalRouter();
  const { user, role, logout } = useArjunAuth();

  const handleLogout = async () => {
    const currentRole = role;
    await logout();
    if (currentRole === 'admin') {
      router.replace('/admin-login');
    } else {
      router.replace('/student-login');
    }
  };

  const isProfilePage = title && title.toLowerCase().includes('profile');

  const handleBackPress = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      router.back(role === 'admin' ? 'admin-dashboard' : 'home');
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.titleText}>{title}</Text>
          {user && (
            <Text style={styles.userSubtitle}>
              {user.name || user.username || 'User'} ({role?.toUpperCase()})
            </Text>
          )}
        </View>
      </View>

      {/* Top Right Profile Avatar Button */}
      {user && !isProfilePage && (
        <TouchableOpacity
          onPress={() => router.push(role === 'admin' ? '/admin-profile' : '/student-profile')}
          style={styles.profileBtn}
          activeOpacity={0.8}
        >
          <View style={styles.profileAvatarCircle}>
            <NavIcon name="profile" color={COLORS.primary} size={20} active={true} />
          </View>
          <View style={styles.onlineDot} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 36,
    textAlign: 'center',
    marginLeft: -2,
    marginTop: -4,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  userSubtitle: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  profileBtn: {
    position: 'relative',
    padding: 2,
  },
  profileAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
    }),
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
});
