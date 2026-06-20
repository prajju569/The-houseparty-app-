import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export const ONBOARDING_SEEN_KEY = '@hp_onboarding_done';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  {
    image: require('../../../../assets/images/onboarding1.jpg'),
    title: 'Discover\namazing house\nparties',
    body: 'Real parties, real rooms, real people — happening tonight, blocks from you.',
  },
  {
    image: require('../../../../assets/images/onboarding2.jpg'),
    title: 'Meet\nlike-minded\npeople',
    body: 'Find your crowd — music heads, builders, night owls. Your people are already out.',
  },
  {
    image: require('../../../../assets/images/onboarding3.jpg'),
    title: 'Host\nunforgettable\nexperiences',
    body: 'Open your doors. We handle the guest list, RSVPs and the vibe.',
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [index, setIndex]               = useState(0);
  const [selectedRole, setSelectedRole] = useState<'guest' | 'host' | null>(null);

  const slide  = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  async function handleGetStarted() {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    navigation.navigate('SignUp', { role: selectedRole ?? 'guest' });
  }

  function handleSignIn() {
    navigation.navigate('SignIn');
  }

  function handleNext() {
    setIndex(prev => prev + 1);
  }

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <Image source={slide.image} style={s.bg} resizeMode="cover" />

      <View style={s.topScrim} />
      <View style={s.bottomScrim} />

      <SafeAreaView edges={['bottom']} style={s.bottom}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === index ? s.dotActive : s.dotInactive]} />
          ))}
        </View>

        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.body}>{slide.body}</Text>

        <View style={s.actions}>
          {isLast ? (
            <>
              <View style={s.roleRow}>
                {(['guest', 'host'] as const).map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[s.rolePill, selectedRole === r && s.rolePillActive]}
                    onPress={() => setSelectedRole(prev => prev === r ? null : r)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.roleEmoji}>{r === 'guest' ? '🎉' : '🏠'}</Text>
                    <Text style={[s.roleText, selectedRole === r && s.roleTextActive]}>
                      {r === 'guest' ? "I'm a Guest" : "I'm a Host"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.cta} onPress={handleGetStarted} activeOpacity={0.85}>
                <Text style={s.ctaText}>Get Started</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.secondaryBtn} onPress={handleSignIn} activeOpacity={0.7}>
                <Text style={s.secondaryText}>I already have an account</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={s.cta} onPress={handleNext} activeOpacity={0.85}>
              <Text style={s.ctaText}>Next</Text>
              <Feather name="arrow-right" size={18} color="#090909" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#090909',
  },
  bg: {
    position: 'absolute',
    width: W,
    height: H,
    top: 0,
    left: 0,
  },
  topScrim: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 200,
    backgroundColor: 'rgba(9,9,9,0.3)',
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: H * 0.55,
    backgroundColor: 'rgba(9,9,9,0.78)',
  },
  bottom: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'android' ? 32 : 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 28,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    width: 26,
    backgroundColor: '#E8E3D8',
  },
  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  title: {
    fontSize: 38,
    fontWeight: '600',
    color: '#F4F2EC',
    letterSpacing: -1.4,
    lineHeight: 42,
    marginBottom: 14,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(244,242,236,0.62)',
    maxWidth: 300,
    marginBottom: 36,
  },
  actions: {
    gap: 12,
    paddingBottom: 8,
  },
  cta: {
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E8E3D8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#E8E3D8',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#090909',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(244,242,236,0.5)',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rolePill: {
    flex: 1, height: 68, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  rolePillActive: {
    backgroundColor: 'rgba(232,227,216,0.14)',
    borderColor: 'rgba(232,227,216,0.50)',
  },
  roleEmoji:     { fontSize: 22 },
  roleText:       { color: 'rgba(244,242,236,0.55)', fontSize: 13, fontWeight: '500' as const },
  roleTextActive: { color: '#F4F2EC', fontWeight: '600' as const },
});
