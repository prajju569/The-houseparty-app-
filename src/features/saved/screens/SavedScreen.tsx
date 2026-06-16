import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EVENTS, SAVED_EVENT_IDS } from '../../../data/fakeData';
import { BottomNav } from '../../../shared/components/BottomNav';

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.15)',
  green: '#00D37F', greenDim: 'rgba(0,211,127,0.15)',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
};

export default function SavedScreen({ navigation }: any) {
  const [savedIds, setSavedIds] = useState(new Set(SAVED_EVENT_IDS));
  const saved = EVENTS.filter(e => savedIds.has(e.id));

  function unsave(id: string) {
    Alert.alert('Remove from Saved?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setSavedIds(prev => { const s = new Set(prev); s.delete(id); return s; }) },
    ]);
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>Saved</Text>
          <Text style={s.sub}>{saved.length} events bookmarked</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
          {saved.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔖</Text>
              <Text style={s.emptyTitle}>Nothing saved yet</Text>
              <Text style={s.emptySub}>Tap the heart icon on any party to save it here</Text>
              <TouchableOpacity
                style={s.exploreBtn}
                onPress={() => navigation.navigate('Discover')}
              >
                <Text style={s.exploreBtnText}>Browse Parties →</Text>
              </TouchableOpacity>
            </View>
          )}

          {saved.map(event => {
            const d = new Date(event.date);
            const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
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
                <Image source={{ uri: event.coverImage }} style={s.cardImg} resizeMode="cover" />
                {isClosed && (
                  <View style={s.closedOverlay}>
                    <Text style={s.closedLabel}>CLOSED · Rate it →</Text>
                  </View>
                )}

                <View style={s.cardBody}>
                  <View style={s.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardDate}>{dateStr.toUpperCase()}</Text>
                      <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
                      <Text style={s.cardArea}>{event.area}, {event.city}</Text>
                    </View>
                    <TouchableOpacity style={s.unsaveBtn} onPress={() => unsave(event.id)}>
                      <Text style={s.unsaveIcon}>❤️</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={s.pills}>
                    <View style={s.pill}>
                      <Text style={s.pillText}>{event.fee === 0 ? 'Free' : `₹${event.fee}`}</Text>
                    </View>
                    <View style={s.pill}>
                      <Text style={s.pillText}>🚇 {event.metroDistance}</Text>
                    </View>
                    <View style={[s.pill, event.spotsLeft === 0 ? s.pillFull : s.pillSpots]}>
                      <Text style={[s.pillText, event.spotsLeft === 0 ? s.pillTextFull : s.pillTextSpots]}>
                        {event.spotsLeft === 0 ? 'Full' : `${event.spotsLeft} spots`}
                      </Text>
                    </View>
                  </View>

                  <View style={s.hostRow}>
                    <Image source={{ uri: event.host.avatar }} style={s.hostAvatar} />
                    <Text style={s.hostName}>{event.host.name}</Text>
                    <Text style={s.hostRating}>★ {event.host.rating}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
      <BottomNav navigation={navigation} active="Saved" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { color: T.text, fontSize: 26, fontWeight: '800' },
  sub: { color: T.textMute, fontSize: 12, marginTop: 2 },

  list: { paddingHorizontal: 20, gap: 16 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { color: T.text, fontSize: 20, fontWeight: '700' },
  emptySub: { color: T.textSub, fontSize: 14, textAlign: 'center', maxWidth: 260 },
  exploreBtn: {
    marginTop: 12, backgroundColor: T.gold, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  exploreBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },

  card: {
    backgroundColor: T.card, borderRadius: 20,
    borderWidth: 1, borderColor: T.border, overflow: 'hidden',
  },
  cardImg: { width: '100%', height: 160 },
  closedOverlay: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(255,90,90,0.15)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,90,90,0.4)',
  },
  closedLabel: { color: '#FF5A5A', fontSize: 11, fontWeight: '700' },

  cardBody: { padding: 16, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardDate: { color: T.gold, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 2 },
  cardTitle: { color: T.text, fontSize: 17, fontWeight: '700' },
  cardArea: { color: T.textSub, fontSize: 12, marginTop: 2 },
  unsaveBtn: { padding: 4 },
  unsaveIcon: { fontSize: 22 },

  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    backgroundColor: T.elevated, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: T.border,
  },
  pillSpots: { backgroundColor: 'rgba(0,211,127,0.1)', borderColor: 'rgba(0,211,127,0.3)' },
  pillFull: { backgroundColor: 'rgba(255,90,90,0.1)', borderColor: 'rgba(255,90,90,0.3)' },
  pillText: { color: T.textSub, fontSize: 12 },
  pillTextSpots: { color: T.green, fontWeight: '600' },
  pillTextFull: { color: '#FF5A5A', fontWeight: '600' },

  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hostAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.elevated },
  hostName: { color: T.textSub, fontSize: 12, flex: 1 },
  hostRating: { color: T.gold, fontSize: 12, fontWeight: '600' },
});
