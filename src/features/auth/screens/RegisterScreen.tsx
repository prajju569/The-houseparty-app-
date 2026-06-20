import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../../services/supabaseClient';

type Props = {
  route: { params?: { role?: 'guest' | 'host' } };
  navigation: any;
};

export default function RegisterScreen({ route, navigation }: Props) {
  const role = route.params?.role ?? 'guest';
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleGoogle() {
    setLoading(true);
    const redirectTo = makeRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) { setLoading(false); Alert.alert('Google sign-in failed', error?.message ?? 'Try again.'); return; }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      await supabase.auth.exchangeCodeForSession(result.url);
    }
    setLoading(false);
  }

  async function handleSignUp() {
    if (!email.trim() || !password || !confirm) {
      Alert.alert('Missing info', 'Fill in all fields to continue.');
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don't match", 'Re-enter the same password in both fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });

    if (error) {
      setLoading(false);
      Alert.alert('Sign up failed', error.message);
      return;
    }

    // If session is immediately available (email confirmation disabled), proceed
    if (data.session) {
      setLoading(false);
      navigation.navigate('SetupUsername', { role });
      return;
    }

    // Email confirmation required — try auto sign-in in case the provider allows it
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signInData.session) {
      navigation.navigate('SetupUsername', { role });
    } else {
      Alert.alert(
        'Almost there!',
        'Check your inbox and tap the confirmation link, then come back and sign in.',
        [{ text: 'Go to Sign In', onPress: () => navigation.navigate('SignIn') }],
      );
    }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Feather name="arrow-left" size={20} color="rgba(244,242,236,0.6)" />
            </TouchableOpacity>

            <Text style={s.brand}>houseparty ✦</Text>
            <Text style={s.title}>Create account</Text>
            <Text style={s.sub}>
              {role === 'host'
                ? 'Start hosting unforgettable parties'
                : 'Find your crowd tonight'}
            </Text>

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="rgba(244,242,236,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={s.pwRow}>
                <TextInput
                  style={[s.input, { paddingRight: 50 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="rgba(244,242,236,0.3)"
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity style={s.eye} onPress={() => setShowPw(v => !v)}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color="rgba(244,242,236,0.4)" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Confirm password</Text>
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repeat password"
                placeholderTextColor="rgba(244,242,236,0.3)"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
            </View>

            <TouchableOpacity
              style={[s.cta, loading && s.ctaDim]}
              onPress={handleSignUp}
              activeOpacity={0.88}
              disabled={loading}
            >
              <Text style={s.ctaText}>{loading ? 'Creating account…' : 'Create account'}</Text>
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or continue with</Text>
              <View style={s.dividerLine} />
            </View>

            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialBtn} onPress={handleGoogle} activeOpacity={0.82} disabled={loading}>
                <Text style={s.googleG}>G</Text>
                <Text style={s.socialLabel}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.socialBtn} onPress={() => navigation.navigate('PhoneAuth')} activeOpacity={0.82}>
                <Feather name="smartphone" size={18} color="#F4F2EC" />
                <Text style={s.socialLabel}>Phone</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.link} onPress={() => navigation.navigate('SignIn')} activeOpacity={0.7}>
              <Text style={s.linkText}>
                Already have an account?{'  '}
                <Text style={s.linkAccent}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#090909' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },

  back: { marginTop: 8, marginBottom: 32, alignSelf: 'flex-start', padding: 4 },

  brand: {
    fontSize: 15, fontWeight: '600',
    color: 'rgba(232,227,216,0.55)', letterSpacing: 0.6, marginBottom: 36,
  },
  title: { fontSize: 30, fontWeight: '700', color: '#F4F2EC', letterSpacing: -1.0, marginBottom: 8 },
  sub:   { fontSize: 15, color: 'rgba(244,242,236,0.50)', lineHeight: 22, marginBottom: 40 },

  field: { marginBottom: 20 },
  label: {
    fontSize: 12, fontWeight: '600', color: 'rgba(232,227,216,0.55)',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18, color: '#F4F2EC', fontSize: 15,
  },
  pwRow: { position: 'relative' },
  eye:   { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center', padding: 4 },

  cta: {
    height: 56, borderRadius: 28, backgroundColor: '#E8E3D8',
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    ...Platform.select({
      ios:     { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 },
      android: { elevation: 10 },
    }),
  },
  ctaDim:  { opacity: 0.6 },
  ctaText: { color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: 'rgba(244,242,236,0.35)', fontSize: 12, letterSpacing: 0.5 },

  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  socialBtn: {
    flex: 1, height: 52, borderRadius: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  googleG:     { fontSize: 18, fontWeight: '700', color: '#F4F2EC', fontStyle: 'italic' },
  socialLabel: { color: '#F4F2EC', fontSize: 14, fontWeight: '500' },

  link:       { marginTop: 24, alignItems: 'center' },
  linkText:   { color: 'rgba(244,242,236,0.40)', fontSize: 14 },
  linkAccent: { color: 'rgba(232,227,216,0.9)', fontWeight: '600' },
});
