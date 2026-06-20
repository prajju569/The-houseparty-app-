import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, FlatList, Dimensions, StatusBar, Platform, Alert,
  Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { getUserBookings, cancelBooking, cacheBookingsOffline, getCachedBookings } from '../../../services/bookingService';
import type { Booking } from '../../../services/bookingService';
import { fetchPublicEvents, type Event as SupaEvent } from '../../../services/eventService';
import { supabase } from '../../../services/supabaseClient';
import { useAuthStore } from '../../../features/auth/authStore';
import { cancelEventReminders } from '../../../services/notificationService';
import { useTheme } from '../../../theme/ThemeContext';
import { useLocationStore } from '../../../store/locationStore';

const { width: W } = Dimensions.get('window');

const FILTERS = ['All', 'Tonight', 'Free', 'Music', 'Networking', 'College', 'Rooftop'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function canCancelBooking(eventDate: string): boolean {
  return new Date(eventDate).getTime() - Date.now() > 24 * 60 * 60 * 1000;
}

type EnrichedBooking = { booking: Booking; event: SupaEvent };

function getUpcomingBookings(bookings: Booking[], events: SupaEvent[]): EnrichedBooking[] {
  const now = new Date();
  return bookings
    .map(b => ({ booking: b, event: events.find(e => e.id === b.eventId) }))
    .filter((x): x is EnrichedBooking => !!x.event && new Date(x.event.date) > now)
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());
}

// ── Up-next ticket teaser ─────────────────────────────────────────────────────
function UpNextCard({
  enriched,
  navigation,
  onCancelled,
  userId,
}: {
  enriched: EnrichedBooking;
  navigation: any;
  onCancelled: (id: string) => void;
  userId: string | null;
}) {
  const { T } = useTheme();
  const s = makeStyles(T);
  const [cancelling, setCancelling] = useState(false);
  const { booking, event } = enriched;
  const isWaitlist = booking.status === 'waitlist';
  const eventDate = new Date(event.date);
  const isToday = eventDate.toDateString() === new Date().toDateString();
  const dateLabel = isToday
    ? `Tonight · ${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    : eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  function handleCancel() {
    if (!canCancelBooking(event.date)) {
      Alert.alert('Too close to cancel', 'Cancellations close 24 h before the event.');
      return;
    }
    Alert.alert(
      isWaitlist ? 'Leave Waitlist?' : 'Cancel RSVP?',
      `Cancel your spot for "${event.title}"?`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const { error } = await cancelBooking(userId, booking.id);
            setCancelling(false);
            if (error) { Alert.alert('Error', error); return; }
            await cancelEventReminders(booking.bookingRef).catch(() => {});
            onCancelled(booking.id);
          },
        },
      ]
    );
  }

  return (
    <TouchableOpacity
      style={s.upNext}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('EventDetail', { eventId: event.id, alreadyRsvped: true })}
    >
      <Image source={{ uri: event.cover_image ?? undefined }} style={s.upNextImg} />
      <View style={s.upNextOverlay} />
      <View style={s.upNextContent}>
        <View style={[s.statusBadge, isWaitlist ? s.badgeAmber : s.badgeGreen]}>
          <Text style={s.statusBadgeText}>{isWaitlist ? 'Waitlist' : '✓ Confirmed'}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={s.upNextDate}>{dateLabel}</Text>
        <Text style={s.upNextTitle}>{event.title}</Text>
        <View style={s.upNextRow}>
          <Feather name="map-pin" size={12} color={T.textSub} />
          <Text style={s.upNextMeta}>{event.area ?? event.venue ?? ''}{event.metro_distance ? ` · ${event.metro_distance}` : ''}</Text>
          <TouchableOpacity style={s.cancelSmall} onPress={handleCancel} disabled={cancelling}>
            <Text style={s.cancelSmallText}>{cancelling ? '...' : 'Cancel'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Event card (trending rail) ────────────────────────────────────────────────
function EventCard({ event, navigation }: { event: SupaEvent; navigation: any }) {
  const { T } = useTheme();
  const s = makeStyles(T);
  const booked       = event.booking_count ?? 0;
  const spotsLeft    = Math.max(0, event.capacity - booked);
  const isFull       = spotsLeft === 0;
  const isAlmostFull = !isFull && spotsLeft <= 5;
  const isFree       = event.entry_fee === 0;

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.88}
      onPress={() =>
        navigation.navigate(event.status === 'closed' ? 'ClosedEvent' : 'EventDetail', { eventId: event.id })
      }
    >
      <Image source={{ uri: event.cover_image ?? undefined }} style={s.cardImg} />
      <View style={s.cardGradient} />
      {isFull && <View style={s.cardFullBadge}><Text style={s.cardFullText}>SOLD OUT</Text></View>}
      {isAlmostFull && <View style={s.cardAlmostBadge}><Text style={s.cardAlmostText}>🔥 {spotsLeft} left</Text></View>}
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
        <View style={s.cardRow}>
          <Text style={s.cardMeta}>{event.area ?? event.venue ?? ''}</Text>
          <View style={s.cardDot} />
          <Text style={[s.cardFee, isFree && s.cardFeeFree]}>
            {isFree ? 'Free' : `₹${event.entry_fee}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Featured hero card ────────────────────────────────────────────────────────
function FeaturedCard({ event, navigation }: { event: SupaEvent; navigation: any }) {
  const { T } = useTheme();
  const s = makeStyles(T);
  const booked       = event.booking_count ?? 0;
  const spotsLeft    = Math.max(0, event.capacity - booked);
  const isFull       = spotsLeft === 0;
  const isAlmostFull = !isFull && spotsLeft <= 5;

  return (
    <TouchableOpacity
      style={s.featured}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
    >
      <Image source={{ uri: event.cover_image ?? undefined }} style={s.featuredImg} />
      <View style={s.featuredGradient} />

      <View style={s.featuredTop}>
        <View style={s.featuredBadge}>
          <Text style={s.featuredBadgeText}>FEATURED</Text>
        </View>
        {isAlmostFull && (
          <View style={s.almostBadge}>
            <Text style={s.almostBadgeText}>🔥 {spotsLeft} left</Text>
          </View>
        )}
      </View>

      <View style={s.featuredBottom}>
        <Text style={s.featuredTitle} numberOfLines={2}>{event.title}</Text>
        <View style={s.featuredRow}>
          <View style={s.featuredMeta}>
            <Text style={s.featuredMetaText}>
              {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View style={s.cardDot} />
            <Text style={s.featuredMetaText}>{event.area ?? event.venue ?? ''}</Text>
            <View style={s.cardDot} />
            <Text style={s.featuredMetaText}>{booked} going</Text>
          </View>
          <TouchableOpacity
            style={s.rsvpBtn}
            onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            activeOpacity={0.85}
          >
            <Text style={s.rsvpText}>RSVP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function GuestDashboardScreen({ navigation }: any) {
  const { T } = useTheme();
  const s = makeStyles(T);
  const { profile } = useAuthStore();
  const { area, city, setArea } = useLocationStore();
  const [bookings,      setBookings]      = useState<Booking[]>([]);
  const [events,        setEvents]        = useState<SupaEvent[]>([]);
  const [filter,        setFilter]        = useState('All');
  const [locationModal, setLocationModal] = useState(false);
  const [locQuery,      setLocQuery]      = useState('');
  const [locSuggestions, setLocSuggestions] = useState<{ name: string; city: string }[]>([]);
  const [locSearching,  setLocSearching]  = useState(false);
  const locDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = profile?.id ?? null;
  const displayName = profile?.display_name ?? 'there';

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : hour < 22 ? 'Good evening' : 'Good night';

  useFocusEffect(
    useCallback(() => {
      (async () => {
        // Load events from Supabase
        fetchPublicEvents(30).then(setEvents).catch(() => {});
        // Load bookings
        try {
          const data = await getUserBookings(userId);
          setBookings(data);
          await cacheBookingsOffline(data);
        } catch {
          const cached = await getCachedBookings();
          if (cached) setBookings(cached);
        }
      })();
    }, [userId])
  );

  // Real-time: listen for new/updated events and refresh instantly
  useEffect(() => {
    const channel = supabase.channel('dashboard-events-' + Date.now());
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchPublicEvents(30).then(setEvents).catch(() => {});
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  // Location search via Nominatim
  function onLocQueryChange(text: string) {
    setLocQuery(text);
    if (locDebounce.current) clearTimeout(locDebounce.current);
    if (text.length < 2) { setLocSuggestions([]); return; }
    locDebounce.current = setTimeout(async () => {
      setLocSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=6&countrycodes=in`;
        const res  = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'HousepartyApp/1.0' } });
        const json = await res.json();
        setLocSuggestions(json.map((r: any) => ({
          name:  r.address?.suburb ?? r.address?.city_district ?? r.address?.city ?? r.display_name.split(',')[0],
          city:  r.address?.city ?? r.address?.state ?? '',
        })));
      } catch { setLocSuggestions([]); }
      finally { setLocSearching(false); }
    }, 400);
  }

  function pickLocation(name: string, cityName: string) {
    setArea(name, cityName);
    setLocationModal(false);
    setLocQuery('');
    setLocSuggestions([]);
  }

  const upcoming = getUpcomingBookings(bookings, events);
  const nextTicket = upcoming[0] ?? null;

  const today = new Date().toDateString();
  const filteredEvents = events.filter(e => {
    if (filter === 'All') return true;
    if (filter === 'Tonight') return new Date(e.date).toDateString() === today;
    if (filter === 'Free') return e.entry_fee === 0;
    const lf = filter.toLowerCase();
    return (e.vibe ?? []).some((v: string) => v.toLowerCase().includes(lf)) ||
           e.title.toLowerCase().includes(lf);
  });

  const featuredEvent = events.find(e => e.status === 'upcoming') ?? null;
  const trendingEvents = events.filter(e => e.id !== featuredEvent?.id && e.status === 'upcoming').slice(0, 6);

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={s.header}>
            <View>
              <Text style={s.greetingText}>{greeting}</Text>
              <Text style={s.greetingName}>{displayName}</Text>
            </View>
            <TouchableOpacity style={s.locationPill} activeOpacity={0.8} onPress={() => setLocationModal(true)}>
              <View style={s.locationDot} />
              <Text style={s.locationText}>{area || city || 'Locating…'}</Text>
              <Feather name="chevron-down" size={12} color="rgba(232,227,216,0.6)" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Search bar */}
        <TouchableOpacity
          style={s.searchBar}
          onPress={() => navigation.navigate('Discover')}
          activeOpacity={0.85}
        >
          <Feather name="search" size={17} color={T.textMute} />
          <Text style={s.searchPlaceholder}>Search parties, hosts, vibes…</Text>
        </TouchableOpacity>

        {/* Up-next ticket teaser */}
        {nextTicket && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>UP NEXT</Text>
            <UpNextCard
              enriched={nextTicket}
              navigation={navigation}
              onCancelled={id => setBookings(prev => prev.filter(b => b.id !== id))}
              userId={userId}
            />
          </View>
        )}

        {/* Featured hero */}
        {featuredEvent && (
          <View style={s.section}>
            <FeaturedCard event={featuredEvent} navigation={navigation} />
          </View>
        )}

        {/* Filter chips */}
        <View style={s.sectionRow}>
          <FlatList
            horizontal
            data={FILTERS}
            keyExtractor={i => i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.chip, filter === item && s.chipActive]}
                onPress={() => setFilter(item)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, filter === item && s.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Trending rail */}
        <View style={s.section}>
          <View style={s.railHeader}>
            <Text style={s.railTitle}>Trending tonight</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Discover')} activeOpacity={0.7}>
              <Text style={s.railSeeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={filteredEvents.length > 0 ? filteredEvents : trendingEvents}
            keyExtractor={e => e.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.railList}
            renderItem={({ item }) => <EventCard event={item} navigation={navigation} />}
            ListEmptyComponent={
              <Text style={[s.textMute, { padding: 8 }]}>No events match this filter.</Text>
            }
          />
        </View>

        {/* Bottom padding for floating nav */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Location picker modal */}
      <Modal visible={locationModal} transparent animationType="slide" onRequestClose={() => setLocationModal(false)}>
        <TouchableOpacity style={ls.backdrop} activeOpacity={1} onPress={() => setLocationModal(false)} />
        <View style={ls.sheet}>
          <View style={ls.handle} />
          <Text style={ls.title}>Change location</Text>

          <View style={ls.searchRow}>
            <Feather name="search" size={16} color="rgba(232,227,216,0.45)" />
            <TextInput
              style={ls.input}
              value={locQuery}
              onChangeText={onLocQueryChange}
              placeholder="Search area or neighbourhood…"
              placeholderTextColor="rgba(244,242,236,0.3)"
              autoFocus
              autoCorrect={false}
            />
            {locSearching && <ActivityIndicator size="small" color="rgba(232,227,216,0.5)" />}
          </View>

          {locSuggestions.length > 0 && (
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 300 }}>
              {locSuggestions.map((s2, i) => (
                <TouchableOpacity
                  key={i}
                  style={[ls.suggestion, i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' }]}
                  onPress={() => pickLocation(s2.name, s2.city)}
                  activeOpacity={0.75}
                >
                  <Feather name="map-pin" size={14} color="rgba(232,227,216,0.4)" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={ls.suggName}>{s2.name}</Text>
                    {s2.city ? <Text style={ls.suggCity}>{s2.city}</Text> : null}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {locQuery.length === 0 && (
            <Text style={ls.hint}>Start typing to search — e.g. "Bandra", "Koramangala"</Text>
          )}
        </View>
      </Modal>

    </View>
  );
}

// Location modal styles (module-level, theme-independent dark sheet)
const ls = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 20,
  },
  title:    { color: '#F4F2EC', fontSize: 20, fontWeight: '700', letterSpacing: -0.4, marginBottom: 16 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14, height: 50, marginBottom: 8,
  },
  input:    { flex: 1, color: '#F4F2EC', fontSize: 15 },
  suggestion: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  suggName: { color: '#F4F2EC', fontSize: 15, fontWeight: '600' },
  suggCity: { color: 'rgba(244,242,236,0.45)', fontSize: 12, marginTop: 2 },
  hint:     { color: 'rgba(244,242,236,0.3)', fontSize: 13, marginTop: 16, textAlign: 'center' },
});

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles(T: any) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 18,
  },
  greetingText: {
    fontSize: 13,
    color: T.textMute,
    fontWeight: '500',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 30,
    fontWeight: '600',
    color: T.text,
    letterSpacing: -1,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: T.surfaceHigh,
    borderWidth: 1,
    borderColor: T.borderHigh,
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.accent,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    color: T.textSub,
  },

  // search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: T.surfaceHigh,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 24,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: T.textMute,
  },

  // section
  section: { marginBottom: 28 },
  sectionRow: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: T.textMute,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // up-next ticket
  upNext: {
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
  },
  upNextImg: {
    position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
    borderRadius: 24,
  },
  upNextOverlay: {
    position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
    backgroundColor: 'rgba(9,9,9,0.6)',
  },
  upNextContent: {
    flex: 1,
    padding: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeGreen: { backgroundColor: 'rgba(0,211,127,0.18)', borderWidth: 1, borderColor: 'rgba(0,211,127,0.3)' },
  badgeAmber: { backgroundColor: T.amberDim, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: T.text,
    letterSpacing: 0.3,
  },
  upNextDate: {
    fontSize: 11,
    fontWeight: '500',
    color: T.textSub,
    marginBottom: 2,
  },
  upNextTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: T.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  upNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  upNextMeta: {
    flex: 1,
    fontSize: 12,
    color: T.textSub,
  },
  cancelSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,90,90,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,90,90,0.25)',
  },
  cancelSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF5A5A',
  },

  // featured hero
  featured: {
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.borderHigh,
  },
  featuredImg: {
    position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
    borderRadius: 28,
  },
  featuredGradient: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 160,
    backgroundColor: 'rgba(9,9,9,0.75)',
  },
  featuredTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: 'rgba(232,227,216,0.92)',
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#090909',
    letterSpacing: 1,
  },
  almostBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: T.amberDim,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
  },
  almostBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: T.amber,
  },
  featuredBottom: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: T.text,
    letterSpacing: -0.5,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(244,242,236,0.8)',
  },
  rsvpBtn: {
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: T.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.onAccent,
    letterSpacing: 0.5,
  },

  // filter chips
  filterList: {
    paddingBottom: 4,
    gap: 9,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  chipActive: {
    backgroundColor: T.accent,
    borderColor: T.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: T.textSub,
  },
  chipTextActive: {
    color: T.onAccent,
    fontWeight: '600',
  },

  // trending rail
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  railTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: T.text,
    letterSpacing: -0.3,
  },
  railSeeAll: {
    fontSize: 13,
    fontWeight: '500',
    color: T.accent,
  },
  railList: {
    gap: 14,
    paddingRight: 20,
  },
  card: {
    width: (W - 60) / 2,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardImg: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  cardGradient: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: 'transparent',
  },
  cardFullBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,90,90,0.9)',
  },
  cardFullText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.8,
  },
  cardAlmostBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.9)',
  },
  cardAlmostText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: T.text,
    marginBottom: 5,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMeta: {
    fontSize: 12,
    color: T.textMute,
    flex: 1,
  },
  cardDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: T.textMute,
  },
  cardFee: {
    fontSize: 12,
    fontWeight: '600',
    color: T.textSub,
  },
  cardFeeFree: {
    color: T.green,
  },

  textMute: { color: T.textMute, fontSize: 13 },
}); }
