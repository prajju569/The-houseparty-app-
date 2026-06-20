import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import GuestNavigator from './GuestNavigator';
import HostNavigator from './HostNavigator';
import BottomNav from '../shared/components/BottomNav';
import { navigate } from './navigationRef';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import { useAuthStore } from '../features/auth/authStore';
import { ONBOARDING_SEEN_KEY } from '../features/auth/screens/OnboardingScreen';

export default function AppNavigator() {
  const { T } = useTheme();
  const { session, isLoading, profile, appMode } = useAuthStore();
  const [currentRoute, setCurrentRoute] = useState('Home');
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  // Ambient champagne glow — slow 28s drift loop
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const glowAnim2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(7000),
        Animated.timing(glowAnim2, { toValue: 1, duration: 16000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim2, { toValue: 0, duration: 16000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY).then(v => setOnboardingSeen(v === '1'));
  }, []);

  // When session ends (sign-out), reset onboarding so the 3 slides show again next time
  useEffect(() => {
    if (!session) {
      AsyncStorage.removeItem(ONBOARDING_SEEN_KEY).then(() => setOnboardingSeen(false));
    }
  }, [session]);

  function handleNavigate(route: string) {
    // Map BottomNav route names to screen names
    const screenName = route === 'Messages' ? 'Conversations' : route;
    setCurrentRoute(route);
    navigate(screenName);
  }

  if (isLoading || onboardingSeen === null) {
    return (
      <View style={[s.splash, { backgroundColor: T.bg }]}>
        <Text style={s.splashBrand}>houseparty ✦</Text>
      </View>
    );
  }

  if (!session || !profile) {
    const startAt = !session
      ? (onboardingSeen ? 'SignIn' : 'Onboarding')
      : 'SetupUsername';
    return <AuthNavigator initialRoute={startAt as any} />;
  }

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      {/* Ambient champagne glow — slow drift, touch events pass through */}
      <Animated.View
        style={[s.glow, {
          opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.10] }),
          transform: [{
            translateX: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }),
          }, {
            translateY: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 30] }),
          }],
        }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[s.glow, s.glowBlue, {
          opacity: glowAnim2.interpolate({ inputRange: [0, 1], outputRange: [0.02, 0.06] }),
          transform: [{
            translateX: glowAnim2.interpolate({ inputRange: [0, 1], outputRange: [20, -30] }),
          }, {
            translateY: glowAnim2.interpolate({ inputRange: [0, 1], outputRange: [60, 100] }),
          }],
        }]}
        pointerEvents="none"
      />

      {/* Screen area — 100px bottom pad so content clears the floating dock */}
      <View style={s.screens}>
        {appMode === 'GUEST' ? <GuestNavigator /> : <HostNavigator />}
      </View>

      {/* Floating glass dock */}
      <BottomNav
        appMode={appMode}
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: '-10%' as any,
    left: '8%' as any,
    width: 760,
    height: 760,
    borderRadius: 380,
    backgroundColor: 'rgba(232,227,216,1)',
    zIndex: 0,
  },
  glowBlue: {
    top: '30%' as any,
    left: '-20%' as any,
    backgroundColor: 'rgba(91,140,255,1)',
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  screens: {
    flex: 1,
    paddingBottom: 100,
    zIndex: 10,
  },
  splash: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  splashBrand: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
    color: '#E8E3D8',
  },
});
