import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, Share, Alert, Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot, { ViewShotRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../../../features/auth/authStore';
import { createBooking, checkBooking, cancelBooking } from '../../../services/bookingService';
import { scheduleEventReminders, cancelEventReminders } from '../../../services/notificationService';
import { EVENTS } from '../../../data/fakeData';

const W = Dimensions.get('window').width;

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.15)',
  green: '#00D37F', greenDim: 'rgba(0,211,127,0.15)',
  red: '#FF5A5A', amber: '#F59E0B', amberDim: 'rgba(245,158,11,0.15)',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };
function pad(n: number) { return String(n).padStart(2, '0'); }

// Fix #15: 6-digit verification PIN derived from booking ref (host can verify this)
function getVerificationPin(ref: string): string {
  let hash = 0;
  for (let i = 0; i < ref.length; i++) {
    hash = (hash * 31 + ref.charCodeAt(i)) & 0xffffff;
  }
  return String(hash % 1000000).padStart(6, '0');
}

// Fix #18: Mask booking ref for public share text (show last 2 digits only)
function maskRef(ref: string): string {
  const last2 = ref.slice(-2);
  const prefix = ref.split('-')[0] ?? 'HP';
  return `${prefix}-••••${last2}`;
}

// Fix #14: Deterministic QR-like visual from booking ref
function QRVisual({ bookingRef, size = 80 }: { bookingRef: string; size?: number }) {
  const GRID = 7;
  const cell = size / GRID;

  // Seed a 7x7 binary grid from the ref string
  function seedGrid(ref: string): boolean[][] {
    const grid: boolean[][] = [];
    let seed = 0;
    for (let i = 0; i < ref.length; i++) seed = (seed * 37 + ref.charCodeAt(i)) & 0xffff;
    for (let r = 0; r < GRID; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID; c++) {
        seed = (seed * 1664525 + 1013904223) & 0xffff;
        grid[r][c] = seed % 3 !== 0;
      }
    }
    // Force position-detection markers (top-left, top-right, bottom-left corners)
    const corners: [number, number][] = [[0,0],[0,1],[1,0],[1,1],[0,5],[0,6],[1,5],[1,6],[5,0],[5,1],[6,0],[6,1]];
    corners.forEach(([r, c]) => { grid[r][c] = true; });
    return grid;
  }

  const grid = seedGrid(bookingRef);

  return (
    <View style={{ width: size, height: size, borderWidth: 2, borderColor: T.gold, borderRadius: 6, padding: 3, backgroundColor: '#fff' }}>
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((filled, c) => (
            <View
              key={c}
              style={{
                width: cell - 0.5,
                height: cell - 0.5,
                backgroundColor: filled ? '#000' : '#fff',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Countdown timer ───────────────────────────────────────────────────────────
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [t, setT] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setT({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <View style={ct.wrap}>
      <Text style={ct.label}>EVENT STARTS IN</Text>
      <View style={ct.row}>
        {[{ v: t.days, u: 'DAYS' }, { v: t.hours, u: 'HRS' }, { v: t.minutes, u: 'MIN' }, { v: t.seconds, u: 'SEC' }].map(({ v, u }, i) => (
          <React.Fragment key={u}>
            {i > 0 && <Text style={ct.colon}>:</Text>}
            <View style={ct.unit}>
              <Text style={ct.num}>{pad(v)}</Text>
              <Text style={ct.unitLabel}>{u}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const ct = StyleSheet.create({
  wrap: {
    backgroundColor: T.elevated, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: T.border, alignItems: 'center', marginBottom: 20,
  },
  label: { color: T.textMute, fontSize: 10, fontWeight: '600', letterSpacing: 1.4, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unit: { alignItems: 'center', minWidth: 56 },
  num: { color: T.gold, fontSize: 36, fontWeight: '700', fontVariant: ['tabular-nums'] },
  unitLabel: { color: T.textMute, fontSize: 9, fontWeight: '600', letterSpacing: 1, marginTop: 2 },
  colon: { color: T.textMute, fontSize: 28, fontWeight: '700', marginBottom: 14 },
});

// ── Amenity pill ──────────────────────────────────────────────────────────────
function AmenityPill({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <View style={[am.pill, active ? am.active : am.inactive]}>
      <Text style={am.icon}>{icon}</Text>
      <Text style={[am.label, active ? am.activeLabel : am.inactiveLabel]}>{label}</Text>
    </View>
  );
}

const am = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  active:        { backgroundColor: 'rgba(0,211,127,0.1)', borderColor: 'rgba(0,211,127,0.3)' },
  inactive:      { backgroundColor: T.elevated, borderColor: T.border },
  icon:          { fontSize: 14 },
  label:         { fontSize: 12, fontWeight: '500' },
  activeLabel:   { color: T.green },
  inactiveLabel: { color: T.textMute },
});

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <Text key={n} style={{ color: n <= Math.round(rating) ? T.gold : T.border, fontSize: 14 }}>★</Text>
      ))}
    </View>
  );
}

// Fix #17: Guest count picker (+1 to +4)
function GuestCountPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={gc.wrap}>
      <Text style={gc.label}>GUESTS (incl. you)</Text>
      <View style={gc.row}>
        {[1, 2, 3, 4].map(n => (
          <TouchableOpacity
            key={n}
            style={[gc.btn, value === n && gc.btnActive]}
            onPress={() => onChange(n)}
            activeOpacity={0.75}
          >
            <Text style={[gc.btnText, value === n && gc.btnTextActive]}>
              {n === 1 ? 'Just me' : `+${n - 1}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {value > 1 && (
        <Text style={gc.note}>All {value} guests must show this booking ref at the door</Text>
      )}
    </View>
  );
}

const gc = StyleSheet.create({
  wrap: {
    backgroundColor: T.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: T.border, marginBottom: 16,
  },
  label: { color: T.textMute, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 12 },
  row:   { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: T.border,
    backgroundColor: T.elevated, alignItems: 'center',
  },
  btnActive:     { backgroundColor: T.goldDim, borderColor: 'rgba(201,168,76,0.5)' },
  btnText:       { color: T.textMute, fontSize: 13, fontWeight: '600' },
  btnTextActive: { color: T.gold, fontWeight: '700' },
  note: { color: T.textMute, fontSize: 11, marginTop: 10, textAlign: 'center' },
});

// Fix #19: Attendee count display
function WhoIsGoingBar({ event }: { event: typeof EVENTS[0] }) {
  const going = event.spotsTotal - event.spotsLeft;
  const pct = Math.min(going / event.spotsTotal, 1);

  return (
    <View style={wi.wrap}>
      <View style={wi.top}>
        <Text style={wi.label}>WHO'S GOING</Text>
        <Text style={wi.count}>{going} / {event.spotsTotal} spots taken</Text>
      </View>
      <View style={wi.bar}>
        <View style={[wi.fill, { width: `${pct * 100}%` as any }]} />
      </View>
      <Text style={wi.sub}>
        {going === 0
          ? 'Be the first to RSVP!'
          : going < 5
          ? `${going} people going so far — still early!`
          : going >= event.spotsTotal * 0.8
          ? `🔥 Almost full — ${event.spotsLeft} spots left`
          : `${going} people going`}
      </Text>
    </View>
  );
}

const wi = StyleSheet.create({
  wrap: {
    backgroundColor: T.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: T.border, marginBottom: 16,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { color: T.textMute, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  count: { color: T.textSub, fontSize: 12, fontWeight: '600' },
  bar: {
    height: 6, backgroundColor: T.elevated, borderRadius: 3,
    overflow: 'hidden', marginBottom: 8,
  },
  fill: { height: '100%', backgroundColor: T.gold, borderRadius: 3 },
  sub: { color: T.textMute, fontSize: 12 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function EventDetailScreen({ route, navigation }: any) {
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? null;

  const eventId       = route?.params?.eventId ?? 'e1';
  const alreadyRsvped = route?.params?.alreadyRsvped ?? false;
  const passedRef     = route?.params?.bookingRef ?? null;
  const passedId      = route?.params?.bookingId ?? null;

  const event = EVENTS.find(e => e.id === eventId) ?? EVENTS[0];

  const [rsvped,      setRsvped]      = useState(alreadyRsvped);
  const [bookingRef,  setBookingRef]  = useState<string | null>(passedRef);
  const [bookingId,   setBookingId]   = useState<string | null>(passedId);
  const rsvpingRef                    = useRef(false); // Fix #20: ref prevents double-tap race
  const [rsvping,     setRsvping]     = useState(false);
  const [cancelling,  setCancelling]  = useState(false);
  const [activeTab,   setActiveTab]   = useState<'details' | 'playlist'>('details');
  const [guestCount,  setGuestCount]  = useState(1); // Fix #17

  const ticketRef = useRef<ViewShotRef>(null);
  const eventDate = new Date(event.date);
  const dateStr   = eventDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr   = eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const isFull    = event.spotsLeft === 0;
  // Fix #13: almost-full nudge threshold
  const isAlmostFull = !isFull && event.spotsLeft > 0 && event.spotsLeft <= 5;
  // Cancellation allowed only >24h before event
  const cancellable = eventDate.getTime() - Date.now() > 24 * 60 * 60 * 1000;

  // Check existing booking on mount
  useEffect(() => {
    if (alreadyRsvped) return;
    checkBooking(userId, eventId).then(b => {
      if (b) { setRsvped(true); setBookingRef(b.bookingRef); setBookingId(b.id); }
    });
  }, [eventId]);

  async function handleRSVP() {
    // Fix #20: ref-based guard prevents double-tap race before first re-render
    if (rsvped || rsvpingRef.current) return;
    rsvpingRef.current = true;
    setRsvping(true);

    if (isFull) {
      rsvpingRef.current = false;
      setRsvping(false);
      Alert.alert(
        'Join Waitlist',
        `You'll be notified if a spot opens for ${event.title}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Join Waitlist', onPress: () => doBook('waitlist') },
        ]
      );
      return;
    }
    doBook('confirmed');
  }

  async function doBook(status: 'confirmed' | 'waitlist') {
    rsvpingRef.current = true;
    setRsvping(true);

    const { booking, error } = await createBooking(userId, eventId, status, guestCount);

    rsvpingRef.current = false;
    setRsvping(false);

    if (error || !booking) {
      // Fix #22: show clear sold-out conflict message
      const msg = error?.includes('already') || error?.includes('unique')
        ? 'You already have a booking for this event.'
        : (error ?? 'Something went wrong. Please try again.');
      Alert.alert('Booking failed', msg);
      return;
    }

    setRsvped(true);
    setBookingRef(booking.bookingRef);
    setBookingId(booking.id);

    // Fix #10: schedule local reminders after confirmed booking
    if (status === 'confirmed') {
      scheduleEventReminders({
        bookingRef: booking.bookingRef,
        eventTitle: event.title,
        eventDate: event.date,
        area: event.area,
      }).catch(() => {});

      Alert.alert(
        "🎉 You're in!",
        `RSVP confirmed for ${event.title}.\nBooking ID: ${booking.bookingRef}\n\nWe'll remind you the night before and 1 hour before the event.`
      );
    } else {
      Alert.alert(
        "📋 Waitlist joined",
        `We'll notify you if a spot opens for ${event.title}.\nRef: ${booking.bookingRef}`
      );
    }
  }

  async function handleShareTicket() {
    try {
      const uri = await (ticketRef.current as any).capture();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your ticket' });
      } else {
        // Fix #18: mask full booking ref in text share for privacy
        Share.share({ message: `locked in for ${event.title} no cap 🎟️ ${maskRef(bookingRef ?? '')}` });
      }
    } catch {
      Share.share({ message: `locked in for ${event.title} no cap 🎟️ ${maskRef(bookingRef ?? '')}` });
    }
  }

  function handleShare() {
    Share.share({
      message: `just copped my ticket to ${event.title} 🎟️\n📍 ${event.area} · ${dateStr}\nit's giving main character energy fr`,
    });
  }

  function handleCancelRSVP() {
    if (!cancellable) {
      Alert.alert(
        '🔒 Cancellation closed',
        'We no longer accept cancellations within 24 hours of the event.\n\nFor emergencies, message the host directly.',
        [{ text: 'OK' }]
      );
      return;
    }

    const feeNote = event.fee > 0
      ? `\n\n⚠️ Entry fee of ₹${event.fee} is non-refundable.`
      : '\n\nThis event is free — no charges apply.';

    Alert.alert(
      'Cancel your RSVP?',
      `You are about to cancel "${event.title}" on ${dateStr}.${feeNote}\n\nYour spot will be released to the waitlist.`,
      [
        { text: 'Keep RSVP', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const { error } = await cancelBooking(userId, bookingId!);
            setCancelling(false);
            if (error) { Alert.alert('Error', error); return; }
            // Fix #10: cancel scheduled reminders when RSVP cancelled
            if (bookingRef) await cancelEventReminders(bookingRef).catch(() => {});
            setRsvped(false);
            setBookingRef(null);
            setBookingId(null);
            Alert.alert('RSVP cancelled', 'Your spot has been released.');
          },
        },
      ]
    );
  }

  const displayRef = bookingRef ?? '#HP-0000';
  const verifyPin  = bookingRef ? getVerificationPin(bookingRef) : '------';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Cover image */}
      <View style={s.cover}>
        <Image source={{ uri: event.coverImage }} style={s.coverImg} resizeMode="cover" />
        <View style={s.coverOverlay} />
        <SafeAreaView edges={['top']} style={s.coverActions}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
            <Text style={s.shareIcon}>↑</Text>
          </TouchableOpacity>
        </SafeAreaView>
        <View style={s.coverBadge}>
          {event.host.verified && (
            <View style={s.verifiedBadge}>
              <Text style={s.verifiedText}>✓ VERIFIED HOST</Text>
            </View>
          )}
          {/* Fix #13: almost-full badge on cover */}
          {isAlmostFull && (
            <View style={s.almostFullBadge}>
              <Text style={s.almostFullText}>🔥 {event.spotsLeft} SPOTS LEFT</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          {/* Title */}
          <View style={s.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.eventDate}>{dateStr.toUpperCase()} · {timeStr}</Text>
              <Text style={s.eventTitle}>{event.title}</Text>
            </View>
          </View>

          {/* ── CONFIRMED TICKET ─────────────────────────── */}
          {rsvped ? (
            <>
              <ViewShot ref={ticketRef} options={{ format: 'png', quality: 1 }} style={s.ticketCard}>
                <View style={s.ticketCoverWrap}>
                  <Image source={{ uri: event.coverImage }} style={s.ticketCoverImg} resizeMode="cover" />
                  <View style={s.ticketCoverOverlay} />
                  <View style={s.ticketCoverTop}>
                    <View style={s.ticketConfirmedBadge}>
                      <Text style={s.ticketConfirmedDot}>✓</Text>
                      <Text style={s.ticketConfirmedLabel}>YOU'RE IN</Text>
                    </View>
                    <Text style={s.ticketBrandText}>houseparty ✦</Text>
                  </View>
                  <View style={s.ticketCoverBottom}>
                    <Text style={s.ticketEventLabel}>YOUR TICKET</Text>
                    <Text style={s.ticketEventName}>{event.title}</Text>
                    <Text style={s.ticketEventDate}>{dateStr} · {timeStr}</Text>
                    <Text style={s.ticketEventVenue}>📍 {event.area}, {event.city}</Text>
                  </View>
                </View>

                {/* Perforated tear line */}
                <View style={s.ticketPerf}>
                  <View style={s.perfNubL} />
                  <View style={s.perfDashes} />
                  <View style={s.perfNubR} />
                </View>

                {/* Fix #14 & #15: QR visual + booking info row */}
                <View style={s.ticketIdRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.ticketIdLabel}>BOOKING ID</Text>
                    <Text style={s.ticketIdValue}>{displayRef}</Text>
                    {/* Fix #15: verification PIN */}
                    <Text style={s.verifyPinLabel}>VERIFY PIN</Text>
                    <Text style={s.verifyPinValue}>{verifyPin}</Text>
                  </View>
                  {/* Fix #14: QR-code visual */}
                  <QRVisual bookingRef={displayRef} size={80} />
                </View>

                {/* Meta row */}
                <View style={s.ticketMetaRow}>
                  <View style={s.ticketMetaCol}>
                    <Text style={s.ticketMetaLabel}>ENTRY</Text>
                    <Text style={s.ticketMetaValue}>{event.fee === 0 ? 'Free' : `₹${event.fee}`}</Text>
                  </View>
                  <View style={[s.ticketMetaCol, { borderLeftWidth: 1, borderLeftColor: T.border }]}>
                    <Text style={s.ticketMetaLabel}>AGE</Text>
                    <Text style={s.ticketMetaValue}>{event.ageMin}–{event.ageMax}</Text>
                  </View>
                  <View style={[s.ticketMetaCol, { borderLeftWidth: 1, borderLeftColor: T.border }]}>
                    <Text style={s.ticketMetaLabel}>GUESTS</Text>
                    <Text style={s.ticketMetaValue}>{guestCount}</Text>
                  </View>
                </View>

                {/* Host row */}
                <TouchableOpacity
                  style={s.ticketHostRow}
                  onPress={() => navigation.navigate('Chat', { hostId: event.host.id })}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: event.host.avatar }} style={s.ticketHostAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.ticketHostLabel}>Hosted by</Text>
                    <Text style={s.ticketHostName}>{event.host.name}</Text>
                  </View>
                  <View style={s.ticketChatChip}>
                    <Text style={s.ticketChatText}>💬 Message Host</Text>
                  </View>
                </TouchableOpacity>
              </ViewShot>

              {/* Cancel RSVP link */}
              <TouchableOpacity
                style={s.cancelLink}
                onPress={handleCancelRSVP}
                disabled={cancelling}
                activeOpacity={0.7}
              >
                {cancelling
                  ? <ActivityIndicator color={T.textMute} size="small" />
                  : <Text style={s.cancelLinkText}>
                      {cancellable ? 'Cancel RSVP' : '🔒 Cancellation closed (< 24h)'}
                    </Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={s.hostRow}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Chat', { hostId: event.host.id })}
              >
                <Image source={{ uri: event.host.avatar }} style={s.hostAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={s.hostedBy}>Hosted by</Text>
                  <Text style={s.hostName}>{event.host.name}</Text>
                  <StarRating rating={event.host.rating} />
                </View>
                <View style={s.chatChip}>
                  <Text style={s.chatChipText}>💬 Chat</Text>
                </View>
              </TouchableOpacity>

              <View style={s.statsRow}>
                <View style={s.stat}>
                  <Text style={s.statVal}>{event.fee === 0 ? 'Free' : `₹${event.fee}`}</Text>
                  <Text style={s.statLabel}>ENTRY</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.stat}>
                  <Text style={[s.statVal, isFull && { color: T.red }, isAlmostFull && { color: T.amber }]}>
                    {isFull ? 'FULL' : event.spotsLeft}
                  </Text>
                  <Text style={s.statLabel}>SPOTS LEFT</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.stat}>
                  <Text style={s.statVal}>{event.ageMin}–{event.ageMax}</Text>
                  <Text style={s.statLabel}>AGE GROUP</Text>
                </View>
              </View>

              {/* Fix #19: Who's going */}
              <WhoIsGoingBar event={event} />

              {/* Fix #17: Guest count picker */}
              {!isFull && <GuestCountPicker value={guestCount} onChange={setGuestCount} />}
            </>
          )}

          {/* Countdown — only before event */}
          {new Date(event.date).getTime() > Date.now() && (
            <CountdownTimer targetDate={event.date} />
          )}

          {/* Metro */}
          <View style={s.metroCard}>
            <Text style={s.metroIcon}>🚇</Text>
            <View>
              <Text style={s.metroName}>{event.metro} Station</Text>
              <Text style={s.metroDist}>{event.metroDistance} walk · {event.area}, {event.city}</Text>
            </View>
          </View>

          {/* Amenities */}
          <View style={s.amenities}>
            <AmenityPill icon="🍻" label="Alcohol"  active={event.alcohol} />
            <AmenityPill icon="🚬" label="Smoking"  active={event.smoking} />
            <AmenityPill icon="🐾" label="Pets OK"  active={event.pets} />
            <AmenityPill icon="🍕" label="Food"     active={event.food} />
            <AmenityPill icon="❄️" label="AC"        active={event.ac} />
            <AmenityPill icon="📶" label="WiFi"     active={event.wifi} />
          </View>

          {/* Detail / Playlist tabs */}
          <View style={s.tabs}>
            {(['details', 'playlist'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[s.tab, activeTab === tab && s.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                  {tab === 'details' ? 'Details' : `Playlist (${event.playlist.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'details' ? (
            <View>
              <Text style={s.description}>{event.description}</Text>
              <View style={s.tagRow}>
                {event.tags.map(tag => (
                  <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
                ))}
              </View>
              {event.photos.length > 0 && (
                <View>
                  <Text style={s.sectionLabel}>PHOTOS</Text>
                  <View style={s.photoGrid}>
                    {event.photos.slice(0, 4).map((uri, i) => (
                      <Image key={i} source={{ uri }} style={s.photoThumb} />
                    ))}
                  </View>
                  {event.photos.length > 4 && (
                    <TouchableOpacity onPress={() => navigation.navigate('Gallery', { eventId: event.id })}>
                      <Text style={s.viewAllPhotos}>View all {event.photos.length} photos →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={s.playlistList}>
              {event.playlist.map((track, i) => (
                <View key={i} style={s.trackRow}>
                  <Text style={s.trackNum}>{String(i + 1).padStart(2, '0')}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.trackTitle}>{track.title}</Text>
                    <Text style={s.trackArtist}>{track.artist}</Text>
                  </View>
                  <Text style={s.trackDur}>{track.duration}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={s.cta}>
        {rsvped ? (
          <TouchableOpacity style={s.shareTicketBtn} onPress={handleShareTicket} activeOpacity={0.85}>
            <Text style={s.shareTicketText}>↑  flex on the feed — share ticket</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.ctaInner}>
            <View>
              <Text style={s.ctaFee}>{event.fee === 0 ? 'Free Entry' : `₹${event.fee}`}</Text>
              {/* Fix #13: almost-full CTA text */}
              <Text style={[s.ctaSpots, isFull && { color: T.red }, isAlmostFull && { color: T.amber }]}>
                {isFull
                  ? 'Event full · Waitlist open'
                  : isAlmostFull
                  ? `🔥 Only ${event.spotsLeft} spots left!`
                  : `${event.spotsLeft} spots left`}
              </Text>
            </View>
            <TouchableOpacity
              style={[s.rsvpBtn, isFull ? s.rsvpBtnWaitlist : s.rsvpBtnNow, rsvping && { opacity: 0.7 }]}
              onPress={handleRSVP}
              disabled={rsvping}
              activeOpacity={0.85}
            >
              {rsvping ? (
                <ActivityIndicator color={isFull ? T.textSub : '#000'} />
              ) : (
                <Text style={[s.rsvpText, isFull && s.rsvpTextWaitlist]}>
                  {isFull ? 'Join Waitlist' : guestCount > 1 ? `RSVP for ${guestCount}  →` : 'RSVP Now  →'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  cover: { height: 280, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  coverOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  coverActions: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  backIcon:  { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
  shareBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  shareIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
  coverBadge:  { position: 'absolute', bottom: 16, left: 20, flexDirection: 'row', gap: 8 },
  verifiedBadge: {
    backgroundColor: 'rgba(0,211,127,0.2)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(0,211,127,0.4)',
  },
  verifiedText: { color: T.green, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  almostFullBadge: {
    backgroundColor: 'rgba(245,158,11,0.25)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.5)',
  },
  almostFullText: { color: T.amber, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  scroll: { flex: 1 },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', marginBottom: 16 },
  eventDate:  { color: T.gold, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, marginBottom: 4 },
  eventTitle: { color: T.text, fontSize: 26, fontWeight: '800', lineHeight: 32 },

  hostRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: T.border, marginBottom: 16,
  },
  hostAvatar:  { width: 48, height: 48, borderRadius: 24, backgroundColor: T.elevated },
  hostedBy:    { color: T.textMute, fontSize: 11, marginBottom: 2 },
  hostName:    { color: T.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  chatChip:    {
    backgroundColor: T.goldDim, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  chatChipText: { color: T.gold, fontSize: 13, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', backgroundColor: T.card,
    borderRadius: 16, borderWidth: 1, borderColor: T.border,
    marginBottom: 16, overflow: 'hidden',
  },
  stat:        { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statVal:     { color: T.text, fontSize: 18, fontWeight: '700', marginBottom: 2 },
  statLabel:   { color: T.textMute, fontSize: 9, fontWeight: '600', letterSpacing: 1 },
  statDivider: { width: 1, backgroundColor: T.border, marginVertical: 12 },

  metroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: T.border, marginBottom: 16,
  },
  metroIcon: { fontSize: 24 },
  metroName: { color: T.text, fontSize: 14, fontWeight: '600' },
  metroDist: { color: T.textSub, fontSize: 12, marginTop: 2 },

  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },

  tabs: {
    flexDirection: 'row', gap: 4,
    backgroundColor: T.elevated, borderRadius: 12, padding: 4,
    marginBottom: 16, borderWidth: 1, borderColor: T.border,
  },
  tab:          { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabActive:    { backgroundColor: T.card },
  tabText:      { color: T.textMute, fontSize: 13, fontWeight: '600' },
  tabTextActive:{ color: T.text },

  description: { color: T.textSub, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  tagRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag:         {
    backgroundColor: T.elevated, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: T.border,
  },
  tagText:     { color: T.textSub, fontSize: 12 },
  sectionLabel:{
    color: T.textMute, fontSize: 11, fontWeight: '600',
    letterSpacing: 1.4, marginBottom: 12, marginTop: 4,
  },
  photoGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  photoThumb:  { width: '48.5%', aspectRatio: 1, borderRadius: 12, backgroundColor: T.elevated },
  viewAllPhotos:{ color: T.gold, fontSize: 13, fontWeight: '600', marginTop: 4 },

  playlistList: { gap: 2 },
  trackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  trackNum:    { color: T.textMute, fontSize: 12, width: 24, textAlign: 'center' },
  trackTitle:  { color: T.text, fontSize: 14, fontWeight: '600' },
  trackArtist: { color: T.textSub, fontSize: 12, marginTop: 2 },
  trackDur:    { color: T.textMute, fontSize: 12 },

  // ── Confirmed ticket ──────────────────────────────────────────────────────
  ticketCard: {
    backgroundColor: T.card, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)',
    marginBottom: 12, overflow: 'hidden',
  },
  ticketCoverWrap:    { height: 190, position: 'relative' },
  ticketCoverImg:     { width: '100%', height: '100%' },
  ticketCoverOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.52)' },
  ticketCoverTop: {
    position: 'absolute', top: 14, left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  ticketConfirmedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,211,127,0.18)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(0,211,127,0.45)',
  },
  ticketConfirmedDot:   { color: T.green, fontSize: 11, fontWeight: '800' },
  ticketConfirmedLabel: { color: T.green, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  ticketBrandText:      { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  ticketCoverBottom:    { position: 'absolute', bottom: 14, left: 16, right: 16 },
  ticketEventLabel:     { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  ticketEventName:      { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4, lineHeight: 26 },
  ticketEventDate:      { color: T.gold, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  ticketEventVenue:     { color: 'rgba(255,255,255,0.65)', fontSize: 12 },

  ticketPerf:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: -1 },
  perfNubL:    { width: 20, height: 20, borderRadius: 10, backgroundColor: T.bg, marginLeft: -10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  perfDashes:  { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', marginHorizontal: 6 },
  perfNubR:    { width: 20, height: 20, borderRadius: 10, backgroundColor: T.bg, marginRight: -10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },

  ticketIdRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 16 },
  ticketIdLabel:    { color: T.textMute, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  ticketIdValue:    { color: T.gold, fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  verifyPinLabel:   { color: T.textMute, fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginTop: 10, marginBottom: 3 },
  verifyPinValue:   { color: T.textSub, fontSize: 16, fontWeight: '800', letterSpacing: 3, fontVariant: ['tabular-nums'] },

  ticketMetaRow:  { flexDirection: 'row', borderTopWidth: 1, borderTopColor: T.border },
  ticketMetaCol:  { flex: 1, alignItems: 'center', paddingVertical: 12 },
  ticketMetaLabel:{ color: T.textMute, fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  ticketMetaValue:{ color: T.text, fontSize: 15, fontWeight: '800' },

  ticketHostRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.elevated, paddingHorizontal: 18, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  ticketHostAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.card },
  ticketHostLabel:  { color: T.textMute, fontSize: 10, marginBottom: 2 },
  ticketHostName:   { color: T.text, fontSize: 13, fontWeight: '700' },
  ticketChatChip:   {
    backgroundColor: T.goldDim, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  ticketChatText:   { color: T.gold, fontSize: 12, fontWeight: '600' },

  cancelLink:     { alignItems: 'center', paddingVertical: 10, marginBottom: 16 },
  cancelLinkText: { color: T.textMute, fontSize: 13, textDecorationLine: 'underline' },

  // ── Sticky CTA ────────────────────────────────────────────────────────────
  cta: {
    backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.border,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 16 : 34,
    paddingTop: 14,
  },
  ctaInner:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctaFee:       { color: T.text, fontSize: 20, fontWeight: '800' },
  ctaSpots:     { color: T.textMute, fontSize: 12, marginTop: 2 },
  shareTicketBtn: {
    backgroundColor: T.gold, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  shareTicketText: { color: '#000', fontSize: 15, fontWeight: '700' },
  rsvpBtn:        { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, minWidth: 140, alignItems: 'center' },
  rsvpBtnNow:     { backgroundColor: T.gold },
  rsvpBtnWaitlist:{ backgroundColor: 'transparent', borderWidth: 1, borderColor: T.border },
  rsvpText:       { color: '#000', fontSize: 15, fontWeight: '700' },
  rsvpTextWaitlist:{ color: T.textSub },
});
