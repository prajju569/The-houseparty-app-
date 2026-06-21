import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, Share, Alert, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../features/auth/authStore';
import { useTheme } from '../../../theme/ThemeContext';
import { supabase } from '../../../services/supabaseClient';
import { Feather } from '@expo/vector-icons';
import { getFollowerCount, getFollowingCount } from '../../../services/followService';

export default function ProfileScreen({ navigation }: any) {
  const { T, isDark, toggleTheme } = useTheme();
  const { profile, reset, session, appMode, setAppMode } = useAuthStore();

  const [followers,  setFollowers]  = useState(0);
  const [following,  setFollowing]  = useState(0);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    getFollowerCount(uid).then(setFollowers);
    getFollowingCount(uid).then(setFollowing);
  }, [session]);

  const displayName = profile?.display_name ?? '';
  const avatarUri   = profile?.avatar_url   ?? undefined;

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => { await supabase.auth.signOut(); reset(); },
      },
    ]);
  }

  function handleInvite() {
    Share.share({
      message: 'Join me on Houseparty 🎉 — parties near you, only for the cool kids.',
      title: 'Invite to Houseparty',
    });
  }

  const MENU_ROWS: { icon: keyof typeof Feather.glyphMap; label: string; onPress?: () => void; toggle?: boolean }[] = [
    { icon: 'search',         label: 'Find people',   onPress: () => navigation.navigate('PeopleSearch') },
    { icon: 'bookmark',       label: 'Saved events',  onPress: () => navigation.navigate('Saved') },
    { icon: 'message-circle', label: 'Messages',      onPress: () => navigation.navigate('Conversations') },
    { icon: 'bell',     label: 'Notifications', onPress: () => navigation.navigate('Notifications') },
    { icon: 'settings', label: 'Settings',      onPress: () => navigation.navigate('Settings') },
  ];

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── Avatar + identity ── */}
          <View style={s.heroSection}>
            <TouchableOpacity
              style={s.avatarWrap}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.85}
            >
              {avatarUri
                ? <Image source={{ uri: avatarUri }} style={[s.avatar, { borderColor: T.accent }]} />
                : <View style={[s.avatar, { borderColor: T.accent, backgroundColor: T.elevated, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: T.accent, fontSize: 32, fontWeight: '700' }}>{displayName?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>}
              <View style={[s.editBadge, { backgroundColor: T.accent }]}>
                <Feather name="edit-2" size={11} color={T.onAccent} />
              </View>
            </TouchableOpacity>

            <Text style={[s.name, { color: T.text }]}>{displayName}</Text>
            <Text style={[s.city, { color: T.textMute }]}>Mumbai, India</Text>
            <Text style={[s.joined, { color: T.textMute }]}>joined 2024</Text>
          </View>

          {/* ── Guest / Host mode switcher ── */}
          <View style={[s.modeSwitcher, { backgroundColor: T.surface, borderColor: T.border }]}>
            {(['GUEST', 'HOST'] as const).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[s.modeTab, appMode === mode && { backgroundColor: T.accent }]}
                onPress={() => {
                  if (mode !== appMode) setAppMode(mode);
                }}
                activeOpacity={0.8}
              >
                <Text style={[s.modeTabText, { color: appMode === mode ? '#090909' : T.textMute }]}>
                  {mode === 'GUEST' ? 'Guest' : 'Host Mode'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Stats card ── */}
          <View style={[s.statsCard, { backgroundColor: T.surface, borderColor: T.border }]}>
            {[
              { val: followers, label: 'FOLLOWERS' },
              { val: following, label: 'FOLLOWING' },
              { val: '4.9★',   label: 'RATING'  },
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

          {/* ── Music & Vibe card ── */}
          {((profile?.top_genres?.length ?? 0) > 0 || (profile?.vibe_tags?.length ?? 0) > 0) && (
            <View style={[s.vibeCard, { backgroundColor: T.surface, borderColor: T.border }]}>
              <View style={s.vibeCardHeader}>
                <Text style={[s.vibeCardTitle, { color: T.text }]}>🎵 Music & Vibe</Text>
                <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.7}>
                  <Feather name="edit-2" size={14} color={T.textMute} />
                </TouchableOpacity>
              </View>
              {(profile?.top_genres?.length ?? 0) > 0 && (
                <View style={s.vibeChips}>
                  {profile!.top_genres!.map(g => (
                    <View key={g} style={[s.vibeChip, { backgroundColor: 'rgba(232,227,216,0.08)', borderColor: T.border }]}>
                      <Text style={[s.vibeChipText, { color: T.text }]}>{g}</Text>
                    </View>
                  ))}
                </View>
              )}
              {(profile?.vibe_tags?.length ?? 0) > 0 && (
                <View style={s.vibeChips}>
                  {profile!.vibe_tags!.map(v => (
                    <View key={v} style={[s.vibeChip, { backgroundColor: 'rgba(232,227,216,0.08)', borderColor: T.border }]}>
                      <Text style={[s.vibeChipText, { color: T.accent }]}>{v}</Text>
                    </View>
                  ))}
                </View>
              )}
              {profile?.top_artists?.length && (
                <Text style={[s.artistsTx, { color: T.textMute }]}>
                  ♫ {profile.top_artists.slice(0, 4).join(' · ')}
                </Text>
              )}
            </View>
          )}

          {/* ── Menu rows ── */}
          <View style={[s.menuCard, { backgroundColor: T.surface, borderColor: T.border }]}>
            {MENU_ROWS.map((row, i) => (
              <React.Fragment key={row.label}>
                {i > 0 && <View style={[s.sep, { backgroundColor: T.separator }]} />}
                <TouchableOpacity style={s.menuRow} onPress={row.onPress} activeOpacity={0.7}>
                  <View style={[s.menuIconWrap, { backgroundColor: T.surfaceHigh }]}>
                    <Feather name={row.icon} size={17} color={T.text} />
                  </View>
                  <Text style={[s.menuLabel, { color: T.text }]}>{row.label}</Text>
                  <Text style={[s.chevron, { color: T.textMute }]}>›</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}

            {/* Theme toggle row */}
            <View style={[s.sep, { backgroundColor: T.separator }]} />
            <View style={s.menuRow}>
              <View style={[s.menuIconWrap, { backgroundColor: T.surfaceHigh }]}>
                <Feather name={isDark ? 'moon' : 'sun'} size={17} color={T.text} />
              </View>
              <Text style={[s.menuLabel, { color: T.text }]}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: T.border, true: 'rgba(232,227,216,0.5)' }}
                thumbColor={isDark ? T.accent : T.textMute}
              />
            </View>
          </View>

          {/* ── Invite strip ── */}
          <TouchableOpacity
            style={[s.inviteStrip, { backgroundColor: 'rgba(232,227,216,0.08)', borderColor: 'rgba(232,227,216,0.15)' }]}
            onPress={handleInvite}
            activeOpacity={0.8}
          >
            <Text style={[s.inviteText, { color: T.accent }]}>🎁  Invite friends · Earn ₹100 per referral</Text>
            <Text style={[s.inviteArrow, { color: T.accent }]}>↑</Text>
          </TouchableOpacity>

          {/* ── Sign out ── */}
          <TouchableOpacity
            style={[s.signOutRow, { backgroundColor: T.surface, borderColor: T.border }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={17} color={T.red} />
            <Text style={[s.signOutLabel, { color: T.red }]}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 22 },

  // Hero
  heroSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 28 },
  avatarWrap:  { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 92, height: 92, borderRadius: 46,
    borderWidth: 2.5, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  name:   { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, marginBottom: 4 },
  city:   { fontSize: 14, fontWeight: '500', marginBottom: 3 },
  joined: { fontSize: 12, fontWeight: '400' },

  // Mode switcher
  modeSwitcher: {
    flexDirection: 'row', borderRadius: 20, borderWidth: 1,
    marginBottom: 12, padding: 4, gap: 4,
  },
  modeTab: {
    flex: 1, paddingVertical: 10, borderRadius: 16, alignItems: 'center',
  },
  modeTabText: { fontSize: 13, fontWeight: '700' },

  // Stats card
  statsCard: {
    flexDirection: 'row', borderRadius: 20, borderWidth: 1,
    marginBottom: 14, overflow: 'hidden',
  },
  statCol: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statVal: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  statLbl: { fontSize: 9, fontWeight: '600', letterSpacing: 1.1 },

  // Vibe card
  vibeCard:       { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 14 },
  vibeCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  vibeCardTitle:  { fontSize: 14, fontWeight: '700' },
  vibeChips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  vibeChip:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  vibeChipText:   { fontSize: 12, fontWeight: '500' },
  artistsTx:      { fontSize: 12, marginTop: 4 },
  statDiv: { width: 1, marginVertical: 12 },

  // Menu card
  menuCard: {
    borderRadius: 20, borderWidth: 1,
    marginBottom: 14, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  chevron:   { fontSize: 22, lineHeight: 26 },
  sep:       { height: 1, marginLeft: 64 },

  // Invite strip
  inviteStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, marginBottom: 14,
  },
  inviteText:  { fontSize: 13, fontWeight: '600' },
  inviteArrow: { fontSize: 18, fontWeight: '700' },

  // Sign out
  signOutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1,
  },
  signOutLabel: { fontSize: 15, fontWeight: '600' },
});
