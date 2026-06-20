import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, StatusBar, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

type Props = {
  route: { params?: { role?: 'guest' | 'host'; username?: string } };
  navigation: any;
};

export default function SetupUsernameScreen({ route, navigation }: Props) {
  const { role = 'guest' } = route.params ?? {};
  const [username, setUsername] = useState('');

  function handleChange(text: string) {
    setUsername(text.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
  }

  const canContinue = username.length >= 3;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.inner}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Feather name="arrow-left" size={20} color="rgba(244,242,236,0.6)" />
            </TouchableOpacity>

            <View style={s.steps}>
              <View style={[s.step, s.stepActive]} />
              <View style={s.step} />
              <View style={s.step} />
            </View>

            <Text style={s.title}>Pick a username</Text>
            <Text style={s.sub}>This is how others find you. You can change it any time.</Text>

            <View style={s.inputRow}>
              <View style={s.atBox}>
                <Text style={s.at}>@</Text>
              </View>
              <TextInput
                style={s.input}
                value={username}
                onChangeText={handleChange}
                placeholder="yourhandle"
                placeholderTextColor="rgba(244,242,236,0.25)"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                maxLength={24}
                returnKeyType="done"
                onSubmitEditing={() => canContinue && navigation.navigate('SetupDOB', { role, username })}
              />
            </View>
            {username.length > 0 && username.length < 3 && (
              <Text style={s.hint}>At least 3 characters required</Text>
            )}

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              style={[s.cta, !canContinue && s.ctaDim]}
              onPress={() => navigation.navigate('SetupDOB', { role, username })}
              activeOpacity={0.88}
              disabled={!canContinue}
            >
              <Text style={s.ctaText}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#090909" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#090909' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },

  backBtn: { marginTop: 8, marginBottom: 24, alignSelf: 'flex-start', padding: 4 },

  steps:      { flexDirection: 'row', gap: 8, marginBottom: 32 },
  step:       { height: 5, width: 20, borderRadius: 3, backgroundColor: 'rgba(232,227,216,0.22)' },
  stepActive: { width: 32, backgroundColor: '#E8E3D8' },

  title: { fontSize: 28, fontWeight: '700', color: '#F4F2EC', letterSpacing: -0.9, marginBottom: 10 },
  sub:   { fontSize: 14, color: 'rgba(244,242,236,0.48)', lineHeight: 21, marginBottom: 36 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', height: 54,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16, overflow: 'hidden',
  },
  atBox: {
    width: 48, height: '100%', alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)',
  },
  at:    { color: 'rgba(232,227,216,0.55)', fontSize: 18, fontWeight: '600' },
  input: { flex: 1, height: '100%', paddingHorizontal: 14, color: '#F4F2EC', fontSize: 16 },
  hint:  { color: 'rgba(232,160,160,0.8)', fontSize: 12, marginTop: 8 },

  cta: {
    height: 56, borderRadius: 28, backgroundColor: '#E8E3D8',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 },
      android: { elevation: 10 },
    }),
  },
  ctaDim:  { opacity: 0.32 },
  ctaText: { color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
