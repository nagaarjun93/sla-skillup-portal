import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUniversalRouter } from '../utils/useUniversalRouter';
import { useArjunAuth } from '../context/AuthContext';
import { COLORS } from '../styles/theme';

export default function ProtectedRoute({ children, roleRequired }) {
  const { isAuthenticated, role, loading } = useArjunAuth();
  const router = useUniversalRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/student-login');
      } else if (roleRequired && role !== roleRequired) {
        if (role === 'admin') {
          router.replace('/admin-dashboard');
        } else {
          router.replace('/home');
        }
      }
    }
  }, [loading, isAuthenticated, role]);

  if (loading || !isAuthenticated || (roleRequired && role !== roleRequired)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
