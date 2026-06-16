import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Dimensions, StatusBar, Share, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EVENTS, RAHUL } from '../../../data/fakeData';
import { SwipePartyCards } from '../../../shared/components/SwipePartyCards';
import { SocialProof } from '../../../shared/components/SocialProof';

const W = Dimensions.get('window').width;

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.15)',
  green: '#00D37F', greenDim: 'rgba(0,211,127,0.15)',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
};

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

function TicketCard({ navigation }: { navigation: any }) {
  const [saved, setSaved] = useState(false);
  const event = EVENTS[0];

  return (
    <View style={s.ticket}>
      <View style={s.ticketTop}>
        <View style={s.ticketMeta}>
          <Text style={s.ticketEyebrow}>TONIGHT · 9:00 PM</Text>
          <Text style={s.ticketTitle}>{event.title}</Text>
          <View style={s.ticketRow}>
            <View style={s.verifiedDot} />
            <Text style={s.ticketHost}>Hosted by {event.host.name}</Text>
          </View>
        </View>
        <View style={s.ticketRight}>
          <TouchableOpacity onPress={() => setSaved(!saved)} style={s.saveBtn}>
            <Text style={{ fontSize: 20 }}>{saved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <View style={s.ticketIdBox}>
            <Text style={s.ticketIdLabel}>BOOKING ID</Text>
            <Text style={s.ticketId}>#HP-4829</Text>
          </View>
          <Text style={s.qrLabel}>SHOW AT DOOR</Text>
        </View>
      </View>

      <PerforatedDivider />

      <View style={s.ticketBottom}>
        <View style={s.ticketDetail}>
          <Text style={s.detailLabel}>VENUE</Text>
          <Text style={s.detailValue}>Bandra West</Text>
          <Text style={s.detailSub}>🚇 650 m</Text>
        </View>
        <View style={s.ticketDetailDivider} />
        <View style={s.ticketDetail}>
          <Text style={s.detailLabel}>ENTRY</Text>
          <Text style={[s.detailValue, s.goldText]}>₹499</Text>
          <Text style={s.detailSub}>8 spots left</Text>
        </View>
        <View style={s.ticketDetailDivider} />
        <View style={[s.ticketDetail, { alignItems: 'flex-end' }]}>
          <Text style={s.detailLabel}>AGE</Text>
          <Text style={s.detailValue}>21–35</Text>
          <Text style={s.detailSub}>ID at door</Text>
        </View>
      </View>

      <View style={s.ticketTags}>
        {event.tags.map(tag => (
          <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
        ))}
      </View>

      <TouchableOpacity
        style={s.ticketCta}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('EventDetail', { eventId: event.id, alreadyRsvped: true })}
      >
        <Text style={s.ticketCtaText}>View Full Details →</Text>
      </TouchableOpacity>
    </View>
  );
}

function QuickAccessGrid({ navigation }: { navigation: any }) {
  const items = [
    { icon: '🎟️', label: 'My RSVPs',      sublabel: '2 upcoming',   onPress: () => navigation.navigate('Saved') },
    { icon: '🧭', label: 'Browse',         sublabel: 'Nearby parties', onPress: () => navigation.navigate('Discover') },
    { icon: '🎁', label: 'Invite Friends', sublabel: 'Earn ₹100',
      onPress: () => Share.share({
        message: `Hey! Join me on Houseparty 🎉 Use my invite link to get ₹100 off!\n${RAHUL.referralUrl}`,
      }),
    },
    { icon: '💬', label: 'Contact Host',   sublabel: 'Message',      onPress: () => navigation.navigate('Chat') },
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

function SuggestedCard({ event, navigation }: { event: any; navigation: any }) {
  const isClosed = event.status === 'closed';
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={s.sugCard}
      onPress={() => navigation.navigate(isClosed ? 'ClosedEvent' : 'EventDetail', { eventId: event.id })}
    >
      <View style={[s.sugThumb, { backgroundColor: '#1A1A2E' }]}>
        <Image source={{ uri: event.coverImage }} style={{ ...StyleSheet.absoluteFillObject as any }} resizeMode="cover" />
        <Text style={s.sugDate}>
          {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <View style={s.sugBody}>
        <Text style={s.sugTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={s.sugArea} numberOfLines={1}>{event.area}</Text>
        <View style={s.sugFooter}>
          <Text style={s.sugFee}>{event.fee === 0 ? 'Free' : `₹${event.fee}`}</Text>
          {isClosed ? (
            <View style={[s.spotsPill, { backgroundColor: 'rgba(255,90,90,0.1)', borderColor: 'rgba(255,90,90,0.3)' }]}>
              <Text style={[s.spotsText, { color: '#FF5A5A' }]}>Closed</Text>
            </View>
          ) : (
            <View style={s.spotsPill}>
              <Text style={s.spotsText}>{event.spotsLeft} left</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const NAV_ITEMS = [
  { icon: '⊞', label: 'Home',    screen: 'Home' },
  { icon: '◎', label: 'Explore', screen: 'Discover' },
  { icon: '★', label: 'Saved',   screen: 'Saved' },
  { icon: '◯', label: 'Profile', screen: 'Profile' },
];

function BottomNav({ navigation, active }: { navigation: any; active: string }) {
  return (
    <View style={s.navBar}>
      {NAV_ITEMS.slice(0, 2).map(item => (
        <TouchableOpacity key={item.label} style={s.navItem} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.7}>
          <Text style={[s.navIcon, active === item.screen && s.navActive]}>{item.icon}</Text>
          <Text style={[s.navLabel, active === item.screen && s.navActiveLbl]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
      <View style={s.navCenter}>
        <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('Discover')} activeOpacity={0.8}>
          <Text style={s.createIcon}>＋</Text>
        </TouchableOpacity>
      </View>
      {NAV_ITEMS.slice(2).map(item => (
        <TouchableOpacity key={item.label} style={s.navItem} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.7}>
          <Text style={[s.navIcon, active === item.screen && s.navActive]}>{item.icon}</Text>
          <Text style={[s.navLabel, active === item.screen && s.navActiveLbl]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function GuestDashboardScreen({ navigation }: any) {
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>good evening</Text>
            <Text style={s.headerName}>Rahul 👋</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.notifBtn}>
              <Text style={s.notifIcon}>🔔</Text>
              <View style={s.notifBadge} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image source={{ uri: RAHUL.avatar }} style={s.avatarImg} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <SectionLabel>Your next party</SectionLabel>
          <TicketCard navigation={navigation} />

          <SocialProof />

          <SectionLabel>Quick access</SectionLabel>
          <QuickAccessGrid navigation={navigation} />

          <SectionLabel>Parties for you</SectionLabel>
          <SwipePartyCards events={EVENTS} navigation={navigation} />

          {/* Gallery teaser */}
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
  greeting: { fontSize: 12, color: T.textMute, letterSpacing: 0.3 },
  headerName: { fontSize: 22, fontWeight: '700', color: T.text, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: { position: 'relative', padding: 2 },
  notifIcon: { fontSize: 22 },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: T.gold, borderWidth: 1.5, borderColor: T.bg,
  },
  avatarImg: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 2, borderColor: T.gold,
    backgroundColor: T.elevated,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: T.textMute,
    letterSpacing: 1.4, marginBottom: 12, marginTop: 24,
  },

  ticket: {
    backgroundColor: T.card, borderRadius: 20,
    borderWidth: 1, borderColor: T.border, overflow: 'hidden',
  },
  ticketTop: { flexDirection: 'row', padding: 20, paddingBottom: 16 },
  ticketMeta: { flex: 1 },
  ticketEyebrow: { fontSize: 10, fontWeight: '600', color: T.gold, letterSpacing: 1.2, marginBottom: 5 },
  ticketTitle: { fontSize: 20, fontWeight: '700', color: T.text, lineHeight: 26, marginBottom: 8 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.green },
  ticketHost: { fontSize: 13, color: T.textSub },
  ticketRight: { alignItems: 'center', gap: 6, marginLeft: 12 },
  saveBtn: { padding: 2 },
  ticketIdBox: {
    alignItems: 'center', backgroundColor: T.elevated,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: T.border,
  },
  ticketIdLabel: { color: T.textMute, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  ticketId: { color: T.gold, fontSize: 15, fontWeight: '800', marginTop: 2 },
  qrLabel: { fontSize: 8, fontWeight: '700', color: T.textMute, letterSpacing: 1 },

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

  ticketBottom: {
    flexDirection: 'row', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
  },
  ticketDetail: { flex: 1 },
  ticketDetailDivider: { width: 1, backgroundColor: T.border, marginHorizontal: 12, marginVertical: 2 },
  detailLabel: { fontSize: 9, fontWeight: '600', color: T.textMute, letterSpacing: 1.2, marginBottom: 3 },
  detailValue: { fontSize: 14, fontWeight: '700', color: T.text },
  detailSub: { fontSize: 11, color: T.textMute, marginTop: 2 },
  goldText: { color: T.gold },

  ticketTags: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  tag: {
    backgroundColor: T.elevated, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: T.border,
  },
  tagText: { fontSize: 11, color: T.textSub, fontWeight: '500' },
  ticketCta: {
    margin: 16, marginTop: 14, backgroundColor: T.gold, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  ticketCtaText: { color: '#000', fontSize: 15, fontWeight: '700' },

  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  qaCell: { width: (W - 52) / 2 },
  qaCard: {
    backgroundColor: T.card, borderRadius: 16, padding: 16, gap: 6,
    borderWidth: 1, borderColor: T.border,
  },
  qaIcon: { fontSize: 26 },
  qaLabel: { fontSize: 14, fontWeight: '600', color: T.text, marginTop: 4 },
  qaSub: { fontSize: 12, color: T.textMute },

  sugRow: { paddingBottom: 4, gap: 12 },
  sugCard: {
    width: 160, backgroundColor: T.card, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: T.border,
  },
  sugThumb: { height: 100, alignItems: 'flex-end', justifyContent: 'flex-start', padding: 10 },
  sugDate: {
    fontSize: 13, fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, overflow: 'hidden',
  },
  sugBody: { padding: 12, gap: 3 },
  sugTitle: { fontSize: 13, fontWeight: '700', color: T.text },
  sugArea: { fontSize: 11, color: T.textMute },
  sugFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sugFee: { fontSize: 14, fontWeight: '700', color: T.gold },
  spotsPill: {
    backgroundColor: T.greenDim, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(0,211,127,0.3)',
  },
  spotsText: { fontSize: 10, fontWeight: '600', color: T.green },

  galleryTeaser: {
    backgroundColor: T.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: T.border,
  },
  galleryTitle: { color: T.text, fontSize: 16, fontWeight: '700' },
  gallerySub: { color: T.textSub, fontSize: 13, marginTop: 4 },

  navBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.border,
    paddingBottom: Platform.OS === 'android' ? 8 : 24,
    paddingTop: 8, paddingHorizontal: 8,
    ...(Platform.OS === 'android' ? { elevation: 24 } : {
      shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.4, shadowRadius: 16,
    }),
  },
  navItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  navIcon: { fontSize: 20, color: T.textMute },
  navLabel: { fontSize: 10, color: T.textMute, fontWeight: '500' },
  navActive: { color: T.gold },
  navActiveLbl: { color: T.gold },
  navCenter: { width: 64, alignItems: 'center' },
  createBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    ...(Platform.OS === 'android' ? { elevation: 8 } : {
      shadowColor: T.gold, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5, shadowRadius: 10,
    }),
  },
  createIcon: { color: '#000', fontSize: 24, lineHeight: 28, fontWeight: '700' },
});
