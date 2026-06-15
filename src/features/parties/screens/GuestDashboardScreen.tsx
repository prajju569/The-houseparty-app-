import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';

const W = Dimensions.get('window').width;

// ── Inline SVG-equivalent icon paths (rendered via View + Text) ──────────────
// We use emoji + text combos for icons to avoid adding lucide/ionicons dep
// Real implementation should use @expo/vector-icons

const QUICK_ACCESS = [
  { icon: '🎟️', label: 'My RSVPs',       sublabel: '2 upcoming' },
  { icon: '🧭', label: 'Browse Parties',  sublabel: 'Nearby' },
  { icon: '🎁', label: 'Invite Friends',  sublabel: 'Earn ₹100' },
  { icon: '💬', label: 'Contact Host',    sublabel: 'Message' },
];

const SUGGESTED = [
  {
    id: 's1',
    title: 'Sunset Jazz & Gin',
    area: 'Hauz Khas, Delhi',
    date: 'Fri 20',
    fee: 0,
    spots: 4,
    tag: 'No Alcohol Alts',
    color: '#1A1A2E',
  },
  {
    id: 's2',
    title: 'EDM Warehouse',
    area: 'Indiranagar, Blr',
    date: 'Sat 21',
    fee: 599,
    spots: 12,
    tag: 'Alcohol · 18+',
    color: '#2D1B4E',
  },
  {
    id: 's3',
    title: 'Rooftop Antakshari',
    area: 'Powai, Mumbai',
    date: 'Sun 22',
    fee: 199,
    spots: 7,
    tag: 'Bollywood',
    color: '#1B2D1E',
  },
];

// ── Section label (ALL CAPS, tracked) ────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children.toUpperCase()}</Text>;
}

// ── Perforated divider (the signature element) ────────────────────────────────
function PerforatedDivider() {
  const dotCount = Math.floor((W - 80) / 14);
  return (
    <View style={s.perfRow}>
      <View style={s.perfNub} />
      <View style={s.perfLine}>
        {Array.from({ length: dotCount }).map((_, i) => (
          <View key={i} style={s.perfDot} />
        ))}
      </View>
      <View style={[s.perfNub, { right: -10, left: undefined }]} />
    </View>
  );
}

// ── Ticket card (the featured upcoming event) ─────────────────────────────────
function TicketCard() {
  const [saved, setSaved] = useState(false);

  return (
    <Card radius="xl" style={s.ticket}>
      {/* Top stub: event identity */}
      <View style={s.ticketTop}>
        <View style={s.ticketMeta}>
          <Text style={s.ticketEyebrow}>TONIGHT · 9:00 PM</Text>
          <Text style={s.ticketTitle}>Retro Bollywood Night</Text>
          <View style={s.ticketRow}>
            <View style={s.hostDot} />
            <Text style={s.ticketHost}>Hosted by Aryan K.</Text>
          </View>
        </View>
        <View style={s.ticketRight}>
          <TouchableOpacity onPress={() => setSaved(!saved)} style={s.saveBtn}>
            <Text style={{ fontSize: 20 }}>{saved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          {/* QR-code stub placeholder */}
          <View style={s.qrBox}>
            <View style={s.qrInner}>
              {[0, 1, 2].map(r => (
                <View key={r} style={s.qrRow}>
                  {[0, 1, 2].map(c => (
                    <View
                      key={c}
                      style={[
                        s.qrCell,
                        (r === 0 || r === 2) && (c === 0 || c === 2) && s.qrCorner,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
          <Text style={s.qrLabel}>SCAN AT DOOR</Text>
        </View>
      </View>

      {/* Perforated tear line */}
      <PerforatedDivider />

      {/* Bottom stub: logistics */}
      <View style={s.ticketBottom}>
        <View style={s.ticketDetail}>
          <Text style={s.detailLabel}>VENUE</Text>
          <Text style={s.detailValue}>Bandra West, Mumbai</Text>
          <Text style={s.detailSub}>🚇 Bandra Stn · 650 m</Text>
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

      {/* Vibe tags */}
      <View style={s.ticketTags}>
        {['Bollywood', 'Dance', '🍻 Bar Open', '🚭 No Smoking'].map(tag => (
          <View key={tag} style={s.tag}>
            <Text style={s.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <Button label="View Full Details →" variant="primary" size="md" fullWidth style={s.ticketCta} />
    </Card>
  );
}

// ── Quick Access grid ─────────────────────────────────────────────────────────
function QuickAccessGrid() {
  return (
    <View style={s.qaGrid}>
      {QUICK_ACCESS.map(item => (
        <TouchableOpacity key={item.label} activeOpacity={0.7} style={s.qaCell}>
          <Card radius="lg" style={s.qaCard}>
            <Text style={s.qaIcon}>{item.icon}</Text>
            <Text style={s.qaLabel}>{item.label}</Text>
            <Text style={s.qaSub}>{item.sublabel}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Horizontal suggestion cards ───────────────────────────────────────────────
function SuggestedCard({ item }: { item: (typeof SUGGESTED)[0] }) {
  return (
    <TouchableOpacity activeOpacity={0.8}>
      <Card radius="lg" style={s.sugCard}>
        {/* Coloured thumbnail placeholder */}
        <View style={[s.sugThumb, { backgroundColor: item.color }]}>
          <Text style={s.sugDate}>{item.date}</Text>
        </View>
        <View style={s.sugBody}>
          <Text style={s.sugTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.sugArea} numberOfLines={1}>{item.area}</Text>
          <View style={s.sugFooter}>
            <Text style={s.sugFee}>{item.fee === 0 ? 'Free' : `₹${item.fee}`}</Text>
            <View style={s.spotsPill}>
              <Text style={s.spotsText}>{item.spots} left</Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ── Bottom navigation ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: '⊞', label: 'Home',    active: true  },
  { icon: '◎', label: 'Explore', active: false },
  { icon: '★', label: 'Saved',   active: false },
  { icon: '◯', label: 'Profile', active: false },
];

function BottomNav() {
  return (
    <View style={s.navBar}>
      {NAV_ITEMS.slice(0, 2).map(item => (
        <TouchableOpacity key={item.label} style={s.navItem} activeOpacity={0.7}>
          <Text style={[s.navIcon, item.active && s.navActive]}>{item.icon}</Text>
          <Text style={[s.navLabel, item.active && s.navActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      {/* Centered create button */}
      <View style={s.navCenter}>
        <TouchableOpacity style={s.createBtn} activeOpacity={0.8}>
          <Text style={s.createIcon}>＋</Text>
        </TouchableOpacity>
      </View>

      {NAV_ITEMS.slice(2).map(item => (
        <TouchableOpacity key={item.label} style={s.navItem} activeOpacity={0.7}>
          <Text style={[s.navIcon, item.active && s.navActive]}>{item.icon}</Text>
          <Text style={[s.navLabel, item.active && s.navActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function GuestDashboardScreen() {
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F4F0" />
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* Header */}
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
            <View style={s.avatar}>
              <Text style={s.avatarText}>RK</Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* ── Upcoming Party (Ticket) ── */}
          <SectionLabel>Your next party</SectionLabel>
          <TicketCard />

          {/* ── Quick Access ── */}
          <SectionLabel>Quick access</SectionLabel>
          <QuickAccessGrid />

          {/* ── Suggested ── */}
          <SectionLabel>Parties for you</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.sugRow}
          >
            {SUGGESTED.map(item => (
              <SuggestedCard key={item.id} item={item} />
            ))}
          </ScrollView>

          {/* Bottom spacer for nav */}
          <View style={{ height: 90 }} />
        </ScrollView>

        <BottomNav />
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F5F4F0' },
  safe:   { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting:   { fontSize: 12, color: '#9E9E96', letterSpacing: 0.3 },
  headerName: { fontSize: 22, fontWeight: '700', color: '#0A0A0A', marginTop: 1 },
  headerRight:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn:   { position: 'relative', padding: 2 },
  notifIcon:  { fontSize: 22 },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#C8A951', borderWidth: 1.5, borderColor: '#F5F4F0',
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#0A0A0A',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  // Scroll
  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E96',
    letterSpacing: 1.4,
    marginBottom: 12,
    marginTop: 24,
  },

  // ── Ticket ──
  ticket: { overflow: 'visible' },

  ticketTop: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 16,
  },
  ticketMeta: { flex: 1 },
  ticketEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C8A951',
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  ticketTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0A0A0A',
    lineHeight: 28,
    marginBottom: 8,
  },
  ticketRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hostDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1A7A4A' },
  ticketHost: { fontSize: 13, color: '#6B6B65' },

  ticketRight: { alignItems: 'center', gap: 6, marginLeft: 12 },
  saveBtn:     { padding: 2 },
  qrBox: {
    width: 64, height: 64,
    borderRadius: 10,
    backgroundColor: '#F5F4F0',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E8E7E3',
  },
  qrInner: { gap: 4 },
  qrRow:   { flexDirection: 'row', gap: 4 },
  qrCell: {
    width: 12, height: 12,
    borderRadius: 2,
    backgroundColor: '#C9C8C3',
  },
  qrCorner: { backgroundColor: '#0A0A0A', borderRadius: 3 },
  qrLabel: {
    fontSize: 8, fontWeight: '700',
    color: '#9E9E96', letterSpacing: 1,
  },

  // Perforated divider
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -1,
    height: 20,
  },
  perfNub: {
    width: 10, height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F4F0',
    position: 'absolute',
    left: -10,
    zIndex: 2,
  },
  perfLine: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  perfDot: {
    width: 5, height: 1,
    backgroundColor: '#E8E7E3',
    borderRadius: 1,
  },

  // Ticket bottom stub
  ticketBottom: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  ticketDetail: { flex: 1 },
  ticketDetailDivider: {
    width: 1,
    backgroundColor: '#E8E7E3',
    marginHorizontal: 12,
    marginVertical: 2,
  },
  detailLabel: {
    fontSize: 9, fontWeight: '600',
    color: '#9E9E96', letterSpacing: 1.2,
    marginBottom: 3,
  },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
  detailSub:   { fontSize: 11, color: '#9E9E96', marginTop: 2 },
  goldText:    { color: '#C8A951' },

  // Ticket tags
  ticketTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  tag: {
    backgroundColor: '#F5F4F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E8E7E3',
  },
  tagText: { fontSize: 11, color: '#6B6B65', fontWeight: '500' },

  ticketCta: { margin: 16, marginTop: 12, borderRadius: 12 },

  // ── Quick Access ──
  qaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  qaCell: { width: (W - 52) / 2 },
  qaCard: {
    padding: 16,
    gap: 6,
  },
  qaIcon:  { fontSize: 26 },
  qaLabel: { fontSize: 14, fontWeight: '600', color: '#0A0A0A', marginTop: 4 },
  qaSub:   { fontSize: 12, color: '#9E9E96' },

  // ── Suggested horizontal ──
  sugRow: { paddingBottom: 4, gap: 12 },
  sugCard: { width: 160, overflow: 'hidden' },
  sugThumb: {
    height: 100,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 10,
  },
  sugDate: {
    fontSize: 13, fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sugBody:   { padding: 12, gap: 3 },
  sugTitle:  { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },
  sugArea:   { fontSize: 11, color: '#9E9E96' },
  sugFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sugFee:    { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
  spotsPill: {
    backgroundColor: '#E6F4ED',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  spotsText: { fontSize: 10, fontWeight: '600', color: '#1A7A4A' },

  // ── Bottom nav ──
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E7E3',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0A0A0A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
    }),
  },
  navItem:  { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  navIcon:  { fontSize: 20, color: '#C9C8C3' },
  navLabel: { fontSize: 10, color: '#C9C8C3', fontWeight: '500' },
  navActive:{ color: '#0A0A0A' },
  navCenter:{ width: 64, alignItems: 'center' },
  createBtn: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: '#0A0A0A',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0A0A0A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  createIcon: { color: '#FFFFFF', fontSize: 24, lineHeight: 28, fontWeight: '300' },
});
