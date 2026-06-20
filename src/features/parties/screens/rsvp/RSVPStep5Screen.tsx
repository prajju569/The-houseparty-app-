import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Share,
  Platform, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../theme/ThemeContext';
import { useAuthStore } from '../../../auth/authStore';
import { createBooking } from '../../../../services/bookingService';
import { fetchEvent, type Event as SupaEvent } from '../../../../services/eventService';

export default function RSVPStep5Screen({ route, navigation }: any) {
  const { T } = useTheme();
  const { eventId, guestCount, bookingRef: passedRef, bookingId: passedId } = route.params ?? {};
  const { session } = useAuthStore();
  const [eventData, setEventData] = useState<SupaEvent | null>(null);
  const userId = session?.user?.id ?? null;

  const [bookingRef, setBookingRef] = useState<string | null>(passedRef ?? null);
  const [bookingId,  setBookingId]  = useState<string | null>(passedId ?? null);
  const [loading,    setLoading]    = useState(!passedRef);
  const [errorMsg,   setError]      = useState<string | null>(null);

  const scale   = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const booked  = useRef(false);

  useEffect(() => {
    if (eventId) fetchEvent(eventId).then(e => setEventData(e));
    // Paid flow: booking hasn't been created yet — create now
    if (!passedRef && !booked.current) {
      booked.current = true;
      createBooking(userId, eventId, 'confirmed', guestCount).then(({ booking, error }) => {
        if (error || !booking) {
          setError(error?.includes('already') || error?.includes('unique')
            ? 'You already have a booking for this event.'
            : (error ?? 'Something went wrong.'));
          setLoading(false);
          return;
        }
        setBookingRef(booking.bookingRef);
        setBookingId(booking.id);
        setLoading(false);
        animate();
      });
    } else {
      animate();
    }
  }, []);

  function animate() {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }

  const dateStr = eventData?.date
    ? new Date(eventData.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },

    ring: {
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: 'rgba(0,211,127,0.10)',
      borderWidth: 2, borderColor: 'rgba(0,211,127,0.3)',
      alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    emoji: { fontSize: 54 },

    title: {
      color: T.text, fontSize: 30, fontWeight: '800',
      letterSpacing: -0.8, textAlign: 'center', marginBottom: 10,
    },
    sub: {
      color: T.textMute, fontSize: 14, textAlign: 'center',
      lineHeight: 22, marginBottom: 28, maxWidth: 300,
    },

    refCard: {
      backgroundColor: T.card, borderRadius: 20, padding: 20,
      borderWidth: 1, borderColor: T.border, alignItems: 'center',
      marginBottom: 32, width: '100%',
    },
    refLabel: { color: T.textMute, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
    refValue: { color: T.accent, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
    refSub:   { color: T.textMute, fontSize: 11, marginTop: 6 },

    ctaCol: { width: '100%', gap: 12 },
    viewBtn: {
      height: 56, borderRadius: 28, backgroundColor: T.accent,
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        ios:     { shadowColor: T.accent, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 32 },
        android: { elevation: 10 },
      }),
    },
    viewTxt:  { color: '#090909', fontSize: 16, fontWeight: '700' },
    shareBtn: {
      height: 50, borderRadius: 25,
      backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
      alignItems: 'center', justifyContent: 'center',
    },
    shareTxt: { color: T.textSub, fontSize: 15, fontWeight: '600' },
    doneBtn:  { paddingVertical: 12, alignItems: 'center' },
    doneTxt:  { color: T.textMute, fontSize: 14, textDecorationLine: 'underline' },

    errTxt: { color: T.red, fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryBtn: {
      height: 50, borderRadius: 25, backgroundColor: T.card,
      borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center',
    },
    retryTxt: { color: T.textSub, fontSize: 15, fontWeight: '600' },
  });

  if (loading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={T.accent} size="large" />
        <Text style={[s.sub, { marginTop: 16 }]}>Locking in your spot…</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={[s.root, { paddingHorizontal: 28, justifyContent: 'center' }]}>
        <Text style={s.errTxt}>{errorMsg}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => navigation.getParent()?.goBack()}>
          <Text style={s.retryTxt}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.View style={[s.center, { opacity }]}>
        <Animated.View style={[s.ring, { transform: [{ scale }] }]}>
          <Text style={s.emoji}>🎉</Text>
        </Animated.View>

        <Text style={s.title}>You're in!</Text>
        <Text style={s.sub}>
          {guestCount > 1
            ? `${guestCount} spots at ${eventData?.title ?? 'the event'} confirmed. All guests show this ref at the door.`
            : `Your spot at ${eventData?.title ?? 'the event'} is confirmed. Show this ref at the door.`}
        </Text>

        <View style={s.refCard}>
          <Text style={s.refLabel}>BOOKING REF</Text>
          <Text style={s.refValue}>{bookingRef ?? '#HP-0000'}</Text>
          <Text style={s.refSub}>{dateStr}{eventData?.area ? ` · ${eventData.area}` : ''}</Text>
        </View>

        <View style={s.ctaCol}>
          <TouchableOpacity
            style={s.viewBtn}
            onPress={() => navigation.getParent()?.navigate('EventDetail', {
              eventId, alreadyRsvped: true, bookingRef, bookingId,
            })}
            activeOpacity={0.88}
          >
            <Text style={s.viewTxt}>View Ticket →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.shareBtn}
            onPress={() => Share.share({
              message: `locked in for ${eventData?.title ?? 'the event'} 🎟️\n📍 ${eventData?.area ?? ''} · ${dateStr}\nno cap it's gonna be a vibe`,
            })}
            activeOpacity={0.8}
          >
            <Text style={s.shareTxt}>Share the vibe ↗</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.doneBtn} onPress={() => navigation.getParent()?.navigate('Home')}>
            <Text style={s.doneTxt}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
