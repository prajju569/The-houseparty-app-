import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../features/auth/authStore';
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

  return (
    <NavigationContainer>
      {!session ? (
        <AuthNavigator />
      ) : profile?.role === 'host' ? (
        <HostNavigator />
      ) : (
        <GuestNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
