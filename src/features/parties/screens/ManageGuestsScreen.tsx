import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import {
  fetchEventBookings,
  updateBookingStatus,
  type EventBooking,
} from '../../../services/eventService';

type Props = { route: any; navigation: any };

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

function statusColor(status: EventBooking['status']) {
  if (status === 'confirmed') return '#00D37F';
  if (status === 'pending')   return '#F59E0B';
  return 'rgba(244,242,236,0.25)';
}

function statusLabel(status: EventBooking['status']) {
  if (status === 'confirmed') return 'Confirmed';
  if (status === 'pending')   return 'Pending';
  return 'Denied';
}

export default function ManageGuestsScreen({ route, navigation }: Props) {
  const { eventId, eventTitle = 'Event' } = (route.params ?? {}) as { eventId?: string; eventTitle?: string };
  const { T, isDark } = useTheme();

  const [bookings,   setBookings]   = useState<EventBooking[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query,      setQuery]      = useState('');
  const [updating,   setUpdating]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    const data = await fetchEventBookings(eventId);
    setBookings(data);
    setLoading(false);
    setRefreshing(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  function onRefresh() { setRefreshing(true); load(); }

  async function handleAction(bookingId: string, status: 'confirmed' | 'cancelled') {
    const label = status === 'confirmed' ? 'approve' : 'deny';
    Alert.alert(
      status === 'confirmed' ? 'Approve guest?' : 'Deny guest?',
      `This will ${label} their RSVP.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'confirmed' ? 'Approve' : 'Deny',
          style: status === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            setUpdating(bookingId);
            const ok = await updateBookingStatus(bookingId, status);
            setUpdating(null);
            if (ok) {
              setBookings(prev =>
                prev.map(b => b.id === bookingId ? { ...b, status } : b)
              );
            } else {
              Alert.alert('Error', 'Could not update status. Try again.');
            }
          },
        },
      ]
    );
  }

  const filtered = bookings.filter(b => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const name = (b.profiles?.display_name ?? '').toLowerCase();
    const user = (b.profiles?.username ?? '').toLowerCase();
    return name.includes(q) || user.includes(q);
  });

  const total     = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const pending   = bookings.filter(b => b.status === 'pending').length;
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={T.textMute} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: T.text }]} numberOfLines={1}>{eventTitle}</Text>
            <Text style={[s.headerSub, { color: T.textMute }]}>Guest list</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(232,227,216,0.10)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(232,227,216,0.20)' }}
            onPress={() => navigation.navigate('ScanTicket', { eventId })}
            activeOpacity={0.8}
          >
            <Text style={{ color: T.accent, fontWeight: '700', fontSize: 13 }}>📷 Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={[s.statsRow, { backgroundColor: T.surface, borderColor: T.border }]}>
          {[
            { val: total,     label: 'TOTAL' },
            { val: confirmed, label: 'CONFIRMED' },
            { val: pending,   label: 'PENDING' },
            { val: cancelled, label: 'DENIED' },
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

        {/* Search */}
        <View style={[s.searchBox, { backgroundColor: T.surface, borderColor: T.border }]}>
          <Feather name="search" size={16} color={T.textMute} />
          <TextInput
            style={[s.searchInput, { color: T.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name…"
            placeholderTextColor={T.textMute}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Feather name="x" size={16} color={T.textMute} />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator color={T.accent} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />}
          >
            {filtered.length === 0 ? (
              <View style={s.empty}>
                <View style={[s.emptyIcon, { backgroundColor: T.surface }]}>
                  <Feather name="users" size={28} color={T.textMute} />
                </View>
                <Text style={[s.emptyTitle, { color: T.text }]}>
                  {bookings.length === 0 ? 'No RSVPs yet' : 'No results'}
                </Text>
                <Text style={[s.emptySub, { color: T.textMute }]}>
                  {bookings.length === 0
                    ? 'When guests RSVP, they\'ll appear here'
                    : 'Try a different search term'}
                </Text>
              </View>
            ) : (
              filtered.map(booking => {
                const name = booking.profiles?.display_name ?? 'Guest';
                const user = booking.profiles?.username ?? '';
                const isUpdating = updating === booking.id;
                const dim = booking.status === 'cancelled';

                return (
                  <View
                    key={booking.id}
                    style={[
                      s.guestCard,
                      { backgroundColor: T.surface, borderColor: T.border },
                      dim && s.guestCardDim,
                    ]}
                  >
                    {/* Avatar + info */}
                    <View style={[s.avatar, { backgroundColor: 'rgba(232,227,216,0.12)' }]}>
                      <Text style={[s.avatarText, { color: T.accent }]}>{initials(name)}</Text>
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[s.guestName, { color: T.text }]} numberOfLines={1}>{name}</Text>
                      {user ? <Text style={[s.guestUser, { color: T.textMute }]}>@{user}</Text> : null}
                      <View style={s.metaRow}>
                        <Text style={[s.meta, { color: T.textSub }]}>
                          {booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}
                        </Text>
                        <Text style={[s.meta, { color: T.textMute }]}>·</Text>
                        <Text style={[s.meta, { color: T.textMute }]}>{booking.booking_ref}</Text>
                      </View>
                    </View>

                    {/* Status + actions */}
                    <View style={s.actions}>
                      {isUpdating ? (
                        <ActivityIndicator size="small" color={T.accent} />
                      ) : booking.status === 'pending' ? (
                        <View style={s.actionBtns}>
                          <TouchableOpacity
                            style={[s.actionBtn, s.approveBtn]}
                            onPress={() => handleAction(booking.id, 'confirmed')}
                            activeOpacity={0.8}
                          >
                            <Feather name="check" size={14} color="#090909" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[s.actionBtn, s.denyBtn]}
                            onPress={() => handleAction(booking.id, 'cancelled')}
                            activeOpacity={0.8}
                          >
                            <Feather name="x" size={14} color="#090909" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={[s.statusBadge, { borderColor: statusColor(booking.status) }]}>
                          <Text style={[s.statusText, { color: statusColor(booking.status) }]}>
                            {statusLabel(booking.status)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  back:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, marginTop: 1 },

  statsRow: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, paddingVertical: 16, marginHorizontal: 20, marginBottom: 16 },
  statCol:  { flex: 1, alignItems: 'center' },
  statDiv:  { width: 1, marginVertical: 4 },
  statVal:  { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, marginBottom: 2 },
  statLbl:  { fontSize: 9, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },

  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 16, height: 48, borderRadius: 16, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  scroll:   { paddingHorizontal: 20, paddingBottom: 40 },

  empty:      { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon:  { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  guestCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 10 },
  guestCardDim: { opacity: 0.45 },

  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },

  guestName: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  guestUser: { fontSize: 12 },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta:      { fontSize: 11 },

  actions:    { alignItems: 'flex-end', gap: 6 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionBtn:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { backgroundColor: '#00D37F' },
  denyBtn:    { backgroundColor: '#EF4444' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusText:  { fontSize: 11, fontWeight: '600' },
});
