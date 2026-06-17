import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../features/auth/authStore';
import { ThemeProvider } from '../theme/ThemeContext';
import AuthNavigator from './AuthNavigator';
import HostNavigator from './HostNavigator';
import GuestNavigator from './GuestNavigator';

export default function AppNavigator() {
  const { session, profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // TODO: remove bypass before release
  const BYPASS_AUTH = true;

  return (
    <ThemeProvider>
      <NavigationContainer>
        {BYPASS_AUTH || !session ? (
          BYPASS_AUTH ? <GuestNavigator /> : <AuthNavigator />
        ) : profile?.role === 'host' ? (
          <HostNavigator />
        ) : (
          <GuestNavigator />
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
