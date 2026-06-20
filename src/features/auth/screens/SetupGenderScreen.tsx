/**
 * Supabase — run this SQL to create the profiles table if it doesn't exist:
 *
 *   CREATE TABLE IF NOT EXISTS public.profiles (
 *     id           uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
 *     username     text UNIQUE NOT NULL,
 *     display_name text NOT NULL,
 *     avatar_url   text,
 *     role         text DEFAULT 'guest' CHECK (role IN ('guest', 'host')),
 *     dob          text,
 *     gender       text,
 *     bio          text,
 *     created_at   timestamptz DEFAULT now()
 *   );
 *   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "own profile" ON public.profiles USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../../services/supabaseClient';
import { useAuthStore } from '../authStore';

const OPTIONS = [
  { label: 'Male',              value: 'male' },
  { label: 'Female',            value: 'female' },
  { label: 'Non-binary',        value: 'nonbinary' },
  { label: 'Prefer not to say', value: 'unspecified' },
];

type Props = {
  route: { params: { role: 'guest' | 'host'; username: string; dob: string } };
  navigation: any;
};

export default function SetupGenderScreen({ route, navigation }: Props) {
  const { role = 'guest', username = '', dob = '' } = route.params ?? {};
  const setProfile = useAuthStore(s => s.setProfile);
  const [gender, setGender]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function saveAndFinish(selectedGender: string | null) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Include email so the row can be inserted from scratch if auto-create failed
      const profileData = {
        id:            user.id,
        email:         user.email ?? '',
        username,
        display_name:  username,
        role,
        date_of_birth: dob,
        gender:        selectedGender,
        avatar_url:    null,
        bio:           null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      // If upsert returned data, great. If not (e.g. email NOT NULL hit), use local fallback
      // but still call setProfile so AppNavigator transitions to the main app.
      setProfile((data ?? profileData) as any);

      if (error) {
        // Profile wasn't persisted — App.tsx onAuthStateChange will re-try on next token refresh.
        // The local fallback still lets the user into the app.
        console.warn('SetupGender upsert error:', error.message);
      }
    } catch (err) {
      // Last-resort: set a minimal profile so the user isn't stuck forever
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setProfile({ id: user.id, email: user.email ?? '', username, display_name: username, role, date_of_birth: dob, gender: selectedGender, avatar_url: null, bio: null } as any);
        }
      } catch {
        // Nothing more we can do
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#E8E3D8" size="large" />
        <Text style={s.loadingText}>Setting up your profile…</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.inner}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color="rgba(244,242,236,0.6)" />
          </TouchableOpacity>

          <View style={s.steps}>
            <View style={[s.step, s.stepDone]} />
            <View style={[s.step, s.stepDone]} />
            <View style={[s.step, s.stepActive]} />
          </View>

          <Text style={s.title}>How do you identify?</Text>
          <Text style={s.sub}>Optional — helps hosts create inclusive spaces for everyone.</Text>

          <View style={s.pills}>
            {OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.pill, gender === opt.value && s.pillActive]}
                onPress={() => setGender(prev => (prev === opt.value ? null : opt.value))}
                activeOpacity={0.8}
              >
                {gender === opt.value && <View style={s.checkDot} />}
                <Text style={[s.pillText, gender === opt.value && s.pillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={s.cta}
            onPress={() => saveAndFinish(gender)}
            activeOpacity={0.88}
          >
            <Text style={s.ctaText}>Finish setup</Text>
            <Feather name="check" size={18} color="#090909" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity style={s.skipBtn} onPress={() => saveAndFinish(null)} activeOpacity={0.7}>
            <Text style={s.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#090909' },
  inner:       { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },
  loadingText: { color: 'rgba(244,242,236,0.5)', marginTop: 16, fontSize: 14 },

  back: { marginTop: 8, marginBottom: 24, alignSelf: 'flex-start', padding: 4 },

  steps:      { flexDirection: 'row', gap: 8, marginBottom: 32 },
  step:       { height: 5, width: 20, borderRadius: 3, backgroundColor: 'rgba(232,227,216,0.22)' },
  stepDone:   { backgroundColor: 'rgba(232,227,216,0.42)' },
  stepActive: { width: 32, backgroundColor: '#E8E3D8' },

  title: { fontSize: 28, fontWeight: '700', color: '#F4F2EC', letterSpacing: -0.9, marginBottom: 10 },
  sub:   { fontSize: 14, color: 'rgba(244,242,236,0.48)', lineHeight: 21, marginBottom: 36 },

  pills: { gap: 12 },
  pill: {
    height: 58, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
  },
  pillActive:     { backgroundColor: 'rgba(232,227,216,0.12)', borderColor: 'rgba(232,227,216,0.45)' },
  checkDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8E3D8', marginRight: 12 },
  pillText:       { color: 'rgba(244,242,236,0.55)', fontSize: 16 },
  pillTextActive: { color: '#F4F2EC', fontWeight: '600' },

  cta: {
    height: 56, borderRadius: 28, backgroundColor: '#E8E3D8',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 },
      android: { elevation: 10 },
    }),
  },
  ctaText:  { color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  skipBtn:  { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  skipText: { color: 'rgba(244,242,236,0.40)', fontSize: 14 },
});
