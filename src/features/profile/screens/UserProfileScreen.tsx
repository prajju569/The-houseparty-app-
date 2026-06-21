import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../auth/authStore';
import { fetchPublicProfile, type PublicProfile } from '../../../services/profileService';
import {
  followUser, unfollowUser, isFollowing as checkFollowing,
  requestFollow, hasPendingRequest,
  getFollowerCount, getFollowingCount,
} from '../../../services/followService';
import { computeVibeScore, scoreLabel, scoreRingColor } from '../../../services/vibeService';

type Props = { route: any; navigation: any };

export default function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params as { userId: string };
  const { T, isDark } = useTheme();
  const { session, profile: me } = useAuthStore();
  const myId = session?.user?.id ?? null;
  const isSelf = myId === userId;

  const [user,      setUser]      = useState<PublicProfile | null>(null);
  const [following, setFollowing] = useState(false);
  const [pending,   setPending]   = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [busy,      setBusy]      = useState(false);

  const load = useCallback(async () => {
    const [u, fState, fCount, fgCount] = await Promise.all([
      fetchPublicProfile(userId),
      myId && !isSelf ? checkFollowing(myId, userId) : Promise.resolve(false),
      getFollowerCount(userId),
      getFollowingCount(userId),
    ]);
    setUser(u);
    setFollowing(fState);
    setFollowers(fCount);
    setFollowingCount(fgCount);
    // Only check for a pending request when private and not already following.
    if (u?.is_private && myId && !isSelf && !fState) {
      setPending(await hasPendingRequest(myId, userId));
    }
    setLoading(false);
  }, [userId, myId, isSelf]);

  useEffect(() => { load(); }, [load]);

  async function handleFollow() {
    if (!myId) { Alert.alert('Sign in to follow people'); return; }
    setBusy(true);
    if (following) {
      await unfollowUser(myId, userId);
      setFollowing(false);
      setFollowers(c => Math.max(0, c - 1));
    } else if (user?.is_private) {
      const ok = await requestFollow(myId, userId);
      if (ok) setPending(true);
    } else {
      await followUser(myId, userId);
      setFollowing(true);
      setFollowers(c => c + 1);
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={T.accent} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Feather name="user-x" size={28} color={T.textMute} />
        <Text style={{ color: T.textMute, marginTop: 12 }}>This profile isn’t available.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: T.accent, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Vibe match (me vs them). Only meaningful once both have some music taste.
  const myHasTaste   = !!(me?.top_genres?.length || me?.vibe_tags?.length || me?.top_artists?.length);
  const theyHaveTaste = !!(user.top_genres?.length || user.vibe_tags?.length || user.top_artists?.length);
  const score = (!isSelf && myHasTaste && theyHaveTaste) ? computeVibeScore(me!, user) : null;
  const label = score !== null ? scoreLabel(score) : null;
  const ringColor = score !== null ? scoreRingColor(score) : T.accent;

  const followLabel = isSelf ? 'Your Profile'
    : following ? 'Following ✓'
    : pending ? 'Requested'
    : user.is_private ? 'Request to Follow'
    : 'Follow';

  const s = makeStyles(T, isDark);
  const genres = user.top_genres ?? [];
  const vibes  = user.vibe_tags ?? [];
  const artists = user.top_artists ?? [];
  const songs  = user.top_songs ?? [];

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={T.textMute} />
          </TouchableOpacity>

          {/* Hero */}
          <View style={s.hero}>
            <View style={[s.avatarWrap, { borderColor: ringColor }]}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Text style={s.avatarInitials}>
                    {(user.display_name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={s.nameRow}>
              <Text style={s.name}>{user.display_name}</Text>
              {user.is_verified && <Feather name="check-circle" size={16} color="#3897F0" style={{ marginLeft: 6 }} />}
            </View>
            {user.username ? <Text style={s.username}>@{user.username}</Text> : null}
            {user.bio ? <Text style={s.bio}>{user.bio}</Text> : null}

            {/* Vibe match — the headline of a user-to-user profile */}
            {label && (
              <View style={[s.vibeCard, { borderColor: ringColor }]}>
                <Text style={[s.vibeScore, { color: label.color }]}>{score}%</Text>
                <Text style={s.vibeLabel}>{label.text.replace(/^\d+% /, '')}</Text>
              </View>
            )}
            {!isSelf && !myHasTaste && (
              <Text style={s.vibeHint}>Add your music taste in Edit Profile to see your vibe match.</Text>
            )}

            {/* Follow button */}
            <TouchableOpacity
              style={[s.followBtn, (following || pending) && s.followBtnActive]}
              onPress={handleFollow}
              disabled={busy || isSelf}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator size="small" color={(following || pending) ? T.accent : '#090909'} />
              ) : (
                <Text style={[s.followText, (following || pending) && s.followTextActive]}>{followLabel}</Text>
              )}
            </TouchableOpacity>

            {user.role === 'host' && (
              <TouchableOpacity
                style={s.hostLink}
                onPress={() => navigation.navigate('HostProfile', { hostId: userId })}
                activeOpacity={0.7}
              >
                <Text style={s.hostLinkText}>View host profile →</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Followers / following */}
          <View style={s.statsRow}>
            <View style={s.statCol}>
              <Text style={s.statVal}>{followers}</Text>
              <Text style={s.statLbl}>FOLLOWERS</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statCol}>
              <Text style={s.statVal}>{followingCount}</Text>
              <Text style={s.statLbl}>FOLLOWING</Text>
            </View>
          </View>

          {/* Music & vibe */}
          {(genres.length > 0 || vibes.length > 0 || artists.length > 0 || songs.length > 0) && (
            <>
              <Text style={s.sectionTitle}>Music & Vibe</Text>

              {genres.length > 0 && (
                <View style={s.chipWrap}>
                  {genres.map(g => <View key={g} style={s.chip}><Text style={s.chipText}>{g}</Text></View>)}
                </View>
              )}
              {vibes.length > 0 && (
                <View style={s.chipWrap}>
                  {vibes.map(v => <View key={v} style={[s.chip, s.chipVibe]}><Text style={s.chipText}>{v}</Text></View>)}
                </View>
              )}
              {artists.length > 0 && (
                <Text style={s.artists}>🎤 {artists.slice(0, 6).join(' · ')}</Text>
              )}

              {songs.length > 0 && (
                <>
                  <Text style={[s.sectionTitle, { marginTop: 22 }]}>Top songs</Text>
                  {songs.slice(0, 5).map((t, i) => (
                    <View key={i} style={s.songRow}>
                      {t.thumbnail_url
                        ? <Image source={{ uri: t.thumbnail_url }} style={s.songArt} />
                        : <View style={[s.songArt, s.songArtFallback]}><Feather name="music" size={14} color={T.textMute} /></View>}
                      <View style={{ flex: 1 }}>
                        <Text style={s.songTitle} numberOfLines={1}>{t.title}</Text>
                        <Text style={s.songArtist} numberOfLines={1}>{t.artist}</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T: any, isDark: boolean) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: T.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: 48 },
    back:   { marginTop: 8, marginBottom: 12, alignSelf: 'flex-start', padding: 4 },

    hero:       { alignItems: 'center', paddingBottom: 20 },
    avatarWrap: { marginBottom: 14, borderRadius: 50, borderWidth: 2.5, padding: 3 },
    avatar:     { width: 88, height: 88, borderRadius: 44 },
    avatarFallback: { backgroundColor: 'rgba(232,227,216,0.12)', alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { fontSize: 28, fontWeight: '700', color: T.accent },

    nameRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    name:     { fontSize: 22, fontWeight: '700', color: T.text, letterSpacing: -0.5 },
    username: { fontSize: 14, color: T.textMute, marginBottom: 8 },
    bio:      { fontSize: 14, color: T.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 14, paddingHorizontal: 16 },

    vibeCard:  { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20, borderWidth: 1.5, marginBottom: 16, backgroundColor: T.surface },
    vibeScore: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
    vibeLabel: { fontSize: 12, color: T.textMute, marginTop: 2, textTransform: 'lowercase' },
    vibeHint:  { fontSize: 12, color: T.textMute, textAlign: 'center', marginBottom: 16, paddingHorizontal: 24, lineHeight: 17 },

    followBtn:       { paddingHorizontal: 36, paddingVertical: 13, borderRadius: 28, backgroundColor: T.accent, minWidth: 160, alignItems: 'center' },
    followBtnActive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: T.accent },
    followText:      { color: '#090909', fontSize: 15, fontWeight: '700' },
    followTextActive:{ color: T.accent },

    hostLink:     { marginTop: 14, padding: 4 },
    hostLinkText: { color: T.accent, fontSize: 13, fontWeight: '600' },

    statsRow: { flexDirection: 'row', backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 20, paddingVertical: 16, marginBottom: 28 },
    statCol:  { flex: 1, alignItems: 'center' },
    statDiv:  { width: 1, backgroundColor: T.border, marginVertical: 6 },
    statVal:  { fontSize: 18, fontWeight: '700', color: T.text, letterSpacing: -0.3, marginBottom: 3 },
    statLbl:  { fontSize: 9, fontWeight: '600', color: T.textMute, letterSpacing: 1.2 },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: T.text, letterSpacing: -0.3, marginBottom: 12 },

    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: 'rgba(232,227,216,0.10)', borderWidth: 1, borderColor: T.border },
    chipVibe: { backgroundColor: 'rgba(137,116,230,0.12)' },
    chipText: { color: T.textSub, fontSize: 13 },
    artists:  { color: T.textSub, fontSize: 13, lineHeight: 20 },

    songRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
    songArt:        { width: 40, height: 40, borderRadius: 8 },
    songArtFallback:{ backgroundColor: 'rgba(232,227,216,0.10)', alignItems: 'center', justifyContent: 'center' },
    songTitle:      { color: T.text, fontSize: 14, fontWeight: '600' },
    songArtist:     { color: T.textMute, fontSize: 12, marginTop: 2 },
  });
}
