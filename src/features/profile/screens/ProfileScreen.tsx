import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, Share, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RAHUL, EVENTS, GALLERY_POSTS } from '../../../data/fakeData';
import { BottomNav } from '../../../shared/components/BottomNav';

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.15)',
  green: '#00D37F', greenDim: 'rgba(0,211,127,0.15)',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
};

const W = Dimensions.get('window').width;

const MY_POSTS = GALLERY_POSTS.filter(p => p.posterName === RAHUL.name);
const ATTENDED = EVENTS.filter(e => e.status === 'closed');
// Simulated reviews Rahul has written (first review of each attended event)
const MY_REVIEWS = ATTENDED.flatMap(e =>
  e.reviews.slice(0, 1).map(r => ({ ...r, eventTitle: e.title, eventId: e.id }))
);

export default function ProfileScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'events' | 'reviews'>('gallery');

  function handleInvite() {
    Share.share({
      message: `Hey! Join me on Houseparty 🎉 Use my invite link to get ₹100 off your first event!\n${RAHUL.referralUrl}`,
      title: 'Invite to Houseparty',
    });
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.avatarWrap}>
              <Image source={{ uri: RAHUL.avatar }} style={s.avatar} />
              <View style={s.onlineDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{RAHUL.name}</Text>
              <Text style={s.city}>📍 {RAHUL.city}</Text>
              <Text style={s.member}>Member since {RAHUL.memberSince}</Text>
            </View>
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon.', [{ text: 'OK' }])}
              activeOpacity={0.7}
            >
              <Text style={s.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.bio}>{RAHUL.bio}</Text>

          {/* Badges */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.badgeRow}>
            {RAHUL.badges.map(badge => (
              <View key={badge} style={s.badge}>
                <Text style={s.badgeIcon}>✦</Text>
                <Text style={s.badgeText}>{badge}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Stats */}
          <View style={s.stats}>
            <View style={s.stat}>
              <Text style={s.statVal}>{RAHUL.partiesAttended}</Text>
              <Text style={s.statLabel}>ATTENDED</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.stat}>
              <Text style={s.statVal}>{RAHUL.invitesSent}</Text>
              <Text style={s.statLabel}>INVITED</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.stat}>
              <Text style={s.statVal}>{RAHUL.savedCount}</Text>
              <Text style={s.statLabel}>SAVED</Text>
            </View>
          </View>

          {/* Invite card */}
          <TouchableOpacity style={s.inviteCard} onPress={handleInvite} activeOpacity={0.85}>
            <View>
              <Text style={s.inviteTitle}>Invite Friends · Earn ₹100</Text>
              <Text style={s.inviteCode}>Code: {RAHUL.referralCode}</Text>
            </View>
            <View style={s.shareChip}>
              <Text style={s.shareIcon}>↑</Text>
              <Text style={s.shareText}>Share</Text>
            </View>
          </TouchableOpacity>

          {/* Tabs */}
          <View style={s.tabs}>
            {([
              { key: 'gallery', label: 'Gallery' },
              { key: 'events', label: 'Events' },
              { key: 'reviews', label: 'Reviews' },
            ] as const).map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[s.tab, activeTab === tab.key && s.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'gallery' && (
            <View>
              {MY_POSTS.length === 0 ? (
                <View style={s.empty}>
                  <Text style={s.emptyIcon}>📸</Text>
                  <Text style={s.emptyText}>No photos yet</Text>
                </View>
              ) : (
                <View style={s.photoGrid}>
                  {MY_POSTS.map(post => (
                    <TouchableOpacity
                      key={post.id}
                      style={s.gridThumb}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('Gallery', { eventId: post.eventId })}
                    >
                      <Image source={{ uri: post.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <View style={s.gridOverlay}>
                        <Text style={s.gridLikes}>❤️ {post.likes}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'events' && (
            <View style={s.eventsTab}>
              {ATTENDED.map(event => (
                <TouchableOpacity
                  key={event.id}
                  style={s.eventRow}
                  onPress={() => navigation.navigate('ClosedEvent', { eventId: event.id })}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: event.coverImage }} style={s.eventThumb} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={s.eventMeta}>{event.area} · {event.host.name}</Text>
                    <View style={s.closedTag}>
                      <Text style={s.closedTagText}>★ Rate Event</Text>
                    </View>
                  </View>
                  <Text style={{ color: T.gold, fontSize: 20 }}>›</Text>
                </TouchableOpacity>
              ))}
              {ATTENDED.length === 0 && (
                <View style={s.empty}>
                  <Text style={s.emptyIcon}>🎟️</Text>
                  <Text style={s.emptyText}>No events attended yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={s.reviewsTab}>
              {MY_REVIEWS.length === 0 ? (
                <View style={s.reviewPlaceholder}>
                  <Text style={s.reviewIcon}>💬</Text>
                  <Text style={s.reviewText}>Your reviews will appear here after you rate events you've attended.</Text>
                  {ATTENDED.length > 0 && (
                    <TouchableOpacity
                      style={s.rateBtn}
                      onPress={() => navigation.navigate('ClosedEvent', { eventId: ATTENDED[0].id })}
                    >
                      <Text style={s.rateBtnText}>Rate {ATTENDED[0].title} →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {MY_REVIEWS.map(r => (
                    <TouchableOpacity
                      key={r.id}
                      style={s.reviewCard}
                      onPress={() => navigation.navigate('ClosedEvent', { eventId: r.eventId })}
                      activeOpacity={0.8}
                    >
                      <Text style={s.reviewEventTitle}>{r.eventTitle}</Text>
                      <View style={{ flexDirection: 'row', gap: 2, marginVertical: 5 }}>
                        {[1,2,3,4,5].map(n => (
                          <Text key={n} style={{ color: n <= r.rating ? T.gold : T.border, fontSize: 13 }}>★</Text>
                        ))}
                      </View>
                      <Text style={s.reviewComment} numberOfLines={3}>{r.comment}</Text>
                      <Text style={s.reviewDate}>{r.date}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Settings */}
          <View style={s.settings}>
            {[
              { icon: '🔔', label: 'Notifications' },
              { icon: '🛡️', label: 'Privacy & Safety' },
              { icon: '💳', label: 'Payment Methods' },
              { icon: '❓', label: 'Help & Support' },
              { icon: '🚪', label: 'Sign Out', danger: true },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                style={s.settingRow}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.label === 'Sign Out') {
                    Alert.alert('Sign Out', 'Are you sure?', [
                      { text: 'Cancel' },
                      { text: 'Sign Out', style: 'destructive' },
                    ]);
                  } else {
                    Alert.alert(item.label, 'Coming soon! We\'re working on this.', [{ text: 'OK' }]);
                  }
                }}
              >
                <Text style={s.settingIcon}>{item.icon}</Text>
                <Text style={[s.settingLabel, (item as any).danger && { color: '#FF5A5A' }]}>{item.label}</Text>
                <Text style={{ color: T.textMute, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
      <BottomNav navigation={navigation} active="Profile" />
    </View>
  );
}

const GRID_SIZE = (W - 40 - 4) / 2;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: T.gold,
    backgroundColor: T.elevated,
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: T.green, borderWidth: 2, borderColor: T.bg,
  },
  name: { color: T.text, fontSize: 20, fontWeight: '800' },
  city: { color: T.textSub, fontSize: 13, marginTop: 2 },
  member: { color: T.textMute, fontSize: 11, marginTop: 3 },
  editBtn: {
    backgroundColor: T.elevated, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: T.border,
  },
  editText: { color: T.text, fontSize: 13, fontWeight: '600' },

  bio: {
    color: T.textSub, fontSize: 14, lineHeight: 20,
    paddingHorizontal: 20, marginBottom: 16,
  },

  badgeRow: { paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.goldDim, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  badgeIcon: { color: T.gold, fontSize: 10 },
  badgeText: { color: T.gold, fontSize: 12, fontWeight: '600' },

  stats: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: T.card, borderRadius: 16,
    borderWidth: 1, borderColor: T.border,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statVal: { color: T.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: T.textMute, fontSize: 9, fontWeight: '600', letterSpacing: 1, marginTop: 3 },
  statDiv: { width: 1, backgroundColor: T.border, marginVertical: 12 },

  inviteCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: T.goldDim, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  inviteTitle: { color: T.gold, fontSize: 15, fontWeight: '700' },
  inviteCode: { color: T.textSub, fontSize: 12, marginTop: 3 },
  shareChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.gold, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  shareIcon: { color: '#000', fontSize: 16, fontWeight: '700' },
  shareText: { color: '#000', fontSize: 13, fontWeight: '700' },

  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: T.elevated, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: T.border,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: T.card },
  tabText: { color: T.textMute, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: T.text },

  photoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
    paddingHorizontal: 20, marginBottom: 20,
  },
  gridThumb: {
    width: GRID_SIZE, height: GRID_SIZE, borderRadius: 14, overflow: 'hidden',
    backgroundColor: T.elevated,
  },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', padding: 6,
  },
  gridLikes: { color: '#fff', fontSize: 12, fontWeight: '600' },

  eventsTab: { paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.card, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: T.border,
  },
  eventThumb: { width: 72, height: 72 },
  eventTitle: { color: T.text, fontSize: 14, fontWeight: '700', flex: 1 },
  eventMeta: { color: T.textSub, fontSize: 12, marginTop: 2 },
  closedTag: {
    marginTop: 5, backgroundColor: T.goldDim, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  closedTagText: { color: T.gold, fontSize: 11, fontWeight: '600' },

  reviewsTab: { paddingHorizontal: 20, marginBottom: 20 },
  reviewPlaceholder: {
    backgroundColor: T.card, borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 12, borderWidth: 1, borderColor: T.border,
  },
  reviewIcon: { fontSize: 36 },
  reviewText: { color: T.textSub, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  rateBtn: {
    backgroundColor: T.gold, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  rateBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
  reviewCard: {
    backgroundColor: T.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: T.border,
  },
  reviewEventTitle: { color: T.textMute, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  reviewComment: { color: T.textSub, fontSize: 13, lineHeight: 19 },
  reviewDate: { color: T.textMute, fontSize: 11, marginTop: 6 },

  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: T.textSub, fontSize: 15 },

  settings: { marginHorizontal: 20, marginTop: 8, marginBottom: 8, gap: 2 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: T.card, paddingHorizontal: 16, paddingVertical: 15,
    borderRadius: 14, borderWidth: 1, borderColor: T.border,
  },
  settingIcon: { fontSize: 18 },
  settingLabel: { flex: 1, color: T.text, fontSize: 15 },
});
