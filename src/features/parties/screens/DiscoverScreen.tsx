import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EVENTS } from '../../../data/fakeData';
import { BottomNav } from '../../../shared/components/BottomNav';

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.15)',
  green: '#00D37F', greenDim: 'rgba(0,211,127,0.15)',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
};

const W = Dimensions.get('window').width;
const FILTERS = ['All', 'Tonight', 'Free', 'Bollywood', 'EDM', 'Jazz', 'Delhi', 'Mumbai', 'Bangalore'];

export default function DiscoverScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = EVENTS.filter(e => {
    const q = query.toLowerCase();
    const matchQ = !q || e.title.toLowerCase().includes(q) || e.area.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
    const matchF = activeFilter === 'All'
      || (activeFilter === 'Free' && e.fee === 0)
      || (activeFilter === 'Tonight' && new Date(e.date).toDateString() === new Date().toDateString())
      || e.tags.some(t => t.toLowerCase().includes(activeFilter.toLowerCase()))
      || e.city.toLowerCase().includes(activeFilter.toLowerCase());
    return matchQ && matchF;
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>Discover</Text>
          <Text style={s.sub}>{EVENTS.length} parties near you</Text>
        </View>

        {/* Search */}
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search parties, areas..."
            placeholderTextColor={T.textMute}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ color: T.textMute, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filters}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.chip, activeFilter === f && s.chipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, activeFilter === f && s.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
          {filtered.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔎</Text>
              <Text style={s.emptyText}>No parties found</Text>
              <Text style={s.emptySub}>Try a different filter or search term</Text>
            </View>
          )}
          {filtered.map(event => {
            const d = new Date(event.date);
            const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const isClosed = event.status === 'closed';

            return (
              <TouchableOpacity
                key={event.id}
                style={s.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate(
                  isClosed ? 'ClosedEvent' : 'EventDetail',
                  { eventId: event.id }
                )}
              >
                <View style={s.cardThumb}>
                  <Image source={{ uri: event.coverImage }} style={s.thumbImg} resizeMode="cover" />
                  {isClosed && (
                    <View style={s.closedOverlay}>
                      <Text style={s.closedText}>CLOSED</Text>
                    </View>
                  )}
                  <View style={s.feePill}>
                    <Text style={s.feeText}>{event.fee === 0 ? 'Free' : `₹${event.fee}`}</Text>
                  </View>
                </View>

                <View style={s.cardBody}>
                  <View style={s.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
                      <Text style={s.cardMeta}>{event.area} · {dateStr}</Text>
                    </View>
                    {event.host.verified && (
                      <View style={s.verifiedDot} />
                    )}
                  </View>

                  <View style={s.cardRow}>
                    <Image source={{ uri: event.host.avatar }} style={s.hostAvatar} />
                    <Text style={s.hostName}>{event.host.name}</Text>
                    <Text style={s.hostRating}>★ {event.host.rating}</Text>
                  </View>

                  <View style={s.cardFooter}>
                    <View style={s.metroChip}>
                      <Text style={s.metroText}>🚇 {event.metroDistance}</Text>
                    </View>
                    <View style={[s.spotChip, event.spotsLeft === 0 && s.spotFull]}>
                      <Text style={[s.spotText, event.spotsLeft === 0 && s.spotTextFull]}>
                        {event.spotsLeft === 0 ? 'Full' : `${event.spotsLeft} spots`}
                      </Text>
                    </View>
                    <View style={s.agePill}>
                      <Text style={s.ageText}>{event.ageMin}–{event.ageMax}</Text>
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    <View style={s.tagRow}>
                      {event.tags.slice(0, 3).map(tag => (
                        <View key={tag} style={s.tag}>
                          <Text style={s.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
      <BottomNav navigation={navigation} active="Discover" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  title: { color: T.text, fontSize: 26, fontWeight: '800' },
  sub: { color: T.textMute, fontSize: 12, marginTop: 2 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: T.elevated, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: T.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: T.text, fontSize: 14 },

  filters: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: T.elevated, borderWidth: 1, borderColor: T.border,
  },
  chipActive: { backgroundColor: T.goldDim, borderColor: T.gold },
  chipText: { color: T.textSub, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: T.gold, fontWeight: '600' },

  list: { paddingHorizontal: 20, gap: 16 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: T.text, fontSize: 18, fontWeight: '700' },
  emptySub: { color: T.textMute, fontSize: 14 },

  card: {
    backgroundColor: T.card, borderRadius: 20,
    borderWidth: 1, borderColor: T.border, overflow: 'hidden',
  },
  cardThumb: { height: 180, position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  closedText: { color: '#FF5A5A', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  feePill: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: T.gold,
  },
  feeText: { color: T.gold, fontSize: 13, fontWeight: '700' },

  cardBody: { padding: 16, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { color: T.text, fontSize: 17, fontWeight: '700' },
  cardMeta: { color: T.textSub, fontSize: 12, marginTop: 2 },
  verifiedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.green, marginTop: 6 },

  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hostAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: T.elevated },
  hostName: { color: T.textSub, fontSize: 12, flex: 1 },
  hostRating: { color: T.gold, fontSize: 12, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', gap: 8 },
  metroChip: {
    backgroundColor: T.elevated, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: T.border,
  },
  metroText: { color: T.textSub, fontSize: 11 },
  spotChip: {
    backgroundColor: 'rgba(0,211,127,0.1)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(0,211,127,0.3)',
  },
  spotFull: { backgroundColor: 'rgba(255,90,90,0.1)', borderColor: 'rgba(255,90,90,0.3)' },
  spotText: { color: T.green, fontSize: 11, fontWeight: '600' },
  spotTextFull: { color: '#FF5A5A' },
  agePill: {
    backgroundColor: T.elevated, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: T.border,
  },
  ageText: { color: T.textSub, fontSize: 11 },

  tagRow: { flexDirection: 'row', gap: 6 },
  tag: {
    backgroundColor: T.elevated, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: T.border,
  },
  tagText: { color: T.textMute, fontSize: 11 },
});
