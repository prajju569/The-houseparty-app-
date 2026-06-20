import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, Share, Alert, Platform, Dimensions, ActivityIndicator, Linking, FlatList,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ViewShot, { ViewShotRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../../../features/auth/authStore';
import { createBooking, checkBooking, cancelBooking } from '../../../services/bookingService';
import { computeAge } from '../../../shared/utils/age';
import { cancelEventReminders } from '../../../services/notificationService';
import { fetchEvent, type Event as SupaEvent } from '../../../services/eventService';
import { supabase } from '../../../services/supabaseClient';
import { useTheme } from '../../../theme/ThemeContext';

const W = Dimensions.get('window').width;

// ── Helpers ───────────────────────────────────────────────────────────────────
type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };
function pad(n: number) { return String(n).padStart(2, '0'); }

function getVerificationPin(ref: string): string {
  let hash = 0;
  for (let i = 0; i < ref.length; i++) {
    hash = (hash * 31 + ref.charCodeAt(i)) & 0xffffff;
  }
  return String(hash % 1000000).padStart(6, '0');
}

function maskRef(ref: string): string {
  const last2 = ref.slice(-2);
  const prefix = ref.split('-')[0] ?? 'HP';
  return `${prefix}-••••${last2}`;
}

function QRVisual({ bookingRef, size = 80 }: { bookingRef: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 6, overflow: 'hidden', backgroundColor: '#fff', padding: 4 }}>
      <QRCode value={bookingRef} size={size - 8} color="#090909" backgroundColor="#ffffff" />
    </View>
  );
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const { T } = useTheme();
  const [t, setT] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const ct = StyleSheet.create({
    wrap: {
      backgroundColor: T.elevated, borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: T.border, alignItems: 'center', marginBottom: 20,
    },
    label:     { color: T.textMute, fontSize: 10, fontWeight: '600', letterSpacing: 1.4, marginBottom: 14 },
    row:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
    unit:      { alignItems: 'center', minWidth: 56 },
    num:       { color: T.gold, fontSize: 36, fontWeight: '700', fontVariant: ['tabular-nums'] },
    unitLabel: { color: T.textMute, fontSize: 9, fontWeight: '600', letterSpacing: 1, marginTop: 2 },
    colon:     { color: T.textMute, fontSize: 28, fontWeight: '700', marginBottom: 14 },
  });

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

function AmenityPill({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  const { T } = useTheme();
  const am = StyleSheet.create({
    pill:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    active:        { backgroundColor: 'rgba(0,211,127,0.1)', borderColor: 'rgba(0,211,127,0.3)' },
    inactive:      { backgroundColor: T.elevated, borderColor: T.border },
    icon:          { fontSize: 14 },
    label:         { fontSize: 12, fontWeight: '500' },
    activeLabel:   { color: T.green },
    inactiveLabel: { color: T.textMute },
  });
  return (
    <View style={[am.pill, active ? am.active : am.inactive]}>
      <Text style={am.icon}>{icon}</Text>
      <Text style={[am.label, active ? am.activeLabel : am.inactiveLabel]}>{label}</Text>
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  const { T } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <Text key={n} style={{ color: n <= Math.round(rating) ? T.gold : T.border, fontSize: 14 }}>★</Text>
      ))}
    </View>
  );
}

function GuestCountPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { T } = useTheme();
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
    btnActive:     { backgroundColor: T.goldDim, borderColor: 'rgba(232,227,216,0.35)' },
    btnText:       { color: T.textMute, fontSize: 13, fontWeight: '600' },
    btnTextActive: { color: T.gold, fontWeight: '700' },
    note:          { color: T.textMute, fontSize: 11, marginTop: 10, textAlign: 'center' },
  });
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

function WhoIsGoingBar({ event }: { event: SupaEvent }) {
  const { T } = useTheme();
  const wi = StyleSheet.create({
    wrap: {
      backgroundColor: T.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: T.border, marginBottom: 16,
    },
    top:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    label: { color: T.textMute, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
    count: { color: T.textSub, fontSize: 12, fontWeight: '600' },
    bar:   { height: 6, backgroundColor: T.elevated, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    fill:  { height: '100%', backgroundColor: T.gold, borderRadius: 3 },
    sub:   { color: T.textMute, fontSize: 12 },
  });
  const going = event.booking_count ?? 0;
  const pct = Math.min(going / (event.capacity || 1), 1);
  const spotsLeft = Math.max(0, event.capacity - going);

  return (
    <View style={wi.wrap}>
      <View style={wi.top}>
        <Text style={wi.label}>WHO'S GOING</Text>
        <Text style={wi.count}>{going} / {event.capacity} spots taken</Text>
      </View>
      <View style={wi.bar}>
        <View style={[wi.fill, { width: `${pct * 100}%` as any }]} />
      </View>
      <Text style={wi.sub}>
        {going === 0
          ? 'Be the first to RSVP!'
          : going < 5
          ? `${going} people going so far — still early!`
          : pct >= 0.8
          ? `🔥 Almost full — ${spotsLeft} spots left`
          : `${going} people going`}
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function EventDetailScreen({ route, navigation }: any) {
  const { T } = useTheme();
  const { session, profile } = useAuthStore();
  const userId = session?.user?.id ?? null;

  const eventId       = route?.params?.eventId;
  const alreadyRsvped = route?.params?.alreadyRsvped ?? false;
  const passedRef     = route?.params?.bookingRef ?? null;
  const passedId      = route?.params?.bookingId ?? null;

  const [event,      setEvent]      = useState<SupaEvent | null>(null);
  const [hostProfile, setHostProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [rsvped,     setRsvped]     = useState(alreadyRsvped);
  const [bookingRef, setBookingRef] = useState<string | null>(passedRef);
  const [bookingId,  setBookingId]  = useState<string | null>(passedId);
  const [cancelling,    setCancelling]    = useState(false);
  const [activeTab,     setActiveTab]     = useState<'details' | 'playlist'>('details');
  const [guestFaces,    setGuestFaces]    = useState<{ initials: string; color: string; score?: number }[]>([]);
  const [vibeScore,     setVibeScore]     = useState<number | null>(null);
  const [followingHost, setFollowingHost] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isInviteOnly = (event as any)?.isInviteOnly ?? false;

  const FACE_COLORS = ['#E8A87C', '#85C1E9', '#82E0AA', '#F1948A', '#C39BD3'];

  // Load real event from Supabase
  useEffect(() => {
    if (!eventId) { setLoadingEvent(false); return; }
    fetchEvent(eventId).then(ev => {
      setEvent(ev);
      setLoadingEvent(false);
      if (ev?.host_id) {
        supabase.from('public_profiles').select('display_name, avatar_url').eq('id', ev.host_id).single()
          .then(({ data }) => { if (data) setHostProfile(data as any); });
      }
    });
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    // Fetch social proof circles + vibe score
    Promise.all([
      import('../../../services/eventService').then(m => m.fetchEventBookings(eventId)),
      userId ? supabase.from('profiles').select('top_genres,vibe_tags,top_artists').eq('id', userId).single()
             : Promise.resolve(null),
    ]).then(([bookings, myProfileRes]) => {
      const myProfile = (myProfileRes as any)?.data ?? null;
      const faces = bookings
        .filter((b: any) => b.status !== 'cancelled' && b.profiles)
        .slice(0, 3)
        .map((b: any, i: number) => {
          const name = b.profiles?.display_name ?? b.profiles?.username ?? '?';
          const initials = name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
          return { initials, color: FACE_COLORS[i % FACE_COLORS.length] };
        });
      setGuestFaces(faces);

      if (myProfile && event && (myProfile.top_genres?.length || myProfile.vibe_tags?.length)) {
        import('../../../services/vibeService').then(({ computeVibeScore }) => {
          const eventAsProfile = {
            id: '', username: '', display_name: '', role: 'guest' as const,
            top_genres: event.vibe ?? [],
            vibe_tags:  event.vibe ?? [],
            top_artists: [],
          };
          const score = computeVibeScore(myProfile, eventAsProfile);
          setVibeScore(score);
        });
      }
    }).catch(() => {});
  }, [eventId, userId, event]);

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },

    heroImg: { position: 'absolute', top: 0, left: 0, right: 0, height: 460 },
    heroGrad: {
      position: 'absolute', top: 0, left: 0, right: 0, height: 460,
      backgroundColor: 'rgba(9,9,9,0.45)',
    },

    scroll: { flex: 1 },

    infoCard: {
      marginHorizontal: 0,
      backgroundColor: T.bg,
      borderTopLeftRadius: 30, borderTopRightRadius: 30,
      borderWidth: 1, borderBottomWidth: 0,
      borderColor: 'rgba(255,255,255,0.10)',
      paddingHorizontal: 22, paddingTop: 22, paddingBottom: 0,
      ...Platform.select({
        ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.7, shadowRadius: 50 },
        android: { elevation: 28 },
      }),
    },

    tagsRow:       { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
    tagChamp:      { backgroundColor: 'rgba(232,227,216,0.14)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    tagChampText:  { color: T.accent, fontSize: 11, fontWeight: '600', letterSpacing: 0.6 },
    tagGlass:      { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 10, paddingVertical: 5 },
    tagGlassText:  { color: T.textSub, fontSize: 11, fontWeight: '600' },
    tagAmber:      { backgroundColor: 'rgba(245,158,11,0.18)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    tagAmberText:  { color: T.amber, fontSize: 11, fontWeight: '600' },
    tagRed:        { backgroundColor: 'rgba(255,69,58,0.18)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    tagRedText:    { color: T.red, fontSize: 11, fontWeight: '600' },

    eventTitle: {
      color: T.text, fontSize: 25, fontWeight: '600',
      letterSpacing: -0.7, lineHeight: 31, marginBottom: 16,
    },

    hostRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    hostAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.06)' },
    hostedBy:   { color: T.text, fontSize: 14, fontWeight: '500' },
    hostMeta:   { color: T.textMute, fontSize: 12, marginTop: 2 },
    followBtn: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    },
    followBtnActive: { backgroundColor: 'rgba(232,227,216,0.15)', borderColor: T.accent },
    followText:      { color: T.text, fontSize: 12, fontWeight: '600' },
    followTextActive:{ color: T.accent },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 18, borderWidth: 1, borderColor: T.border,
      marginBottom: 18, overflow: 'hidden',
    },
    stat:        { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statVal:     { color: T.text, fontSize: 16, fontWeight: '600', marginBottom: 3 },
    statLabel:   { color: T.textMute, fontSize: 9, fontWeight: '600', letterSpacing: 1.1 },
    statDivider: { width: 1, backgroundColor: T.border, marginVertical: 10 },

    description: { color: 'rgba(244,242,236,0.60)', fontSize: 14, lineHeight: 22, marginBottom: 20 },

    metroCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: T.border, marginBottom: 16,
    },
    metroIcon: { fontSize: 22 },
    metroName: { color: T.text, fontSize: 14, fontWeight: '600' },
    metroDist: { color: T.textSub, fontSize: 12, marginTop: 2 },

    amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },

    tabs: {
      flexDirection: 'row', gap: 4,
      backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4,
      marginBottom: 16, borderWidth: 1, borderColor: T.border,
    },
    tab:           { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
    tabActive:     { backgroundColor: 'rgba(255,255,255,0.08)' },
    tabText:       { color: T.textMute, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: T.text },

    tagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    tag:          { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: T.border },
    tagText:      { color: T.textSub, fontSize: 12 },
    sectionLabel: { color: T.textMute, fontSize: 11, fontWeight: '600', letterSpacing: 1.4, marginBottom: 12, marginTop: 4 },
    photoGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
    photoThumb:   { width: '48.5%', aspectRatio: 1, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
    viewAllPhotos:{ color: T.accent, fontSize: 13, fontWeight: '600', marginTop: 4 },

    playlistList: { gap: 2 },
    trackRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border,
    },
    trackNum:       { color: T.textMute, fontSize: 12, width: 24, textAlign: 'center' },
    trackTitle:     { color: T.text, fontSize: 14, fontWeight: '600' },
    trackArtist:    { color: T.textSub, fontSize: 12, marginTop: 2 },
    trackDur:       { color: T.textMute, fontSize: 12 },
    trackThumb:     { width: 44, height: 44, borderRadius: 8 },
    trackRowFirst:  { borderLeftWidth: 3, borderLeftColor: T.accent, paddingLeft: 8 },
    openPlaylistBtn:{ alignItems: 'center', paddingVertical: 14, marginTop: 8 },
    openPlaylistText:{ color: T.accent, fontWeight: '600', fontSize: 14 },

    ticketCard: {
      backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 22,
      borderWidth: 1, borderColor: 'rgba(232,227,216,0.22)',
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
    ticketEventDate:      { color: T.accent, fontSize: 12, fontWeight: '600', marginBottom: 2 },
    ticketEventVenue:     { color: 'rgba(255,255,255,0.65)', fontSize: 12 },

    ticketPerf: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -1 },
    perfNubL:   { width: 20, height: 20, borderRadius: 10, backgroundColor: T.bg, marginLeft: -10, borderWidth: 1, borderColor: 'rgba(232,227,216,0.15)' },
    perfDashes: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(232,227,216,0.2)', marginHorizontal: 6 },
    perfNubR:   { width: 20, height: 20, borderRadius: 10, backgroundColor: T.bg, marginRight: -10, borderWidth: 1, borderColor: 'rgba(232,227,216,0.15)' },

    ticketIdRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 16 },
    ticketIdLabel:   { color: T.textMute, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
    ticketIdValue:   { color: T.accent, fontSize: 22, fontWeight: '900', letterSpacing: 1 },
    verifyPinLabel:  { color: T.textMute, fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginTop: 10, marginBottom: 3 },
    verifyPinValue:  { color: T.textSub, fontSize: 16, fontWeight: '800', letterSpacing: 3, fontVariant: ['tabular-nums'] },

    ticketMetaRow:   { flexDirection: 'row', borderTopWidth: 1, borderTopColor: T.border },
    ticketMetaCol:   { flex: 1, alignItems: 'center', paddingVertical: 12 },
    ticketMetaLabel: { color: T.textMute, fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
    ticketMetaValue: { color: T.text, fontSize: 15, fontWeight: '800' },

    ticketHostRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 18, paddingVertical: 14,
      borderTopWidth: 1, borderTopColor: T.border,
    },
    ticketHostAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)' },
    ticketHostLabel:  { color: T.textMute, fontSize: 10, marginBottom: 2 },
    ticketHostName:   { color: T.text, fontSize: 13, fontWeight: '700' },
    ticketChatChip: {
      backgroundColor: 'rgba(232,227,216,0.10)', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 7,
      borderWidth: 1, borderColor: 'rgba(232,227,216,0.18)',
    },
    ticketChatText: { color: T.accent, fontSize: 12, fontWeight: '600' },

    cancelLink:     { alignItems: 'center', paddingVertical: 10, marginBottom: 16 },
    cancelLinkText: { color: T.textMute, fontSize: 13, textDecorationLine: 'underline' },

    topControls: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
    topRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 16,
    },
    topRight:  { flexDirection: 'row', gap: 10 },
    glassBtn:  {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14 },
        android: { elevation: 8 },
      }),
    },
    glassBtnIcon: { color: T.text, fontSize: 26, lineHeight: 30, fontWeight: '300' },

    ctaBar: {
      position: 'absolute', left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(13,13,14,0.88)',
      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: Platform.OS === 'android' ? 18 : 36,
      ...Platform.select({
        ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.6, shadowRadius: 30 },
        android: { elevation: 20 },
      }),
    },
    ctaInner:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatarStack: { flexDirection: 'row' },
    stackAvatar: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: 'rgba(232,227,216,0.25)',
      borderWidth: 1.5, borderColor: 'rgba(13,13,14,0.88)',
      alignItems: 'center', justifyContent: 'center',
    },
    stackAvatarText: { fontSize: 9, fontWeight: '700', color: '#090909' },
    rsvpBtn: {
      flex: 1, height: 56, borderRadius: 28,
      backgroundColor: T.accent,
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        ios:     { shadowColor: T.accent, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.5, shadowRadius: 40 },
        android: { elevation: 14 },
      }),
    },
    rsvpBtnFull:  { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: T.border },
    rsvpText:     { color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
    rsvpTextFull: { color: T.textSub },
    shareTicketBtn: {
      height: 56, borderRadius: 28,
      backgroundColor: T.accent,
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        ios:     { shadowColor: T.accent, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.5, shadowRadius: 40 },
        android: { elevation: 14 },
      }),
    },
    shareTicketText: { color: '#090909', fontSize: 15, fontWeight: '700' },
  });

  const ticketRef = useRef<ViewShotRef>(null);

  useEffect(() => {
    if (passedRef) { setRsvped(true); setBookingRef(passedRef); setBookingId(passedId); return; }
    if (alreadyRsvped) return;
    checkBooking(userId, eventId).then(b => {
      if (b) { setRsvped(true); setBookingRef(b.bookingRef); setBookingId(b.id); }
    });
  }, [eventId, passedRef]);

  // Derived — safe to compute after all hooks; guard the render below
  const booked       = event ? (event.booking_count ?? 0) : 0;
  const spotsLeft    = event ? Math.max(0, event.capacity - booked) : 0;
  const eventDate    = event ? new Date(event.date) : new Date();
  const dateStr      = eventDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr      = eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const isFull       = spotsLeft === 0 && booked > 0;
  const isAlmostFull = !isFull && spotsLeft > 0 && spotsLeft <= 5;
  const cancellable  = eventDate.getTime() - Date.now() > 24 * 60 * 60 * 1000;
  const hostName     = hostProfile?.display_name ?? 'Host';
  const hostAvatar   = hostProfile?.avatar_url ?? undefined;

  if (loadingEvent || !event) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={T.accent} size="large" />
      </View>
    );
  }

  function handleRSVP() {
    if (rsvped) return;
    // Age gate — covers every booking path below (waitlist, invite request, and
    // the full RSVP flow, which also re-checks in RSVPStep2 as defense in depth).
    if (event && typeof event.min_age === 'number' && event.min_age > 0) {
      const age = computeAge(profile?.date_of_birth);
      if (age === null || age < event.min_age) {
        Alert.alert(
          `${event.min_age}+ event`,
          age === null
            ? 'Add your date of birth in your profile to RSVP to age-restricted events.'
            : `This event is ${event.min_age}+. Your profile says you're ${age}.`,
        );
        return;
      }
    }
    if (isInviteOnly) {
      Alert.alert(
        'Request to RSVP',
        `${event?.title} is invite-only. Send a request to the host?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Request', onPress: () => Alert.alert('Request sent', 'The host will review and notify you.') },
        ]
      );
      return;
    }
    if (isFull) {
      Alert.alert(
        'Join Waitlist',
        `You'll be notified if a spot opens for ${event?.title}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join Waitlist',
            onPress: async () => {
              const { booking, error } = await createBooking(userId, eventId, 'waitlist', 1);
              if (error || !booking) {
                Alert.alert('Error', error?.includes('already') ? 'Already on waitlist.' : (error ?? 'Try again.'));
                return;
              }
              setRsvped(true);
              setBookingRef(booking.bookingRef);
              setBookingId(booking.id);
              Alert.alert('📋 Waitlist joined', `We'll notify you if a spot opens.\nRef: ${booking.bookingRef}`);
            },
          },
        ]
      );
      return;
    }
    navigation.navigate('RSVPFlow', { eventId });
  }

  async function handleShareTicket() {
    try {
      const uri = await (ticketRef.current as any).capture();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your ticket' });
      } else {
        Share.share({ message: `locked in for ${event?.title} no cap 🎟️ ${maskRef(bookingRef ?? '')}` });
      }
    } catch {
      Share.share({ message: `locked in for ${event?.title} no cap 🎟️ ${maskRef(bookingRef ?? '')}` });
    }
  }

  function handleShare() {
    Share.share({
      message: `just copped my ticket to ${event?.title} 🎟️\n📍 ${event?.area ?? ''} · ${dateStr}\nit's giving main character energy fr`,
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

    const feeNote = (event?.entry_fee ?? 0) > 0
      ? `\n\n⚠️ Entry fee of ₹${event?.entry_fee} is non-refundable.`
      : '\n\nThis event is free — no charges apply.';

    Alert.alert(
      'Cancel your RSVP?',
      `You are about to cancel "${event?.title}" on ${dateStr}.${feeNote}\n\nYour spot will be released to the waitlist.`,
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
  const isToday    = eventDate.toDateString() === new Date().toDateString();
  const timeLabel  = isToday ? `${timeStr} · TONIGHT` : `${dateStr} · ${timeStr}`;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Image source={{ uri: event.cover_image ?? undefined }} style={s.heroImg} resizeMode="cover" />
      <View style={s.heroGrad} />

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
        <View style={{ height: 330 }} />

        <View style={s.infoCard}>

          <View style={s.tagsRow}>
            {(event.vibe ?? []).slice(0, 1).map((tag: string) => (
              <View key={tag} style={s.tagChamp}>
                <Text style={s.tagChampText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
            {isAlmostFull && (
              <View style={s.tagAmber}>
                <Text style={s.tagAmberText}>🔥 {spotsLeft} LEFT</Text>
              </View>
            )}
            {isFull && (
              <View style={s.tagRed}>
                <Text style={s.tagRedText}>SOLD OUT</Text>
              </View>
            )}
          </View>

          <Text style={s.eventTitle}>{event.title}</Text>

          <View style={s.hostRow}>
            {hostAvatar
              ? <Image source={{ uri: hostAvatar }} style={s.hostAvatar} />
              : <View style={[s.hostAvatar, { backgroundColor: 'rgba(232,227,216,0.15)', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: T.accent, fontSize: 14, fontWeight: '700' }}>{hostName[0]?.toUpperCase()}</Text>
                </View>}
            <View style={{ flex: 1 }}>
              <Text style={s.hostedBy}>Hosted by {hostName}</Text>
              <Text style={s.hostMeta}>Tap to view profile</Text>
            </View>
            <TouchableOpacity
              style={[s.followBtn, followingHost && s.followBtnActive]}
              onPress={async () => {
                if (!userId) { Alert.alert('Sign in to follow hosts'); return; }
                setFollowLoading(true);
                const { followUser, unfollowUser } = await import('../../../services/followService');
                if (followingHost) {
                  await unfollowUser(userId, event.host_id);
                  setFollowingHost(false);
                } else {
                  await followUser(userId, event.host_id);
                  setFollowingHost(true);
                }
                setFollowLoading(false);
              }}
              disabled={followLoading}
              activeOpacity={0.8}
            >
              {followLoading
                ? <ActivityIndicator size="small" color={followingHost ? T.accent : '#090909'} />
                : <Text style={[s.followText, followingHost && s.followTextActive]}>
                    {followingHost ? 'Following' : 'Follow'}
                  </Text>}
            </TouchableOpacity>
          </View>

          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statVal}>{timeStr}</Text>
              <Text style={s.statLabel}>{isToday ? 'TONIGHT' : 'TIME'}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statVal}>{event.metro_distance ?? event.area ?? '—'}</Text>
              <Text style={s.statLabel}>LOCATION</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={[s.statVal, isFull && { color: T.red }, isAlmostFull && { color: T.amber }]}>
                {isFull ? 'FULL' : booked}
              </Text>
              <Text style={s.statLabel}>GOING</Text>
            </View>
          </View>

          <Text style={s.description}>{event.description ?? ''}</Text>

          {rsvped ? (
            <>
              <ViewShot ref={ticketRef as any} options={{ format: 'png', quality: 1 }} style={s.ticketCard}>
                <View style={s.ticketCoverWrap}>
                  <Image source={{ uri: event.cover_image ?? undefined }} style={s.ticketCoverImg} resizeMode="cover" />
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
                    <Text style={s.ticketEventVenue}>📍 {event.area ?? event.venue ?? ''}</Text>
                  </View>
                </View>
                <View style={s.ticketPerf}>
                  <View style={s.perfNubL} />
                  <View style={s.perfDashes} />
                  <View style={s.perfNubR} />
                </View>
                <View style={s.ticketIdRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.ticketIdLabel}>BOOKING ID</Text>
                    <Text style={s.ticketIdValue}>{displayRef}</Text>
                    <Text style={s.verifyPinLabel}>VERIFY PIN</Text>
                    <Text style={s.verifyPinValue}>{verifyPin}</Text>
                  </View>
                  <QRVisual bookingRef={displayRef} size={80} />
                </View>
                <View style={s.ticketMetaRow}>
                  <View style={s.ticketMetaCol}>
                    <Text style={s.ticketMetaLabel}>ENTRY</Text>
                    <Text style={s.ticketMetaValue}>{event.entry_fee === 0 ? 'Free' : `₹${event.entry_fee}`}</Text>
                  </View>
                  <View style={[s.ticketMetaCol, { borderLeftWidth: 1, borderLeftColor: T.border }]}>
                    <Text style={s.ticketMetaLabel}>AGE</Text>
                    <Text style={s.ticketMetaValue}>18+</Text>
                  </View>
                  <View style={[s.ticketMetaCol, { borderLeftWidth: 1, borderLeftColor: T.border }]}>
                    <Text style={s.ticketMetaLabel}>GUESTS</Text>
                    <Text style={s.ticketMetaValue}>1</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={s.ticketHostRow}
                  onPress={() => navigation.navigate('Chat', { hostId: event.host_id })}
                  activeOpacity={0.8}
                >
                  {hostAvatar
                    ? <Image source={{ uri: hostAvatar }} style={s.ticketHostAvatar} />
                    : <View style={[s.ticketHostAvatar, { backgroundColor: 'rgba(232,227,216,0.15)', alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ color: T.accent, fontSize: 13, fontWeight: '700' }}>{hostName[0]?.toUpperCase()}</Text>
                      </View>}
                  <View style={{ flex: 1 }}>
                    <Text style={s.ticketHostLabel}>Hosted by</Text>
                    <Text style={s.ticketHostName}>{hostName}</Text>
                  </View>
                  <View style={s.ticketChatChip}>
                    <Text style={s.ticketChatText}>💬 Message Host</Text>
                  </View>
                </TouchableOpacity>
              </ViewShot>
              <TouchableOpacity style={s.cancelLink} onPress={handleCancelRSVP} disabled={cancelling} activeOpacity={0.7}>
                {cancelling
                  ? <ActivityIndicator color={T.textMute} size="small" />
                  : <Text style={s.cancelLinkText}>{cancellable ? 'Cancel RSVP' : '🔒 Cancellation closed (< 24h)'}</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <WhoIsGoingBar event={event} />
          )}

          {new Date(event.date).getTime() > Date.now() && <CountdownTimer targetDate={event.date} />}

          {(event.nearest_metro || event.area) && (
            <TouchableOpacity
              style={s.metroCard}
              activeOpacity={0.8}
              onPress={() => {
                const query = encodeURIComponent(
                  event.lat && event.lng
                    ? `${event.lat},${event.lng}`
                    : `${event.area ?? event.venue ?? ''}`.trim()
                );
                Linking.openURL(`https://maps.google.com/?q=${query}`);
              }}
            >
              <Text style={s.metroIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.metroName}>{event.nearest_metro ?? event.area ?? event.venue}</Text>
                {event.metro_distance && <Text style={s.metroDist}>{event.metro_distance} · {event.area ?? ''}</Text>}
              </View>
              <Feather name="map-pin" size={14} color="rgba(232,227,216,0.45)" />
            </TouchableOpacity>
          )}

          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, activeTab === 'details' && s.tabActive]}
              onPress={() => setActiveTab('details')}
            >
              <Text style={[s.tabText, activeTab === 'details' && s.tabTextActive]}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, activeTab === 'playlist' && s.tabActive]}
              onPress={() => setActiveTab('playlist')}
            >
              <Text style={[s.tabText, activeTab === 'playlist' && s.tabTextActive]}>🎵 Playlist</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'details' ? (
            <View>
              <View style={s.tagRow}>
                {(event.vibe ?? []).map((tag: string) => (
                  <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
                ))}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Gallery', { eventId: event.id })}>
                <Text style={s.viewAllPhotos}>View gallery →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Playlist tab */
            <View>
              {(() => {
                // playlist_tracks is free-form jsonb — defend against a non-array
                // value or malformed entries so a bad row can't crash the tab.
                const rawTracks = (event as any).playlist_tracks;
                const tracks: any[] = (Array.isArray(rawTracks) ? rawTracks : [])
                  .filter((t: any) => t && typeof t === 'object');
                const playlistUrl: string | null =
                  typeof (event as any).playlist_url === 'string' ? (event as any).playlist_url : null;
                const isHost = userId === event.host_id;
                if (tracks.length === 0) {
                  return (
                    <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
                      <Text style={{ fontSize: 28 }}>🎧</Text>
                      <Text style={{ color: T.textMute, fontSize: 14, textAlign: 'center' }}>
                        {isHost ? 'Add a playlist to set the vibe' : 'Host hasn\'t added a playlist yet'}
                      </Text>
                      {isHost && (
                        <TouchableOpacity
                          style={{ backgroundColor: 'rgba(232,227,216,0.12)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(232,227,216,0.25)' }}
                          onPress={() => navigation.navigate('EditPlaylist', { eventId: event.id, playlistUrl, tracks })}
                          activeOpacity={0.8}
                        >
                          <Text style={{ color: T.accent, fontWeight: '600', fontSize: 14 }}>+ Add playlist →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }
                return (
                  <View>
                    {isHost && (
                      <TouchableOpacity
                        style={{ alignSelf: 'flex-end', marginBottom: 12 }}
                        onPress={() => navigation.navigate('EditPlaylist', { eventId: event.id, playlistUrl, tracks })}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: T.accent, fontSize: 13, fontWeight: '600' }}>Edit playlist ✏️</Text>
                      </TouchableOpacity>
                    )}
                    {tracks.map((track: any, i: number) => (
                      <View key={i} style={[s.trackRow, i === 0 && s.trackRowFirst]}>
                        {track.thumbnail_url
                          ? <Image source={{ uri: track.thumbnail_url }} style={s.trackThumb} />
                          : <View style={[s.trackThumb, { backgroundColor: 'rgba(232,227,216,0.10)', alignItems: 'center', justifyContent: 'center' }]}>
                              <Text style={{ fontSize: 16 }}>🎵</Text>
                            </View>}
                        <View style={{ flex: 1 }}>
                          <Text style={s.trackTitle} numberOfLines={1}>{track.title ?? 'Untitled track'}</Text>
                          <Text style={s.trackArtist} numberOfLines={1}>{track.artist ?? ''}</Text>
                        </View>
                        {typeof track.duration_s === 'number' && track.duration_s > 0 && (
                          <Text style={s.trackDur}>{`${Math.floor(track.duration_s / 60)}:${String(track.duration_s % 60).padStart(2, '0')}`}</Text>
                        )}
                      </View>
                    ))}
                    {playlistUrl && (
                      <TouchableOpacity
                        style={s.openPlaylistBtn}
                        onPress={() => Linking.openURL(playlistUrl)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.openPlaylistText}>
                          {playlistUrl.includes('spotify') ? '🎧 Open in Spotify →' : '▶ Open in YouTube →'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()}
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <SafeAreaView style={s.topControls} edges={['top']}>
        <View style={s.topRow}>
          <TouchableOpacity style={s.glassBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={s.glassBtnIcon}>‹</Text>
          </TouchableOpacity>
          <View style={s.topRight}>
            <TouchableOpacity style={s.glassBtn} activeOpacity={0.8}>
              <Feather name="bookmark" size={18} color="#F4F2EC" />
            </TouchableOpacity>
            <TouchableOpacity style={s.glassBtn} onPress={handleShare} activeOpacity={0.8}>
              <Feather name="share-2" size={17} color="#F4F2EC" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={s.ctaBar}>
        {rsvped ? (
          <TouchableOpacity style={s.shareTicketBtn} onPress={handleShareTicket} activeOpacity={0.85}>
            <Text style={s.shareTicketText}>↑  flex on the feed — share ticket</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.ctaInner}>
            <View style={{ flexDirection: 'column', gap: 4 }}>
              <View style={s.avatarStack}>
                {(guestFaces.length > 0 ? guestFaces : [{initials:'?',color:'rgba(232,227,216,0.25)'},{initials:'?',color:'rgba(232,227,216,0.18)'},{initials:'?',color:'rgba(232,227,216,0.12)'}]).map((face, i) => (
                  <View key={i} style={[s.stackAvatar, { marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i, backgroundColor: face.color }]}>
                    <Text style={s.stackAvatarText}>{face.initials}</Text>
                  </View>
                ))}
              </View>
              {vibeScore !== null && (
                <Text style={{
                  fontSize: 10, fontWeight: '600',
                  color: vibeScore >= 70 ? '#00D37F' : vibeScore >= 40 ? '#F59E0B' : 'rgba(232,227,216,0.5)',
                }}>
                  {vibeScore}% vibe match{vibeScore >= 80 ? ' 🔥' : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[s.rsvpBtn, (isFull || isInviteOnly) && s.rsvpBtnFull]}
              onPress={handleRSVP}
              activeOpacity={0.85}
            >
              <Text style={[s.rsvpText, (isFull || isInviteOnly) && s.rsvpTextFull]}>
                {isInviteOnly
                  ? 'Request to RSVP'
                  : isFull
                  ? 'Join Waitlist'
                  : event.entry_fee === 0
                  ? 'RSVP · Free'
                  : `RSVP · ₹${event.entry_fee}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
