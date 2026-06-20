import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../../services/supabaseClient';

type Props = { navigation: any };

export default function PhoneAuthScreen({ navigation }: Props) {
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [step,    setStep]    = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<TextInput>(null);

  // Normalise: strip non-digits, prepend +91 if no country code
  function normalise(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
  }

  async function sendOtp() {
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid number', 'Enter a 10-digit mobile number.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalise(phone) });
    setLoading(false);
    if (error) {
      Alert.alert('Could not send OTP', error.message);
      return;
    }
    setStep('otp');
    setTimeout(() => otpRef.current?.focus(), 300);
  }

  async function verifyOtp() {
    if (otp.length < 4) {
      Alert.alert('Enter the OTP', 'Check your SMS and enter the code we sent.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalise(phone),
      token: otp,
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Incorrect code', 'The code was wrong or has expired. Try again.');
      return;
    }
    // onAuthStateChange in App.tsx handles navigation
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.inner}>
            <TouchableOpacity style={s.back} onPress={() => {
              if (step === 'otp') { setStep('phone'); setOtp(''); }
              else navigation.goBack();
            }} activeOpacity={0.7}>
              <Feather name="arrow-left" size={20} color="rgba(244,242,236,0.6)" />
            </TouchableOpacity>

            <Text style={s.brand}>houseparty ✦</Text>

            {step === 'phone' ? (
              <>
                <Text style={s.title}>Your number</Text>
                <Text style={s.sub}>We'll send a one-time code to verify it's really you.</Text>

                <View style={s.phoneRow}>
                  <View style={s.countryBox}>
                    <Text style={s.countryText}>🇮🇳  +91</Text>
                  </View>
                  <TextInput
                    style={s.phoneInput}
                    value={phone}
                    onChangeText={t => setPhone(t.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    placeholderTextColor="rgba(244,242,236,0.3)"
                    keyboardType="phone-pad"
                    maxLength={10}
                    returnKeyType="send"
                    onSubmitEditing={sendOtp}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[s.cta, loading && s.ctaDim]}
                  onPress={sendOtp}
                  activeOpacity={0.88}
                  disabled={loading}
                >
                  <Text style={s.ctaText}>{loading ? 'Sending…' : 'Send OTP'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.title}>Enter the code</Text>
                <Text style={s.sub}>Sent to +91 {phone}.</Text>

                <TextInput
                  ref={otpRef}
                  style={[s.input, s.otpInput]}
                  value={otp}
                  onChangeText={t => setOtp(t.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  placeholderTextColor="rgba(244,242,236,0.3)"
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={verifyOtp}
                  textAlign="center"
                />

                <TouchableOpacity
                  style={[s.cta, loading && s.ctaDim]}
                  onPress={verifyOtp}
                  activeOpacity={0.88}
                  disabled={loading}
                >
                  <Text style={s.ctaText}>{loading ? 'Verifying…' : 'Verify & continue'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.resendBtn} onPress={sendOtp} activeOpacity={0.7}>
                  <Text style={s.resendText}>Didn't receive it? Resend</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#090909' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 48 },

  back:  { marginTop: 8, marginBottom: 32, alignSelf: 'flex-start', padding: 4 },
  brand: { fontSize: 15, fontWeight: '600', color: 'rgba(232,227,216,0.55)', letterSpacing: 0.6, marginBottom: 36 },
  title: { fontSize: 30, fontWeight: '700', color: '#F4F2EC', letterSpacing: -1.0, marginBottom: 8 },
  sub:   { fontSize: 15, color: 'rgba(244,242,236,0.50)', lineHeight: 22, marginBottom: 40 },

  phoneRow: {
    flexDirection: 'row', gap: 10, marginBottom: 32,
  },
  countryBox: {
    height: 54, borderRadius: 16, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  countryText: { color: '#F4F2EC', fontSize: 15 },
  phoneInput: {
    flex: 1, height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18, color: '#F4F2EC', fontSize: 18, letterSpacing: 2,
  },

  input: {
    height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18, color: '#F4F2EC', fontSize: 15,
    marginBottom: 32,
  },
  otpInput: { fontSize: 28, letterSpacing: 12, height: 72 },

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

  resendBtn:  { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  resendText: { color: 'rgba(232,227,216,0.40)', fontSize: 14 },
});
