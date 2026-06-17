import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, Share, Alert, Switch, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../features/auth/authStore';
import { useTheme } from '../../../theme/ThemeContext';
import { supabase } from '../../../services/supabaseClient';
import { RAHUL, EVENTS, GALLERY_POSTS } from '../../../data/fakeData';
import { BottomNav } from '../../../shared/components/BottomNav';

const W = Dimensions.get('window').width;
const GRID = (W - 40 - 8) / 3;

const MY_POSTS    = GALLERY_POSTS.filter(p => p.posterName === RAHUL.name);
const ATTENDED    = EVENTS.filter(e => e.status === 'closed');
const MY_REVIEWS  = ATTENDED.flatMap(e =>
  e.reviews.slice(0, 1).map(r => ({ ...r, eventTitle: e.title, eventId: e.id }))
);

type Tab = 'gallery' | 'events' | 'reviews';

export default function ProfileScreen({ navigation }: any) {
  const { T, isDark, toggleTheme } = useTheme();
  const { profile, session, reset } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('gallery');

  // In BYPASS_AUTH mode profile is null — fall back to fake data
  const displayName = profile?.display_name ?? RAHUL.name;
  const username    = profile?.username    ?? '@rahulkapoor';
  const avatarUri   = profile?.avatar_url  ?? RAHUL.avatar;
  const memberSince = 'Jan 2025';

  const s = makeStyles(T);

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          reset();
        },
      },
    ]);
  }

  function handleInvite() {
    Share.share({
      message: `Join me on Houseparty 🎉 — ${RAHUL.referralUrl}`,
      title: 'Invite to Houseparty',
    });
  }

  // ── Settings sections ──────────────────────────────────────────────────────
  const SECTIONS = [
    {
      title: 'ACCOUNT',
      items: [
        { icon: '🔔', label: 'Notifications' },
        { icon: '🛡️', label: 'Privacy & Safety' },
        { icon: '💳', label: 'Payment Methods' },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { icon: isDark ? '🌙' : '☀️', label: 'Dark Mode', isToggle: true },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { icon: '❓', label: 'Help & Support' },
        { icon: '📄', label: 'Privacy Policy' },
        { icon: '🔗', label: 'Share App', onPress: handleInvite },
      ],
    },
  ];

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={T.bg}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── Avatar + identity ─────────────────────────────────────── */}
          <View style={s.hero}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.85}
              style={s.avatarBtn}
            >
              <Image source={{ uri: avatarUri }} style={s.avatar} />
              <View style={[s.cameraBadge, { backgroundColor: T.gold }]}>
                <Text style={s.cameraIcon}>📷</Text>
              </View>
            </TouchableOpacity>

            <Text style={[s.name, { color: T.text }]}>{displayName}</Text>
            <Text style={[s.username, { color: T.textMute }]}>{username}</Text>
            <Text style={[s.member, { color: T.textMute }]}>Member since {memberSince}</Text>

            <TouchableOpacity
              style={[s.editBtn, { backgroundColor: T.text }]}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <Text style={[s.editBtnText, { color: T.bg }]}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* ── Stats ────────────────────────────────────────────────── */}
          <View style={[s.statsCard, { backgroundColor: T.card, borderColor: T.border }]}>
            {[
              { val: RAHUL.partiesAttended, label: 'ATTENDED' },
              { val: RAHUL.savedCount,      label: 'SAVED' },
              { val: RAHUL.invitesSent,     label: 'INVITED' },
            ].map((item, i, arr) => (
              <React.Fragment key={item.label}>
                <View style={s.statItem}>
                  <Text style={[s.statVal, { color: T.text }]}>{item.val}</Text>
                  <Text style={[s.statLbl, { color: T.textMute }]}>{item.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={[s.statDiv, { backgroundColor: T.border }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── Invite strip ─────────────────────────────────────────── */}
          <TouchableOpacity
            style={[s.inviteStrip, { backgroundColor: T.goldDim, borderColor: `${T.gold}44` }]}
            onPress={handleInvite}
            activeOpacity={0.8}
          >
            <Text style={[s.inviteText, { color: T.gold }]}>
              🎁 Invite friends · Earn ₹100 per referral
            </Text>
            <Text style={[s.inviteCode, { color: T.gold }]}>↑ Share</Text>
          </TouchableOpacity>

          {/* ── Content tabs ─────────────────────────────────────────── */}
          <View style={[s.tabs, { backgroundColor: T.elevated, borderColor: T.border }]}>
            {(['gallery', 'events', 'reviews'] as Tab[]).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[s.tab, activeTab === tab && { backgroundColor: T.card }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabText, { color: activeTab === tab ? T.text : T.textMute }]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'gallery' && (
            MY_POSTS.length === 0 ? (
              <EmptyState icon="📸" text="No photos yet" T={T} />
            ) : (
              <View style={s.photoGrid}>
                {MY_POSTS.map(post => (
                  <TouchableOpacity
                    key={post.id}
                    style={[s.gridThumb, { backgroundColor: T.elevated }]}
                    onPress={() => navigation.navigate('Gallery', { eventId: post.eventId })}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: post.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={s.gridOverlay}>
                      <Text style={s.gridLikes}>❤️ {post.likes}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}

          {activeTab === 'events' && (
            ATTENDED.length === 0 ? (
              <EmptyState icon="🎟️" text="No events attended yet" T={T} />
            ) : (
              <View style={s.tabContent}>
                {ATTENDED.map(event => (
                  <TouchableOpacity
                    key={event.id}
                    style={[s.eventRow, { backgroundColor: T.card, borderColor: T.border }]}
                    onPress={() => navigation.navigate('ClosedEvent', { eventId: event.id })}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: event.coverImage }} style={s.eventThumb} resizeMode="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.eventTitle, { color: T.text }]} numberOfLines={1}>{event.title}</Text>
                      <Text style={[s.eventMeta, { color: T.textSub }]}>{event.area} · {event.host.name}</Text>
                      <View style={[s.rateTag, { backgroundColor: T.goldDim, borderColor: `${T.gold}44` }]}>
                        <Text style={[s.rateTagText, { color: T.gold }]}>★ Rate Event</Text>
                      </View>
                    </View>
                    <Text style={[s.chevron, { color: T.gold }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}

          {activeTab === 'reviews' && (
            MY_REVIEWS.length === 0 ? (
              <EmptyState icon="💬" text="No reviews yet — attend an event!" T={T} />
            ) : (
              <View style={s.tabContent}>
                {MY_REVIEWS.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[s.reviewCard, { backgroundColor: T.card, borderColor: T.border }]}
                    onPress={() => navigation.navigate('ClosedEvent', { eventId: r.eventId })}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.reviewEvent, { color: T.textMute }]}>{r.eventTitle}</Text>
                    <View style={{ flexDirection: 'row', gap: 2, marginVertical: 4 }}>
                      {[1,2,3,4,5].map(n => (
                        <Text key={n} style={{ color: n <= r.rating ? T.gold : T.border, fontSize: 13 }}>★</Text>
                      ))}
                    </View>
                    <Text style={[s.reviewComment, { color: T.textSub }]} numberOfLines={3}>{r.comment}</Text>
                    <Text style={[s.reviewDate, { color: T.textMute }]}>{r.date}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}

          {/* ── Settings sections ─────────────────────────────────────── */}
          <View style={s.settingsWrap}>
            {SECTIONS.map(section => (
              <View key={section.title} style={s.section}>
                <Text style={[s.sectionTitle, { color: T.textMute }]}>{section.title}</Text>
                <View style={[s.sectionCard, { backgroundColor: T.card, borderColor: T.border }]}>
                  {section.items.map((item: any, i) => (
                    <React.Fragment key={item.label}>
                      {i > 0 && <View style={[s.rowDiv, { backgroundColor: T.separator }]} />}
                      <TouchableOpacity
                        style={s.settingRow}
                        activeOpacity={item.isToggle ? 1 : 0.65}
                        onPress={!item.isToggle ? (item.onPress ?? (() =>
                          Alert.alert(item.label, 'Coming soon!')
                        )) : undefined}
                      >
                        <Text style={s.settingIcon}>{item.icon}</Text>
                        <Text style={[s.settingLabel, { color: T.text }]}>{item.label}</Text>
                        {item.isToggle ? (
                          <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: T.border, true: `${T.gold}88` }}
                            thumbColor={isDark ? T.gold : T.textMute}
                          />
                        ) : (
                          <Text style={[s.chevron, { color: T.textMute }]}>›</Text>
                        )}
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              </View>
            ))}

            {/* Sign out */}
            <TouchableOpacity
              style={[s.signOutBtn, { backgroundColor: T.card, borderColor: T.border }]}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={s.signOutIcon}>🚪</Text>
              <Text style={[s.signOutLabel, { color: T.red }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
      <BottomNav navigation={navigation} active="Profile" />
    </View>
  );
}

function EmptyState({ icon, text, T }: { icon: string; text: string; T: any }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
      <Text style={{ fontSize: 36 }}>{icon}</Text>
      <Text style={{ color: T.textSub, fontSize: 15 }}>{text}</Text>
    </View>
  );
}

// Styles are a factory so they receive T and rebuild when theme changes
function makeStyles(T: any) {
  return StyleSheet.create({
    root:     { flex: 1 },

    // Hero
    hero: {
      alignItems: 'center',
      paddingTop: 24, paddingBottom: 20,
      paddingHorizontal: 20,
    },
    avatarBtn:   { position: 'relative', marginBottom: 14 },
    avatar: {
      width: 90, height: 90, borderRadius: 45,
      borderWidth: 2.5, borderColor: T.gold,
      backgroundColor: T.elevated,
    },
    cameraBadge: {
      position: 'absolute', bottom: 0, right: 0,
      width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: T.bg,
    },
    cameraIcon:  { fontSize: 12 },
    name:        { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    username:    { fontSize: 14, marginBottom: 3 },
    member:      { fontSize: 12, marginBottom: 20 },
    editBtn: {
      paddingHorizontal: 40, paddingVertical: 13,
      borderRadius: 14,
    },
    editBtnText: { fontSize: 15, fontWeight: '700' },

    // Stats
    statsCard: {
      flexDirection: 'row', marginHorizontal: 20, marginBottom: 14,
      borderRadius: 18, borderWidth: 1, paddingVertical: 2,
    },
    statItem:  { flex: 1, alignItems: 'center', paddingVertical: 16 },
    statVal:   { fontSize: 22, fontWeight: '900' },
    statLbl:   { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 3 },
    statDiv:   { width: 1, marginVertical: 12 },

    // Invite
    inviteStrip: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginHorizontal: 20, marginBottom: 20,
      borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
      borderWidth: 1,
    },
    inviteText: { fontSize: 14, fontWeight: '600' },
    inviteCode: { fontSize: 14, fontWeight: '800' },

    // Tabs
    tabs: {
      flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
      borderRadius: 12, padding: 4, borderWidth: 1,
    },
    tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
    tabText: { fontSize: 13, fontWeight: '600' },

    // Photo grid
    photoGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 4,
      paddingHorizontal: 20, marginBottom: 20,
    },
    gridThumb: {
      width: GRID, height: GRID, borderRadius: 10, overflow: 'hidden',
    },
    gridOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0,0,0,0.35)', padding: 5,
    },
    gridLikes: { color: '#fff', fontSize: 11, fontWeight: '600' },

    // Event tab
    tabContent: { paddingHorizontal: 20, gap: 10, marginBottom: 20 },
    eventRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderRadius: 16, overflow: 'hidden', borderWidth: 1,
    },
    eventThumb:  { width: 72, height: 72 },
    eventTitle:  { fontSize: 14, fontWeight: '700', paddingRight: 8 },
    eventMeta:   { fontSize: 12, marginTop: 2 },
    rateTag: {
      marginTop: 5, borderRadius: 6, paddingHorizontal: 7,
      paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1,
    },
    rateTagText: { fontSize: 11, fontWeight: '600' },
    chevron:     { fontSize: 22, paddingRight: 12 },

    // Reviews
    reviewCard: {
      borderRadius: 14, padding: 14, borderWidth: 1,
    },
    reviewEvent:   { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
    reviewComment: { fontSize: 13, lineHeight: 19 },
    reviewDate:    { fontSize: 11, marginTop: 6 },

    // Settings
    settingsWrap: { paddingHorizontal: 20, gap: 6, marginBottom: 8, marginTop: 4 },
    section:      { gap: 8 },
    sectionTitle: {
      fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
      paddingHorizontal: 4, marginTop: 6,
    },
    sectionCard: {
      borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    },
    rowDiv: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
    settingRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 16, paddingVertical: 14,
    },
    settingIcon:  { fontSize: 18, width: 24, textAlign: 'center' },
    settingLabel: { flex: 1, fontSize: 15 },

    signOutBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
      borderWidth: 1, marginTop: 10,
    },
    signOutIcon:  { fontSize: 18 },
    signOutLabel: { fontSize: 15, fontWeight: '600' },
  });
}
