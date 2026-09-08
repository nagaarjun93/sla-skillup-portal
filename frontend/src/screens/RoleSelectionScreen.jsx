import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import { useArjunAuth } from '../context/AuthContext';
import StudentLoginScreen from './StudentLoginScreen';
import { COLORS } from '../styles/theme';

export default function RoleSelectionScreen() {
  const router = useUniversalRouter();
  const { isAuthenticated, role, loading } = useArjunAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (role === 'admin') {
        router.replace('admin-dashboard');
      } else {
        router.replace('home');
      }
    }
  }, [loading, isAuthenticated, role]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <StudentLoginScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

