import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, Share, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EVENTS, RAHUL } from '../../../data/fakeData';

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.15)',
  green: '#00D37F', greenDim: 'rgba(0,211,127,0.15)',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
};

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function pad(n: number) { return String(n).padStart(2, '0'); }

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
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1,
  },
  active: { backgroundColor: 'rgba(0,211,127,0.1)', borderColor: 'rgba(0,211,127,0.3)' },
  inactive: { backgroundColor: T.elevated, borderColor: T.border },
  icon: { fontSize: 14 },
  label: { fontSize: 12, fontWeight: '500' },
  activeLabel: { color: T.green },
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

export default function EventDetailScreen({ route, navigation }: any) {
  const eventId = route?.params?.eventId ?? 'e1';
  const event = EVENTS.find(e => e.id === eventId) ?? EVENTS[0];
  const [rsvped, setRsvped] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'playlist'>('details');

  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  function handleShare() {
    Share.share({
      message: `🎉 Check out "${event.title}" on houseparty!\n📍 ${event.area}, ${event.city}\n📅 ${dateStr} at ${timeStr}\nhttps://houseparty.app/events/${event.id}?ref=${RAHUL.referralCode}`,
      title: event.title,
    });
  }

  function handleRSVP() {
    if (event.spotsLeft === 0) { Alert.alert('Event Full', 'No spots left. Join the waitlist?'); return; }
    setRsvped(true);
    Alert.alert('🎉 You\'re in!', `RSVP confirmed for ${event.title}. Check your RSVPs for your entry ticket.`);
  }

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
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          {/* Title row */}
          <View style={s.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.eventDate}>{dateStr.toUpperCase()} · {timeStr}</Text>
              <Text style={s.eventTitle}>{event.title}</Text>
            </View>
          </View>

          {/* Host row */}
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

          {/* Countdown */}
          {event.status === 'upcoming' && <CountdownTimer targetDate={event.date} />}

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statVal}>
                {event.fee === 0 ? 'Free' : `₹${event.fee}`}
              </Text>
              <Text style={s.statLabel}>ENTRY</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={[s.statVal, event.spotsLeft < 5 && { color: '#FF5A5A' }]}>
                {event.spotsLeft === 0 ? 'FULL' : event.spotsLeft}
              </Text>
              <Text style={s.statLabel}>SPOTS LEFT</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statVal}>{event.ageMin}–{event.ageMax}</Text>
              <Text style={s.statLabel}>AGE GROUP</Text>
            </View>
          </View>

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
            <AmenityPill icon="🍻" label="Alcohol" active={event.alcohol} />
            <AmenityPill icon="🚬" label="Smoking" active={event.smoking} />
            <AmenityPill icon="🐾" label="Pets OK" active={event.pets} />
            <AmenityPill icon="🍕" label="Food" active={event.food} />
            <AmenityPill icon="❄️" label="AC" active={event.ac} />
            <AmenityPill icon="📶" label="WiFi" active={event.wifi} />
          </View>

          {/* Tabs */}
          <View style={s.tabs}>
            {(['details', 'playlist'] as const).map(tab => (
              <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                  {tab === 'details' ? 'Details' : `Playlist (${event.playlist.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'details' ? (
            <View>
              <Text style={s.description}>{event.description}</Text>
              {/* Vibe tags */}
              <View style={s.tagRow}>
                {event.tags.map(tag => (
                  <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
                ))}
              </View>
              {/* Photos grid */}
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

      {/* Sticky CTA */}
      <View style={s.cta}>
        <View style={s.ctaInner}>
          <View>
            <Text style={s.ctaFee}>{event.fee === 0 ? 'Free Entry' : `₹${event.fee}`}</Text>
            <Text style={s.ctaSpots}>
              {event.spotsLeft === 0 ? 'Event full' : `${event.spotsLeft} spots left`}
            </Text>
          </View>
          <TouchableOpacity
            style={[s.rsvpBtn, (rsvped || event.spotsLeft === 0) && s.rsvpBtnDone]}
            onPress={handleRSVP}
            activeOpacity={0.85}
          >
            <Text style={s.rsvpText}>
              {rsvped ? '✓ RSVP\'d' : event.spotsLeft === 0 ? 'Join Waitlist' : 'RSVP Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  cover: { height: 280, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  coverActions: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
  shareBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  shareIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
  coverBadge: { position: 'absolute', bottom: 16, left: 20 },
  verifiedBadge: {
    backgroundColor: 'rgba(0,211,127,0.2)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(0,211,127,0.4)',
  },
  verifiedText: { color: T.green, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  scroll: { flex: 1 },
  content: { padding: 20 },

  titleRow: { flexDirection: 'row', marginBottom: 16 },
  eventDate: { color: T.gold, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, marginBottom: 4 },
  eventTitle: { color: T.text, fontSize: 26, fontWeight: '800', lineHeight: 32 },

  hostRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: T.border, marginBottom: 20,
  },
  hostAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: T.elevated },
  hostedBy: { color: T.textMute, fontSize: 11, marginBottom: 2 },
  hostName: { color: T.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  chatChip: {
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
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statVal: { color: T.text, fontSize: 18, fontWeight: '700', marginBottom: 2 },
  statLabel: { color: T.textMute, fontSize: 9, fontWeight: '600', letterSpacing: 1 },
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
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: T.card },
  tabText: { color: T.textMute, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: T.text },

  description: { color: T.textSub, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: {
    backgroundColor: T.elevated, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: T.border,
  },
  tagText: { color: T.textSub, fontSize: 12 },

  sectionLabel: {
    color: T.textMute, fontSize: 11, fontWeight: '600',
    letterSpacing: 1.4, marginBottom: 12, marginTop: 4,
  },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  photoThumb: { width: '48.5%', aspectRatio: 1, borderRadius: 12, backgroundColor: T.elevated },
  viewAllPhotos: { color: T.gold, fontSize: 13, fontWeight: '600', marginTop: 4 },

  playlistList: { gap: 2 },
  trackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  trackNum: { color: T.textMute, fontSize: 12, width: 24, textAlign: 'center' },
  trackTitle: { color: T.text, fontSize: 14, fontWeight: '600' },
  trackArtist: { color: T.textSub, fontSize: 12, marginTop: 2 },
  trackDur: { color: T.textMute, fontSize: 12 },

  cta: {
    backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.border,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'android' ? 16 : 34, paddingTop: 14,
  },
  ctaInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctaFee: { color: T.text, fontSize: 20, fontWeight: '800' },
  ctaSpots: { color: T.textMute, fontSize: 12, marginTop: 2 },
  rsvpBtn: {
    backgroundColor: T.gold, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  rsvpBtnDone: { backgroundColor: T.green },
  rsvpText: { color: '#000', fontSize: 15, fontWeight: '700' },
});

