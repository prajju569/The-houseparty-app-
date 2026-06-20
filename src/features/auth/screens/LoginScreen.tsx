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

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
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

  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
        Alert.alert(
          'Email not confirmed',
          'Check your inbox and tap the confirmation link first, then try signing in again.',
        );
      } else if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        Alert.alert('Wrong email or password', 'Double-check and try again.');
      } else {
        Alert.alert('Sign in failed', error.message);
      }
    }
    // On success: App.tsx listener fires, session is set, AppNavigator switches to Home
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
            <Text style={s.title}>Welcome back</Text>
            <Text style={s.sub}>Sign in to pick up where you left off</Text>

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
                returnKeyType="next"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={s.pwRow}>
                <TextInput
                  style={[s.input, { paddingRight: 50 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(244,242,236,0.3)"
                  secureTextEntry={!showPw}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity style={s.eye} onPress={() => setShowPw(v => !v)}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color="rgba(244,242,236,0.4)" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={s.forgotBtn}
              onPress={() => Alert.alert('Coming soon', 'Password reset is on the way.')}
              activeOpacity={0.7}
            >
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.cta, loading && s.ctaDim]}
              onPress={handleSignIn}
              activeOpacity={0.88}
              disabled={loading}
            >
              <Text style={s.ctaText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
            </TouchableOpacity>

            {/* Social / Phone options */}
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

            <TouchableOpacity style={s.link} onPress={() => navigation.navigate('SignUp')} activeOpacity={0.7}>
              <Text style={s.linkText}>
                Don't have an account?{'  '}
                <Text style={s.linkAccent}>Sign up</Text>
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

  forgotBtn:  { alignSelf: 'flex-end', marginTop: 4, marginBottom: 32 },
  forgotText: { color: 'rgba(232,227,216,0.40)', fontSize: 13 },

  cta: {
    height: 56, borderRadius: 28, backgroundColor: '#E8E3D8',
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 },
      android: { elevation: 10 },
    }),
  },
  ctaDim:  { opacity: 0.6 },
  ctaText: { color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 20 },
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
