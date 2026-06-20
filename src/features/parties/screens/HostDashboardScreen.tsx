import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../../features/auth/authStore';
import { useTheme } from '../../../theme/ThemeContext';
import { fetchHostEvents, type Event } from '../../../services/eventService';

type Props = { navigation: any };

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function statusColor(status: Event['status']) {
  if (status === 'upcoming') return '#00D37F';
  if (status === 'ongoing')  return '#F59E0B';
  return 'rgba(244,242,236,0.35)';
}

export default function HostDashboardScreen({ navigation }: Props) {
  const { T, isDark } = useTheme();
  const { profile, session } = useAuthStore();

  const [events,     setEvents]     = useState<Event[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    const data = await fetchHostEvents(session.user.id);
    setEvents(data);
    setLoading(false);
    setRefreshing(false);
  }, [session?.user?.id]);

  useEffect(() => { load(); }, [load]);

  function onRefresh() { setRefreshing(true); load(); }

  const totalRsvps    = events.reduce((sum, e) => sum + (e.booking_count ?? 0), 0);
  const upcomingCount = events.filter(e => e.status === 'upcoming').length;

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />}
        >
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={[s.greeting, { color: T.textMute }]}>Host studio</Text>
              <Text style={[s.name, { color: T.text }]}>{profile?.display_name ?? 'Your events'}</Text>
            </View>
            <TouchableOpacity
              style={[s.createBtn, { backgroundColor: T.accent }]}
              onPress={() => navigation.navigate('CreateEvent')}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={20} color={T.onAccent} />
            </TouchableOpacity>
          </View>

          {/* Stats strip */}
          <View style={[s.statsRow, { backgroundColor: T.surface, borderColor: T.border }]}>
            {[
              { val: String(events.length),  label: 'EVENTS' },
              { val: String(totalRsvps),     label: 'TOTAL RSVPs' },
              { val: String(upcomingCount),  label: 'UPCOMING' },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <View style={[s.statDiv, { backgroundColor: T.border }]} />}
                <View style={s.statCol}>
                  <Text style={[s.statVal, { color: T.text }]}>{item.val}</Text>
                  <Text style={[s.statLbl, { color: T.textMute }]}>{item.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Events list */}
          <Text style={[s.sectionTitle, { color: T.text }]}>Your Events</Text>

          {loading ? (
            <View style={s.centered}>
              <ActivityIndicator color={T.accent} />
            </View>
          ) : events.length === 0 ? (
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: T.surface }]}>
                <Feather name="calendar" size={28} color={T.textMute} />
              </View>
              <Text style={[s.emptyTitle, { color: T.text }]}>No events yet</Text>
              <Text style={[s.emptySub, { color: T.textMute }]}>Tap + to create your first house party</Text>
              <TouchableOpacity
                style={[s.createEventBtn, { backgroundColor: T.accent }]}
                onPress={() => navigation.navigate('CreateEvent')}
                activeOpacity={0.88}
              >
                <Text style={[s.createEventText, { color: T.onAccent }]}>Create event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            events.map(event => (
              <TouchableOpacity
                key={event.id}
                style={[s.eventCard, { backgroundColor: T.surface, borderColor: T.border }]}
                onPress={() => navigation.navigate('ManageGuests', { eventId: event.id, eventTitle: event.title })}
                activeOpacity={0.82}
              >
                <View style={s.cardTop}>
                  <View style={[s.statusDot, { backgroundColor: statusColor(event.status) }]} />
                  <Text style={[s.statusText, { color: statusColor(event.status) }]}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <Text style={[s.dateText, { color: T.textMute }]}>{formatDate(event.date)}</Text>
                </View>

                <Text style={[s.cardTitle, { color: T.text }]} numberOfLines={1}>{event.title}</Text>
                {event.area ? <Text style={[s.cardArea, { color: T.textSub }]}>{event.area}</Text> : null}

                <View style={s.cardFooter}>
                  <View style={[s.rsvpBadge, { backgroundColor: 'rgba(232,227,216,0.10)' }]}>
                    <Feather name="users" size={12} color={T.accent} />
                    <Text style={[s.rsvpCount, { color: T.accent }]}>{event.booking_count ?? 0} RSVPs</Text>
                  </View>
                  <Text style={[s.capacityText, { color: T.textMute }]}>of {event.capacity}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={[s.feeText, { color: T.textSub }]}>
                    {event.entry_fee === 0 ? 'Free' : `₹${event.entry_fee}`}
                  </Text>
                  <Feather name="chevron-right" size={16} color={T.textMute} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },

  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, marginBottom: 20 },
  greeting:  { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  name:      { fontSize: 26, fontWeight: '700', letterSpacing: -0.8 },
  createBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, paddingVertical: 18, marginBottom: 28 },
  statCol:  { flex: 1, alignItems: 'center' },
  statDiv:  { width: 1, marginVertical: 4 },
  statVal:  { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginBottom: 2 },
  statLbl:  { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },

  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4, marginBottom: 14 },

  centered: { paddingVertical: 60, alignItems: 'center' },
  empty:    { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon:     { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:    { fontSize: 17, fontWeight: '600' },
  emptySub:      { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  createEventBtn:{ marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24 },
  createEventText:{ fontSize: 15, fontWeight: '700' },

  eventCard:   { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 12 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusText:  { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  dateText:    { fontSize: 12 },
  cardTitle:   { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },
  cardArea:    { fontSize: 13, marginBottom: 14 },
  cardFooter:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rsvpBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  rsvpCount:   { fontSize: 12, fontWeight: '600' },
  capacityText:{ fontSize: 12 },
  feeText:     { fontSize: 13, fontWeight: '500', marginRight: 4 },
});
