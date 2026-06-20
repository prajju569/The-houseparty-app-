import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../theme/ThemeContext';
import StepIndicator from './StepIndicator';

const METHODS = [
  { id: 'upi',  label: 'UPI',                 icon: '💳', sub: 'Google Pay · PhonePe · BHIM' },
  { id: 'card', label: 'Debit / Credit Card',  icon: '🏦', sub: 'Visa · Mastercard · RuPay' },
  { id: 'door', label: 'Pay at the door',      icon: '🚪', sub: 'Cash only — confirm your spot now' },
];

export default function RSVPStep3Screen({ route, navigation }: any) {
  const { T } = useTheme();
  const { eventId, guestCount, entryFee = 0 } = route.params ?? {};
  const total  = entryFee * guestCount;
  const [method, setMethod] = useState<string | null>(null);

  const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: T.bg },
    header:  { paddingHorizontal: 22, paddingTop: 12 },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    backTxt: { color: T.text, fontSize: 18 },
    body:    { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 32 },
    title:   { color: T.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
    sub:     { color: T.textMute, fontSize: 13, marginBottom: 20 },

    amountCard: {
      backgroundColor: T.card, borderRadius: 20, padding: 20,
      borderWidth: 1, borderColor: T.border, marginBottom: 24, alignItems: 'center',
    },
    amountLabel: { color: T.textMute, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },
    amountValue: { color: T.accent, fontSize: 44, fontWeight: '800', letterSpacing: -1 },
    amountSub:   { color: T.textMute, fontSize: 12, marginTop: 4 },

    methodRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: T.card, borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: T.border, marginBottom: 10,
    },
    methodActive: { borderColor: T.accent, backgroundColor: 'rgba(232,227,216,0.06)' },
    icon:      { fontSize: 22 },
    mLabel:    { color: T.text, fontSize: 15, fontWeight: '600' },
    mSub:      { color: T.textMute, fontSize: 12, marginTop: 2 },
    radio: {
      width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: T.border,
      alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' as any,
    },
    radioOn:    { borderColor: T.accent },
    radioDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: T.accent },

    splitBtn: {
      height: 50, borderRadius: 25,
      backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
      alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    splitText: { color: T.textSub, fontSize: 15, fontWeight: '600' },
    cta: {
      height: 56, borderRadius: 28, backgroundColor: T.accent,
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        ios:     { shadowColor: T.accent, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 32 },
        android: { elevation: 10 },
      }),
    },
    ctaOff:  { opacity: 0.4 },
    ctaText: { color: '#090909', fontSize: 16, fontWeight: '700' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>←</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={s.body}>
        <StepIndicator current={3} total={5} T={T} />
        <Text style={s.title}>Entry fee</Text>
        <Text style={s.sub}>Choose how you'd like to pay</Text>

        <View style={s.amountCard}>
          <Text style={s.amountLabel}>TOTAL</Text>
          <Text style={s.amountValue}>₹{total}</Text>
          <Text style={s.amountSub}>₹{entryFee} × {guestCount} {guestCount === 1 ? 'guest' : 'guests'}</Text>
        </View>

        {METHODS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[s.methodRow, method === m.id && s.methodActive]}
            onPress={() => setMethod(m.id)}
            activeOpacity={0.8}
          >
            <Text style={s.icon}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.mLabel}>{m.label}</Text>
              <Text style={s.mSub}>{m.sub}</Text>
            </View>
            <View style={[s.radio, method === m.id && s.radioOn]}>
              {method === m.id && <View style={s.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={s.splitBtn}
          onPress={() => navigation.navigate('RSVPStep4', { eventId, guestCount, entryFee, paymentMethod: method ?? '' })}
          activeOpacity={0.8}
        >
          <Text style={s.splitText}>Split with friends →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.cta, !method && s.ctaOff]}
          onPress={() => navigation.navigate('RSVPStep5', { eventId, guestCount, paymentMethod: method })}
          disabled={!method}
          activeOpacity={0.88}
        >
          <Text style={s.ctaText}>Pay ₹{total} & Confirm</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </View>
    </View>
  );
}
