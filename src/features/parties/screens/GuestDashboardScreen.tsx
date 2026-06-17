import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet,
  Platform, Dimensions, StatusBar, Share, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { EVENTS, RAHUL } from '../../../data/fakeData';
import { SwipePartyCards } from '../../../shared/components/SwipePartyCards';
import { SocialProof } from '../../../shared/components/SocialProof';
import { getUserBookings, cancelBooking, cacheBookingsOffline, getCachedBookings } from '../../../services/bookingService';
import type { Booking } from '../../../services/bookingService';
import { useAuthStore } from '../../../features/auth/authStore';
import { cancelEventReminders } from '../../../services/notificationService';
import { BottomNav } from '../../../shared/components/BottomNav';

const W = Dimensions.get('window').width;

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.15)',
  green: '#00D37F', greenDim: 'rgba(0,211,127,0.15)',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
  amber: '#F59E0B', amberDim: 'rgba(245,158,11,0.15)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function canCancelBooking(eventDate: string): boolean {
  return new Date(eventDate).getTime() - Date.now() > 24 * 60 * 60 * 1000;
}

type EnrichedBooking = { booking: Booking; event: (typeof EVENTS)[0] };

function getUpcomingBookings(bookings: Booking[]): EnrichedBooking[] {
  const now = new Date();
  return bookings
    .map(b => ({ booking: b, event: EVENTS.find(e => e.id === b.eventId) }))
    .filter((x): x is EnrichedBooking => !!x.event && new Date(x.event.date) > now)
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children.toUpperCase()}</Text>;
}

function PerforatedDivider() {
  const dotCount = Math.floor((W - 80) / 14);
  return (
    <View style={s.perfRow}>
      <View style={s.perfNubLeft} />
      <View style={s.perfLine}>
        {Array.from({ length: dotCount }).map((_, i) => <View key={i} style={s.perfDot} />)}
      </View>
      <View style={s.perfNubRight} />
    </View>
  );
}

// ── Single ticket card ────────────────────────────────────────────────────────
function TicketCard({
  booking, event, navigation, onCancelled, userId,
}: {
  booking: Booking;
  event: (typeof EVENTS)[0];
  navigation: any;
  onCancelled: (id: string) => void;
  userId: string | null;
}) {
  const [cancelling, setCancelling] = useState(false);

  const eventDate = new Date(event.date);
  const isToday   = eventDate.toDateString() === new Date().toDateString();
  const dateLabel = isToday
    ? `TONIGHT · ${eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : `${eventDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()} · ${eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

  const isWaitlist   = booking.status === 'waitlist';
  const cancellable  = canCancelBooking(event.date);

  function handleCancel() {
    if (!cancellable) {
      Alert.alert(
        'Cancellation closed',
        'Cancellations are not allowed within 24 hours of the event.\n\nFor emergencies, contact the host directly.',
        [{ text: 'OK' }]
      );
      return;
    }

    const feeNote = event.fee > 0
      ? `\n\n⚠️ Entry fee of ₹${event.fee} is non-refundable once the event is within 24 hours.`
      : '';

    Alert.alert(
      isWaitlist ? 'Leave Waitlist?' : 'Cancel RSVP?',
      `Are you sure you want to ${isWaitlist ? 'leave the waitlist for' : 'cancel your RSVP to'} "${event.title}"?${feeNote}`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: isWaitlist ? 'Leave Waitlist' : 'Cancel RSVP',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const { error } = await cancelBooking(userId, booking.id);
            setCancelling(false);
            if (error) {
              Alert.alert('Error', error);
              return;
            }
            // Wrap in try-catch — expo-notifications may throw in Expo Go
            await cancelEventReminders(booking.bookingRef).catch(() => {});
            onCancelled(booking.id);
          },
        },
      ]
    );
  }

  return (
    <View style={s.ticket}>
      {/* Status badge */}
      <View style={isWaitlist ? s.waitlistBanner : s.confirmedBanner}>
        <Text style={isWaitlist ? s.waitlistBannerText : s.confirmedBannerText}>
          {isWaitlist ? '⏳  WAITLIST — we\'ll notify you if a spot opens' : '✓  CONFIRMED — you\'re in!'}
        </Text>
      </View>

      <View style={s.ticketTop}>
        <View style={s.ticketMeta}>
          <Text style={s.ticketEyebrow}>{dateLabel}</Text>
          <Text style={s.ticketTitle}>{event.title}</Text>
          <View style={s.ticketRow}>
            <View style={[s.verifiedDot, isWaitlist && { backgroundColor: T.amber }]} />
            <Text style={s.ticketHost}>Hosted by {event.host.name}</Text>
          </View>
        </View>
        <View style={s.ticketRight}>
          <View style={[s.ticketIdBox, isWaitlist && { borderColor: 'rgba(245,158,11,0.3)' }]}>
            <Text style={s.ticketIdLabel}>BOOKING ID</Text>
            <Text style={[s.ticketId, isWaitlist && { color: T.amber }]}>{booking.bookingRef}</Text>
          </View>
          <Text style={s.qrLabel}>{isWaitlist ? 'WAITLIST REF' : 'SHOW AT DOOR'}</Text>
        </View>
      </View>

      <PerforatedDivider />

      <View style={s.ticketBottom}>
        <View style={s.ticketDetail}>
          <Text style={s.detailLabel}>VENUE</Text>
          <Text style={s.detailValue}>{event.area}</Text>
          <Text style={s.detailSub}>🚇 {event.metroDistance}</Text>
        </View>
        <View style={s.ticketDetailDivider} />
        <View style={s.ticketDetail}>
          <Text style={s.detailLabel}>ENTRY</Text>
          <Text style={[s.detailValue, s.goldText]}>
            {event.fee === 0 ? 'Free' : `₹${event.fee}`}
          </Text>
          <Text style={s.detailSub}>{event.spotsLeft} spots left</Text>
        </View>
        <View style={s.ticketDetailDivider} />
        <View style={[s.ticketDetail, { alignItems: 'flex-end' }]}>
          <Text style={s.detailLabel}>AGE</Text>
          <Text style={s.detailValue}>{event.ageMin}–{event.ageMax}</Text>
          <Text style={s.detailSub}>ID at door</Text>
        </View>
      </View>

      <View style={s.ticketTags}>
        {event.tags.map(tag => (
          <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
        ))}
      </View>

      {/* Actions row */}
      <View style={s.ticketActions}>
        <TouchableOpacity
          style={s.ticketCtaSecondary}
          activeOpacity={0.75}
          onPress={handleCancel}
          disabled={cancelling}
        >
          {cancelling
            ? <ActivityIndicator color={T.textMute} size="small" />
            : <Text style={s.ticketCtaSecondaryText}>
                {cancellable
                  ? (isWaitlist ? 'Leave Waitlist' : 'Cancel RSVP')
                  : '🔒 Cancel closed'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.ticketCtaPrimary, isWaitlist && s.ticketCtaAmber]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('EventDetail', {
            eventId: event.id,
            alreadyRsvped: !isWaitlist,
            bookingRef: booking.bookingRef,
            bookingId: booking.id,
          })}
        >
          <Text style={s.ticketCtaPrimaryText}>View Details →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Ticket carousel (multiple bookings) ───────────────────────────────────────
function TicketCarousel({
  enriched, navigation, onCancelled, userId,
}: {
  enriched: EnrichedBooking[];
  navigation: any;
  onCancelled: (id: string) => void;
  userId: string | null;
}) {
  const [page, setPage] = useState(0);

  if (!enriched.length) {
    return (
      <TouchableOpacity
        style={[s.ticket, s.ticketEmpty]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Discover')}
      >
        <Text style={{ fontSize: 36, marginBottom: 12 }}>🎟️</Text>
        <Text style={s.emptyTitle}>No upcoming RSVPs</Text>
        <Text style={s.emptySub}>Find a party and claim your spot</Text>
        <View style={[s.ticketCtaPrimary, { marginTop: 16, paddingHorizontal: 24 }]}>
          <Text style={s.ticketCtaPrimaryText}>Browse Parties →</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      {enriched.length > 1 && (
        <View style={s.carouselHeader}>
          <Text style={s.carouselCount}>
            {page + 1} of {enriched.length} upcoming
          </Text>
          <View style={s.dotRow}>
            {enriched.map((_, i) => (
              <View key={i} style={[s.dot, i === page && s.dotActive]} />
            ))}
          </View>
        </View>
      )}
      <FlatList
        data={enriched}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={({ booking }) => booking.id}
        onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}
        renderItem={({ item: { booking, event } }) => (
          <View style={{ width: W, paddingHorizontal: 20 }}>
            <TicketCard
              booking={booking}
              event={event}
              navigation={navigation}
              onCancelled={onCancelled}
              userId={userId}
            />
          </View>
        )}
      />
    </View>
  );
}

// ── Quick access grid ─────────────────────────────────────────────────────────
function QuickAccessGrid({ navigation }: { navigation: any }) {
  const items = [
    { icon: '🎟️', label: 'My RSVPs',      sublabel: 'All bookings',    onPress: () => navigation.navigate('Saved') },
    { icon: '🧭', label: 'Browse',         sublabel: 'Nearby parties',  onPress: () => navigation.navigate('Discover') },
    { icon: '🎁', label: 'Invite Friends', sublabel: 'Earn ₹100',
      onPress: () => Share.share({ message: `Hey! Join me on Houseparty 🎉 Use my invite link to get ₹100 off!\n${RAHUL.referralUrl}` }),
    },
    { icon: '💬', label: 'Contact Host',   sublabel: 'Message',         onPress: () => navigation.navigate('Chat') },
  ];

  return (
    <View style={s.qaGrid}>
      {items.map(item => (
        <TouchableOpacity key={item.label} activeOpacity={0.7} style={s.qaCell} onPress={item.onPress}>
          <View style={s.qaCard}>
            <Text style={s.qaIcon}>{item.icon}</Text>
            <Text style={s.qaLabel}>{item.label}</Text>
            <Text style={s.qaSub}>{item.sublabel}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'good morning';
  if (h < 17) return 'good afternoon';
  return 'good evening';
}

export default function GuestDashboardScreen({ navigation }: any) {
  const { session, profile } = useAuthStore();
  const userId = session?.user?.id ?? null;

  const [enriched, setEnriched] = useState<EnrichedBooking[]>([]);

  const loadBookings = useCallback(() => {
    getUserBookings(userId)
      .then(all => {
        const upcoming = getUpcomingBookings(all);
        setEnriched(upcoming);
        // Fix #16: cache for offline access
        cacheBookingsOffline(all).catch(() => {});
      })
      .catch(async () => {
        // Offline fallback — show cached tickets
        const cached = await getCachedBookings();
        setEnriched(getUpcomingBookings(cached));
      });
  }, [userId]);

  // Reload every time this screen comes into focus (e.g. after cancel in EventDetail)
  useFocusEffect(loadBookings);

  function handleCancelled(bookingId: string) {
    setEnriched(prev => prev.filter(({ booking }) => booking.id !== bookingId));
  }

  const displayName = profile?.display_name ?? RAHUL.name;
  const firstName   = displayName.split(' ')[0];
  const avatar      = profile?.avatar_url ?? RAHUL.avatar;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.headerName}>{firstName} 👋</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.notifBtn}>
              <Text style={s.notifIcon}>🔔</Text>
              <View style={s.notifBadge} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image source={{ uri: avatar }} style={s.avatarImg} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <SectionLabel>
            {enriched.length > 1
              ? `Your upcoming parties (${enriched.length})`
              : 'Your next party'}
          </SectionLabel>

          {/* Carousel is outside the paddingHorizontal ScrollView, so it gets full W */}
          <View style={{ marginHorizontal: -20 }}>
            <TicketCarousel
              enriched={enriched}
              navigation={navigation}
              onCancelled={handleCancelled}
              userId={userId}
            />
          </View>

          <SocialProof />

          <SectionLabel>Quick access</SectionLabel>
          <QuickAccessGrid navigation={navigation} />

          <SectionLabel>Parties for you</SectionLabel>
          <SwipePartyCards events={EVENTS} navigation={navigation} />

          <SectionLabel>Recent gallery</SectionLabel>
          <TouchableOpacity
            style={s.galleryTeaser}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Gallery', {})}
          >
            <Text style={s.galleryTitle}>📸  Event Photos</Text>
            <Text style={s.gallerySub}>See what went down at the last party</Text>
            <Text style={{ color: T.gold, fontSize: 13, fontWeight: '600', marginTop: 8 }}>View Gallery →</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        <BottomNav navigation={navigation} active="Home" />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  greeting:    { fontSize: 12, color: T.textMute, letterSpacing: 0.3 },
  headerName:  { fontSize: 22, fontWeight: '700', color: T.text, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn:    { position: 'relative', padding: 2 },
  notifIcon:   { fontSize: 22 },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: T.gold, borderWidth: 1.5, borderColor: T.bg,
  },
  avatarImg: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 2, borderColor: T.gold, backgroundColor: T.elevated,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: T.textMute,
    letterSpacing: 1.4, marginBottom: 12, marginTop: 24,
  },

  // ── Carousel ────────────────────────────────────────────────────────────────
  carouselHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 10,
  },
  carouselCount: { color: T.textMute, fontSize: 12, fontWeight: '600' },
  dotRow:   { flexDirection: 'row', gap: 5 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: T.border },
  dotActive:{ width: 18, borderRadius: 3, backgroundColor: T.gold },

  // ── Ticket ──────────────────────────────────────────────────────────────────
  ticket: {
    backgroundColor: T.card, borderRadius: 20,
    borderWidth: 1, borderColor: T.border, overflow: 'hidden',
  },
  ticketEmpty: { alignItems: 'center', padding: 32 },
  emptyTitle:  { color: T.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub:    { color: T.textMute, fontSize: 13 },

  confirmedBanner: {
    backgroundColor: 'rgba(0,211,127,0.12)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,211,127,0.2)',
    paddingHorizontal: 16, paddingVertical: 9,
  },
  confirmedBannerText: { color: T.green, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  waitlistBanner: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 16, paddingVertical: 9,
  },
  waitlistBannerText: { color: T.amber, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  ticketTop: { flexDirection: 'row', padding: 16, paddingBottom: 12 },
  ticketMeta:   { flex: 1 },
  ticketEyebrow:{ fontSize: 10, fontWeight: '600', color: T.gold, letterSpacing: 1.2, marginBottom: 5 },
  ticketTitle:  { fontSize: 19, fontWeight: '700', color: T.text, lineHeight: 25, marginBottom: 8 },
  ticketRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: T.green },
  ticketHost:   { fontSize: 13, color: T.textSub },
  ticketRight:  { alignItems: 'center', gap: 6, marginLeft: 12 },
  ticketIdBox: {
    alignItems: 'center', backgroundColor: T.elevated,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: T.border,
  },
  ticketIdLabel: { color: T.textMute, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  ticketId:      { color: T.gold, fontSize: 14, fontWeight: '800', marginTop: 2 },
  qrLabel:       { fontSize: 8, fontWeight: '700', color: T.textMute, letterSpacing: 1 },

  perfRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -1, height: 20 },
  perfNubLeft: {
    width: 10, height: 20, borderRadius: 10,
    backgroundColor: T.bg, position: 'absolute', left: -10, zIndex: 2,
  },
  perfNubRight: {
    width: 10, height: 20, borderRadius: 10,
    backgroundColor: T.bg, position: 'absolute', right: -10, zIndex: 2,
  },
  perfLine: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, alignItems: 'center',
  },
  perfDot: { width: 5, height: 1, backgroundColor: T.border, borderRadius: 1 },

  ticketBottom: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  ticketDetail: { flex: 1 },
  ticketDetailDivider: { width: 1, backgroundColor: T.border, marginHorizontal: 10, marginVertical: 2 },
  detailLabel: { fontSize: 9, fontWeight: '600', color: T.textMute, letterSpacing: 1.2, marginBottom: 3 },
  detailValue: { fontSize: 14, fontWeight: '700', color: T.text },
  detailSub:   { fontSize: 11, color: T.textMute, marginTop: 2 },
  goldText:    { color: T.gold },

  ticketTags: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
  },
  tag:     { backgroundColor: T.elevated, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: T.border },
  tagText: { fontSize: 11, color: T.textSub, fontWeight: '500' },

  ticketActions: {
    flexDirection: 'row', gap: 10,
    margin: 14, marginTop: 12,
  },
  ticketCtaSecondary: {
    flex: 1, borderRadius: 13, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: T.border,
  },
  ticketCtaSecondaryText: { color: T.textMute, fontSize: 13, fontWeight: '600' },
  ticketCtaPrimary: {
    flex: 2, backgroundColor: T.gold, borderRadius: 13,
    paddingVertical: 13, alignItems: 'center',
  },
  ticketCtaAmber: { backgroundColor: T.amber },
  ticketCtaPrimaryText: { color: '#000', fontSize: 14, fontWeight: '700' },

  // ── Quick access ─────────────────────────────────────────────────────────────
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  qaCell: { width: (W - 52) / 2 },
  qaCard: { backgroundColor: T.card, borderRadius: 16, padding: 16, gap: 6, borderWidth: 1, borderColor: T.border },
  qaIcon:  { fontSize: 26 },
  qaLabel: { fontSize: 14, fontWeight: '600', color: T.text, marginTop: 4 },
  qaSub:   { fontSize: 12, color: T.textMute },

  galleryTeaser: {
    backgroundColor: T.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border,
  },
  galleryTitle: { color: T.text, fontSize: 16, fontWeight: '700' },
  gallerySub:   { color: T.textSub, fontSize: 13, marginTop: 4 },
});
