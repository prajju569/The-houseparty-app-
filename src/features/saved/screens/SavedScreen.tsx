import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, Alert, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../../features/auth/authStore';
import { supabase } from '../../../services/supabaseClient';
import { fetchEvent, type Event as SupaEvent } from '../../../services/eventService';

const { width: W } = Dimensions.get('window');

type TabId = 'upcoming' | 'interested' | 'past';
const TABS: { id: TabId; label: string }[] = [
  { id: 'upcoming',   label: 'Upcoming'   },
  { id: 'interested', label: 'Interested' },
  { id: 'past',       label: 'Past'       },
];

export default function SavedScreen({ navigation }: any) {
  const { T } = useTheme();
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? null;
  const [savedEvents, setSavedEvents] = useState<SupaEvent[]>([]);
  const [activeTab,   setActiveTab]   = useState<TabId>('upcoming');

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      // Fetch events the user has bookmarked (saved_events table) or booked
      supabase
        .from('saved_events')
        .select('event_id')
        .eq('user_id', userId)
        .then(async ({ data }) => {
          if (!data?.length) { setSavedEvents([]); return; }
          const events = await Promise.all(data.map(r => fetchEvent(r.event_id)));
          setSavedEvents(events.filter(Boolean) as SupaEvent[]);
        })
        .then(undefined, () => setSavedEvents([]));
    }, [userId])
  );

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    safe: { flex: 1 },

    header: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 18 },
    title:  { color: T.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 },

    tabsRow: {
      flexDirection: 'row', gap: 9,
      paddingHorizontal: 22, marginBottom: 20,
    },
    tab: {
      paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999,
      backgroundColor: T.surface,
      borderWidth: 1, borderColor: T.border,
    },
    tabActive:    { backgroundColor: 'rgba(232,227,216,0.92)', borderColor: 'transparent' },
    tabText:      { color: T.textMute, fontSize: 13, fontWeight: '600' },
    tabTextActive:{ color: T.onAccent, fontSize: 13, fontWeight: '700' },

    list: { paddingHorizontal: 22, gap: 14 },

    empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
    emptyIcon:  { fontSize: 48, marginBottom: 4 },
    emptyTitle: { color: T.text, fontSize: 20, fontWeight: '700' },
    emptySub:   { color: T.textSub, fontSize: 14, textAlign: 'center', maxWidth: 260 },
    exploreBtn: {
      marginTop: 12, backgroundColor: T.accent, borderRadius: 14,
      paddingHorizontal: 24, paddingVertical: 13,
    },
    exploreBtnText: { color: T.onAccent, fontSize: 15, fontWeight: '700' },

    card: {
      height: 148, borderRadius: 22, overflow: 'hidden',
      backgroundColor: T.elevated,
      borderWidth: 1, borderColor: T.border,
      ...Platform.select({
        ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 },
        android: { elevation: 10 },
      }),
    },
    cardCover: { position: 'absolute', inset: 0, width: '100%', height: '100%' } as any,
    cardGrad:  { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, backgroundColor: 'rgba(9,9,9,0.76)' },

    bookmarkBtn: {
      position: 'absolute', top: 12, right: 14,
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: 'rgba(9,9,9,0.5)',
      alignItems: 'center', justifyContent: 'center',
    },
    bookmarkIcon: { fontSize: 15 },

    closedBadge: {
      position: 'absolute', top: 12, left: 14,
      backgroundColor: 'rgba(255,90,90,0.20)',
      borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
      borderWidth: 1, borderColor: 'rgba(255,90,90,0.4)',
    },
    closedText: { color: T.red, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },

    cardInfo:  { position: 'absolute', left: 14, right: 14, bottom: 14 },
    cardDate:  { color: 'rgba(244,242,236,0.55)', fontSize: 10, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 },
    cardTitle: { color: T.text, fontSize: 16, fontWeight: '600', letterSpacing: -0.3 },
  });

  const now = Date.now();
  const filtered = savedEvents.filter(e => {
    const ts     = new Date(e.date).getTime();
    const closed = e.status === 'closed';
    if (activeTab === 'upcoming')   return !closed && ts > now;
    if (activeTab === 'interested') return !closed && ts <= now;
    return closed;
  });

  function unsave(id: string) {
    Alert.alert('Remove from Saved?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          if (userId) supabase.from('saved_events').delete().eq('user_id', userId).eq('event_id', id).then(() => {});
          setSavedEvents(prev => prev.filter(e => e.id !== id));
        },
      },
    ]);
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>Saved</Text>
        </View>

        <View style={s.tabsRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[s.tab, activeTab === t.id && s.tabActive]}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, activeTab === t.id && s.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
          {filtered.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔖</Text>
              <Text style={s.emptyTitle}>Nothing here yet</Text>
              <Text style={s.emptySub}>Tap the bookmark on any party to save it</Text>
              <TouchableOpacity style={s.exploreBtn} onPress={() => navigation.navigate('Discover')}>
                <Text style={s.exploreBtnText}>Browse Parties →</Text>
              </TouchableOpacity>
            </View>
          )}

          {filtered.map(event => {
            const d        = new Date(event.date);
            const dateStr  = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr  = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const isClosed = event.status === 'closed';

            return (
              <TouchableOpacity
                key={event.id}
                style={s.card}
                activeOpacity={0.88}
                onPress={() => navigation.navigate(
                  isClosed ? 'ClosedEvent' : 'EventDetail',
                  { eventId: event.id }
                )}
              >
                {event.cover_image && <Image source={{ uri: event.cover_image }} style={s.cardCover} resizeMode="cover" />}
                <View style={s.cardGrad} />

                <TouchableOpacity style={s.bookmarkBtn} onPress={() => unsave(event.id)} activeOpacity={0.8}>
                  <Text style={s.bookmarkIcon}>🔖</Text>
                </TouchableOpacity>

                {isClosed && (
                  <View style={s.closedBadge}>
                    <Text style={s.closedText}>ENDED · Rate it →</Text>
                  </View>
                )}

                <View style={s.cardInfo}>
                  <Text style={s.cardDate}>{dateStr.toUpperCase()} · {timeStr}</Text>
                  <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
