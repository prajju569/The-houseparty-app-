import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  TextInput, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../theme/ThemeContext';
import { useAuthStore } from '../../../auth/authStore';
import { createBooking } from '../../../../services/bookingService';
import StepIndicator from './StepIndicator';

export default function RSVPStep2Screen({ route, navigation }: any) {
  const { T } = useTheme();
  const { eventId, guestCount, entryFee = 0 } = route.params ?? {};
  const { profile, session } = useAuthStore();
  const userId = session?.user?.id ?? null;

  const [name, setName]           = useState(profile?.display_name ?? '');
  const [ageConsent, setAge]      = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isFree        = entryFee === 0;
  const needsAge      = false; // age gate TBD — not yet in DB schema
  const totalSteps    = isFree ? 3 : 5;
  const canContinue   = name.trim().length > 0 && (!needsAge || ageConsent);

  const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: T.bg },
    header:  { paddingHorizontal: 22, paddingTop: 12 },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    backTxt: { color: T.text, fontSize: 18 },
    body:   { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 32 },
    title:  { color: T.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
    sub:    { color: T.textMute, fontSize: 13, marginBottom: 28 },
    label:  { color: T.textMute, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },
    input: {
      height: 54, borderRadius: 16, paddingHorizontal: 18,
      backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
      color: T.text, fontSize: 16, marginBottom: 24,
    },
    checkRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: T.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: T.border, marginBottom: 24,
    },
    checkbox: {
      width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: T.border,
      alignItems: 'center', justifyContent: 'center',
    },
    checkboxOn:  { backgroundColor: T.accent, borderColor: T.accent },
    checkmark:   { color: '#090909', fontSize: 13, fontWeight: '700' },
    checkLabel:  { flex: 1, color: T.textSub, fontSize: 13, lineHeight: 19 },
    finePrint:   { color: T.textMute, fontSize: 11, lineHeight: 17, marginBottom: 32 },
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

  async function handleConfirm() {
    if (!canContinue || confirming) return;

    if (isFree) {
      setConfirming(true);
      const { booking, error } = await createBooking(userId, eventId, 'confirmed', guestCount);
      setConfirming(false);
      if (error || !booking) {
        const msg = error?.includes('already') || error?.includes('unique')
          ? 'You already have a booking for this event.'
          : (error ?? 'Something went wrong. Please try again.');
        Alert.alert('Booking failed', msg);
        return;
      }
      navigation.navigate('RSVPStep5', {
        eventId, guestCount, bookingRef: booking.bookingRef, bookingId: booking.id,
      });
    } else {
      navigation.navigate('RSVPStep3', { eventId, guestCount, entryFee });
    }
  }

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
        <StepIndicator current={2} total={totalSteps} T={T} />
        <Text style={s.title}>Your details</Text>
        <Text style={s.sub}>Double-check before locking in your spot</Text>

        <Text style={s.label}>NAME</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={T.textMute}
          autoCapitalize="words"
        />

        {needsAge && (
          <TouchableOpacity style={s.checkRow} onPress={() => setAge(v => !v)} activeOpacity={0.8}>
            <View style={[s.checkbox, ageConsent && s.checkboxOn]}>
              {ageConsent && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.checkLabel}>
              I confirm I'm 18+ years old. Hosts may ask for ID at the door.
            </Text>
          </TouchableOpacity>
        )}

        <Text style={s.finePrint}>
          By confirming you agree to the host's house rules and HouseParty's community guidelines.
          {guestCount > 1 ? ` All ${guestCount} guests must show this booking at the door.` : ''}
        </Text>

        <TouchableOpacity
          style={[s.cta, !canContinue && s.ctaOff]}
          onPress={handleConfirm}
          disabled={!canContinue || confirming}
          activeOpacity={0.88}
        >
          {confirming
            ? <ActivityIndicator color="#090909" />
            : <Text style={s.ctaText}>
                {isFree ? 'Confirm RSVP — Free' : `Continue · ₹${entryFee * guestCount}`}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}
