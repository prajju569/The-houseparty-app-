import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../theme/ThemeContext';
import { fetchEvent, type Event as SupaEvent } from '../../../../services/eventService';
import StepIndicator from './StepIndicator';

const OPTIONS = [
  { n: 1, label: 'Just me' },
  { n: 2, label: '+1 friend' },
  { n: 3, label: '+2 friends' },
  { n: 4, label: '+3 friends' },
];

export default function RSVPStep1Screen({ route, navigation }: any) {
  const { T } = useTheme();
  const { eventId } = route.params ?? {};
  const [event,      setEvent]      = useState<SupaEvent | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [guestCount, setGuestCount] = useState(1);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetchEvent(eventId).then(e => { setEvent(e); setLoading(false); });
  }, [eventId]);

  const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: T.bg },
    cover:   { height: 240, position: 'relative' },
    coverImg: { width: '100%', height: '100%' },
    coverGrad: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9,9,9,0.52)' },
    closeBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center', justifyContent: 'center',
      marginLeft: 16, marginTop: 10,
    },
    closeTxt:    { color: '#F4F2EC', fontSize: 18 },
    coverBottom: { position: 'absolute', bottom: 16, left: 20, right: 20 },
    eventName:   { color: '#F4F2EC', fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
    eventDate:   { color: 'rgba(244,242,236,0.65)', fontSize: 13, marginTop: 2 },
    body:  { flex: 1, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32 },
    title: { color: T.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
    sub:   { color: T.textMute, fontSize: 13, marginBottom: 24 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    option: {
      width: '47%', paddingVertical: 20, borderRadius: 18, alignItems: 'center',
      backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
    },
    optionActive: { backgroundColor: 'rgba(232,227,216,0.10)', borderColor: T.accent },
    optionNum:    { color: T.textMute, fontSize: 26, fontWeight: '700', marginBottom: 4 },
    optionNumActive: { color: T.accent },
    optionLabel:     { color: T.textMute, fontSize: 12, fontWeight: '500' },
    optionLabelActive: { color: T.textSub },
    spotsNote: { color: T.textMute, fontSize: 12, textAlign: 'center', marginBottom: 24 },
    cta: {
      height: 56, borderRadius: 28, backgroundColor: T.accent,
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        ios:     { shadowColor: T.accent, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 32 },
        android: { elevation: 10 },
      }),
    },
    ctaText: { color: '#090909', fontSize: 16, fontWeight: '700' },
  });

  if (loading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={T.accent} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: T.textMute }}>Event not found.</Text>
      </View>
    );
  }

  const spotsLeft  = Math.max(0, event.capacity - (event.booking_count ?? 0));
  const isFree     = event.entry_fee === 0;
  const totalSteps = isFree ? 3 : 5;
  const dateStr    = new Date(event.date).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={s.cover}>
        {event.cover_image
          ? <Image source={{ uri: event.cover_image }} style={s.coverImg} resizeMode="cover" />
          : <View style={[s.coverImg, { backgroundColor: T.elevated }]} />}
        <View style={s.coverGrad} />
        <SafeAreaView edges={['top']}>
          <TouchableOpacity style={s.closeBtn} onPress={() => navigation.getParent()?.goBack()}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
        </SafeAreaView>
        <View style={s.coverBottom}>
          <Text style={s.eventName} numberOfLines={1}>{event.title}</Text>
          <Text style={s.eventDate}>{dateStr}</Text>
        </View>
      </View>

      <View style={s.body}>
        <StepIndicator current={1} total={totalSteps} T={T} />
        <Text style={s.title}>Who's coming?</Text>
        <Text style={s.sub}>Pick your group size — all guests show this booking at the door</Text>

        <View style={s.grid}>
          {OPTIONS.map(({ n, label }) => {
            const disabled = spotsLeft > 0 && n > spotsLeft;
            return (
              <TouchableOpacity
                key={n}
                style={[s.option, guestCount === n && s.optionActive]}
                onPress={() => setGuestCount(n)}
                activeOpacity={0.8}
                disabled={disabled}
              >
                <Text style={[s.optionNum, guestCount === n && s.optionNumActive]}>{n}</Text>
                <Text style={[s.optionLabel, guestCount === n && s.optionLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {spotsLeft > 0 && spotsLeft <= 10 && (
          <Text style={s.spotsNote}>🔥 Only {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left</Text>
        )}

        <TouchableOpacity
          style={s.cta}
          onPress={() => navigation.navigate('RSVPStep2', { eventId, guestCount, entryFee: event.entry_fee, minAge: event.min_age ?? null })}
          activeOpacity={0.88}
        >
          <Text style={s.ctaText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
