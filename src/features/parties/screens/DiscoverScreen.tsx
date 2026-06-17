import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EVENTS } from '../../../data/fakeData';
import { BottomNav } from '../../../shared/components/BottomNav';

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.15)',
  green: '#00D37F', greenDim: 'rgba(0,211,127,0.15)',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
  purple: '#A855F7',
};

const FILTERS = [
  { id: 'All',       icon: '✦',  label: 'All' },
  { id: 'Tonight',   icon: '🌙', label: 'Tonight' },
  { id: 'Free',      icon: '🎁', label: 'Free' },
  { id: 'Bollywood', icon: '🎬', label: 'Bollywood' },
  { id: 'EDM',       icon: '🎛️', label: 'EDM' },
  { id: 'Jazz',      icon: '🎷', label: 'Jazz' },
  { id: 'Sufi',      icon: '🎵', label: 'Sufi' },
  { id: 'Hip-Hop',   icon: '🎤', label: 'Hip-Hop' },
  { id: 'Delhi',     icon: '📍', label: 'Delhi' },
  { id: 'Mumbai',    icon: '📍', label: 'Mumbai' },
  { id: 'Bangalore', icon: '📍', label: 'Bangalore' },
];

// ── Compact header — 48dp search bar (Material Design standard) ───────────────
function Hero({ query, setQuery }: { query: string; setQuery: (s: string) => void }) {
  return (
    <SafeAreaView edges={['top']} style={s.hero}>
      <View style={s.heroRow}>
        <View>
          <Text style={s.heroEyebrow}>EXPLORE</Text>
          <Text style={s.heroTitle}>Find your night.</Text>
        </View>
        <View style={s.heroCount}>
          <Text style={s.heroCountNum}>{EVENTS.length}</Text>
          <Text style={s.heroCountLbl}>parties</Text>
        </View>
      </View>

      {/* 48dp height — Android Material Design search bar spec */}
      <View style={s.searchWrap}>
        <Text style={s.searchMag}>⌕</Text>
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="city, vibe, artist..."
          placeholderTextColor={T.textMute}
          selectionColor={T.gold}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: T.textMute, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Filter chips ──────────────────────────────────────────────────────────────
function FilterBar({ active, setActive }: { active: string; setActive: (s: string) => void }) {
  return (
    <View style={s.filterWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        bounces={false}
      >
        {FILTERS.map(f => {
          const on = active === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[s.chip, on ? s.chipOn : s.chipOff]}
              onPress={() => setActive(f.id)}
              activeOpacity={0.75}
            >
              <Text style={s.chipIcon}>{f.icon}</Text>
              <Text style={[s.chipLabel, on ? s.chipLabelOn : s.chipLabelOff]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ event, navigation }: { event: any; navigation: any }) {
  const isClosed = event.status === 'closed';
  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const isFull        = event.spotsLeft === 0;
  const isAlmostFull  = !isFull && event.spotsLeft > 0 && event.spotsLeft <= 5;

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.88}
      onPress={() => navigation.navigate(
        isClosed ? 'ClosedEvent' : 'EventDetail', { eventId: event.id }
      )}
    >
      {/* Full-bleed cover */}
      <View style={s.imgWrap}>
        <Image source={{ uri: event.coverImage }} style={s.img} resizeMode="cover" />
        <View style={s.imgGrad} />

        {/* Top badges */}
        <View style={s.badgeRow}>
          {isClosed ? (
            <View style={s.badgeClosed}><Text style={s.badgeClosedTxt}>ENDED</Text></View>
          ) : event.host.verified ? (
            <View style={s.badgeVerified}><Text style={s.badgeVerifiedTxt}>✓ VERIFIED</Text></View>
          ) : <View />}
          <View style={[s.badgeFee, event.fee === 0 && s.badgeFeeFree]}>
            <Text style={[s.badgeFeeTxt, event.fee === 0 && s.badgeFeeFreeTxt]}>
              {event.fee === 0 ? 'FREE' : `₹${event.fee}`}
            </Text>
          </View>
        </View>

        {/* Date + title overlaid on image */}
        <View style={s.imgBottom}>
          <Text style={s.cardDateStr}>{dateStr.toUpperCase()} · {timeStr}</Text>
          <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
        </View>
      </View>

      {/* Card body */}
      <View style={s.body}>
        <View style={s.bodyRow}>
          <Image source={{ uri: event.host.avatar }} style={s.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={s.hostName}>{event.host.name}</Text>
            <Text style={s.hostMeta}>📍 {event.area} · 🚇 {event.metroDistance}</Text>
          </View>
          <View style={[
            s.spotPill,
            isFull && !isClosed ? s.spotFull
              : isClosed ? s.spotClosed
              : isAlmostFull ? s.spotAlmost
              : s.spotOpen,
          ]}>
            <Text style={[
              s.spotTxt,
              isFull && !isClosed ? s.spotTxtFull
                : isClosed ? s.spotTxtClosed
                : isAlmostFull ? s.spotTxtAlmost
                : s.spotTxtOpen,
            ]}>
              {isClosed ? 'Ended' : isFull ? 'Full' : isAlmostFull ? `🔥 ${event.spotsLeft} left` : `${event.spotsLeft} left`}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.tagRow}>
            {event.tags.slice(0, 4).map((tag: string) => (
              <View key={tag} style={s.tag}>
                <Text style={s.tagTxt}>{tag}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function DiscoverScreen({ navigation }: any) {
  const [query, setQuery]         = useState('');
  const [activeFilter, setActive] = useState('All');

  const filtered = EVENTS.filter(e => {
    const q = query.toLowerCase();
    const matchQ = !q
      || e.title.toLowerCase().includes(q)
      || e.area.toLowerCase().includes(q)
      || e.city.toLowerCase().includes(q);
    const matchF = activeFilter === 'All'
      || (activeFilter === 'Free'    && e.fee === 0)
      || (activeFilter === 'Tonight' && new Date(e.date).toDateString() === new Date().toDateString())
      || e.tags.some((t: string) => t.toLowerCase().includes(activeFilter.toLowerCase()))
      || e.city.toLowerCase().includes(activeFilter.toLowerCase());
    return matchQ && matchF;
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* 0 — Compact hero (not sticky) */}
        <Hero query={query} setQuery={setQuery} />

        {/* 1 — Filter bar (sticky) */}
        <FilterBar active={activeFilter} setActive={setActive} />

        {/* 2 — Cards */}
        <View style={s.list}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🎈</Text>
              <Text style={s.emptyTitle}>No parties here</Text>
              <Text style={s.emptySub}>
                {query
                  ? `No results for "${query}"${activeFilter !== 'All' ? ` in ${activeFilter}` : ''}`
                  : `No ${activeFilter} parties available right now`}
              </Text>
              {(query || activeFilter !== 'All') && (
                <TouchableOpacity
                  style={s.clearBtn}
                  onPress={() => { setQuery(''); setActive('All'); }}
                >
                  <Text style={s.clearBtnTxt}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map(e => (
              <EventCard key={e.id} event={e} navigation={navigation} />
            ))
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} active="Discover" />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // Compact hero — no wasted space
  hero: {
    backgroundColor: T.bg,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  heroRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 14, marginTop: 10,
  },
  heroEyebrow: {
    color: T.gold, fontSize: 10, fontWeight: '800',
    letterSpacing: 3, marginBottom: 4,
  },
  heroTitle: {
    color: T.text, fontSize: 26, fontWeight: '900',
  },
  heroCount: { alignItems: 'flex-end' },
  heroCountNum: { color: T.gold, fontSize: 28, fontWeight: '900', lineHeight: 30 },
  heroCountLbl: { color: T.textMute, fontSize: 11 },

  // 48dp search bar — Material Design Android spec
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.elevated,
    borderRadius: 12, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: T.border,
  },
  searchMag: { color: T.gold, fontSize: 20 },
  searchInput: { flex: 1, color: T.text, fontSize: 16 },

  // Filter bar
  filterWrap: {
    backgroundColor: T.bg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingVertical: 10,
  },
  filterRow: { paddingHorizontal: 20, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, height: 36,
    borderRadius: 18, borderWidth: 1,
  },
  chipOn:  { backgroundColor: T.gold, borderColor: T.gold },
  chipOff: { backgroundColor: T.elevated, borderColor: T.border },
  chipIcon: { fontSize: 12 },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  chipLabelOn:  { color: '#000' },
  chipLabelOff: { color: T.textSub },

  // Cards list
  list: { padding: 16, gap: 16 },

  // Event card
  card: {
    backgroundColor: T.card, borderRadius: 20,
    borderWidth: 1, borderColor: T.border, overflow: 'hidden',
  },
  imgWrap: { height: 210, position: 'relative' },
  img: { width: '100%', height: '100%', backgroundColor: T.elevated },
  imgGrad: { ...StyleSheet.absoluteFill, backgroundColor: 'transparent' },
  badgeRow: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  badgeClosed: {
    backgroundColor: 'rgba(255,90,90,0.2)', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,90,90,0.5)',
  },
  badgeClosedTxt: { color: '#FF5A5A', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  badgeVerified: {
    backgroundColor: 'rgba(0,211,127,0.18)', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(0,211,127,0.45)',
  },
  badgeVerifiedTxt: { color: T.green, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  badgeFee: {
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: T.gold,
  },
  badgeFeeTxt: { color: T.gold, fontSize: 12, fontWeight: '800' },
  badgeFeeFree: { backgroundColor: 'rgba(0,211,127,0.2)', borderColor: T.green },
  badgeFeeFreeTxt: { color: T.green },
  imgBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 14, backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cardDateStr: {
    color: T.gold, fontSize: 10, fontWeight: '700',
    letterSpacing: 1, marginBottom: 3,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },

  body: { padding: 14, gap: 10 },
  bodyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.elevated },
  hostName: { color: T.text, fontSize: 13, fontWeight: '700' },
  hostMeta: { color: T.textMute, fontSize: 11, marginTop: 1 },

  spotPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  spotOpen:   { backgroundColor: T.greenDim, borderColor: 'rgba(0,211,127,0.4)' },
  spotFull:   { backgroundColor: 'rgba(255,90,90,0.1)', borderColor: 'rgba(255,90,90,0.4)' },
  spotClosed: { backgroundColor: T.elevated, borderColor: T.border },
  spotAlmost: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.4)' },
  spotTxt: { fontSize: 11, fontWeight: '700' },
  spotTxtOpen:   { color: T.green },
  spotTxtFull:   { color: '#FF5A5A' },
  spotTxtClosed: { color: T.textMute },
  spotTxtAlmost: { color: '#F59E0B' },

  tagRow: { flexDirection: 'row', gap: 6 },
  tag: {
    backgroundColor: T.elevated, borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: T.border,
  },
  tagTxt: { color: T.textMute, fontSize: 11 },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { color: T.text, fontSize: 20, fontWeight: '800' },
  emptySub: { color: T.textMute, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  clearBtn: {
    marginTop: 6, backgroundColor: T.elevated, borderRadius: 22,
    paddingHorizontal: 22, paddingVertical: 11,
    borderWidth: 1, borderColor: T.border,
  },
  clearBtnTxt: { color: T.gold, fontSize: 14, fontWeight: '700' },
});
