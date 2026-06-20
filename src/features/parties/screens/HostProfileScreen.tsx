import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Image, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../../features/auth/authStore';
import {
  followUser, unfollowUser, isFollowing as checkFollowing,
  getFollowerCount, getHostStats, fetchHostReviews, submitHostReview,
  type HostReview,
} from '../../../services/followService';
import { fetchHostEvents, type Event } from '../../../services/eventService';
import { supabase } from '../../../services/supabaseClient';

type Props = { route: any; navigation: any };

type HostProfile = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

function StarRow({ rating, onRate }: { rating: number; onRate: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onRate(n)} activeOpacity={0.7}>
          <Feather name="star" size={24} color={n <= rating ? '#F59E0B' : 'rgba(255,255,255,0.2)'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function HostProfileScreen({ route, navigation }: Props) {
  const { hostId } = route.params as { hostId: string };
  const { T, isDark } = useTheme();
  const { session } = useAuthStore();
  const myId = session?.user?.id ?? null;

  const [host,          setHost]          = useState<HostProfile | null>(null);
  const [following,     setFollowing]     = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [stats,         setStats]         = useState({ avgRating: 0, reviewCount: 0, eventCount: 0 });
  const [pastEvents,    setPastEvents]    = useState<Event[]>([]);
  const [reviews,       setReviews]       = useState<HostReview[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Review form
  const [myRating,  setMyRating]  = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [profileRes, followRes, followerRes, statsRes, eventsRes, reviewsRes] = await Promise.all([
      supabase.from('profiles').select('id, display_name, username, avatar_url, bio').eq('id', hostId).single(),
      myId ? checkFollowing(myId, hostId) : Promise.resolve(false),
      getFollowerCount(hostId),
      getHostStats(hostId),
      fetchHostEvents(hostId),
      fetchHostReviews(hostId),
    ]);
    setHost(profileRes.data as HostProfile | null);
    setFollowing(followRes);
    setFollowerCount(followerRes);
    setStats(statsRes);
    setPastEvents(eventsRes);
    setReviews(reviewsRes);
    setLoading(false);
    setRefreshing(false);
  }, [hostId, myId]);

  useEffect(() => { load(); }, [load]);

  async function handleFollow() {
    if (!myId) { Alert.alert('Sign in to follow hosts'); return; }
    setFollowLoading(true);
    if (following) {
      await unfollowUser(myId, hostId);
      setFollowing(false);
      setFollowerCount(c => Math.max(0, c - 1));
    } else {
      await followUser(myId, hostId);
      setFollowing(true);
      setFollowerCount(c => c + 1);
    }
    setFollowLoading(false);
  }

  async function handleSubmitReview() {
    if (!myId) { Alert.alert('Sign in to leave a review'); return; }
    if (myRating === 0) { Alert.alert('Pick a rating', 'Tap the stars before submitting.'); return; }
    setSubmitting(true);
    const ok = await submitHostReview(hostId, myId, null, myRating, myComment.trim());
    setSubmitting(false);
    if (ok) {
      setMyRating(0);
      setMyComment('');
      load();
    } else {
      Alert.alert('Could not submit', 'Try again in a moment.');
    }
  }

  const isNewHost      = stats.eventCount <= 1;
  const isExperienced  = stats.eventCount >= 3;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={T.accent} />
      </View>
    );
  }

  const s = makeStyles(T, isDark);

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={T.accent} />}
        >
          {/* Back */}
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={T.textMute} />
          </TouchableOpacity>

          {/* Hero */}
          <View style={s.hero}>
            <View style={s.avatarWrap}>
              {host?.avatar_url ? (
                <Image source={{ uri: host.avatar_url }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Text style={s.avatarInitials}>
                    {(host?.display_name ?? 'H').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Text style={s.name}>{host?.display_name ?? 'Host'}</Text>
            {host?.username ? <Text style={s.username}>@{host.username}</Text> : null}
            {host?.bio ? <Text style={s.bio}>{host.bio}</Text> : null}

            {/* Trust badges */}
            <View style={s.badges}>
              {isNewHost && (
                <View style={[s.badge, s.badgeNew]}>
                  <Feather name="star" size={11} color="#F59E0B" />
                  <Text style={s.badgeNewText}>New Host</Text>
                </View>
              )}
              {isExperienced && (
                <View style={[s.badge, s.badgeExp]}>
                  <Feather name="shield" size={11} color="#00D37F" />
                  <Text style={s.badgeExpText}>Experienced</Text>
                </View>
              )}
              {stats.avgRating >= 4.5 && (
                <View style={[s.badge, s.badgeStar]}>
                  <Text style={s.badgeStarText}>⭐ Top Rated</Text>
                </View>
              )}
            </View>

            {/* Follow button */}
            <TouchableOpacity
              style={[s.followBtn, following && s.followBtnActive]}
              onPress={handleFollow}
              disabled={followLoading || myId === hostId}
              activeOpacity={0.85}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={following ? T.accent : '#090909'} />
              ) : (
                <Text style={[s.followText, following && s.followTextActive]}>
                  {myId === hostId ? 'Your Profile' : following ? 'Following ✓' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Stats strip */}
          <View style={s.statsRow}>
            {[
              { val: followerCount,      label: 'FOLLOWERS' },
              { val: stats.eventCount,   label: 'EVENTS' },
              { val: stats.avgRating > 0 ? `${stats.avgRating}★` : '—', label: 'RATING' },
              { val: stats.reviewCount,  label: 'REVIEWS' },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <View style={s.statDiv} />}
                <View style={s.statCol}>
                  <Text style={s.statVal}>{item.val}</Text>
                  <Text style={s.statLbl}>{item.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Past events */}
          {pastEvents.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Past Events</Text>
              {pastEvents.slice(0, 4).map(event => (
                <TouchableOpacity
                  key={event.id}
                  style={s.eventRow}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  activeOpacity={0.8}
                >
                  <View style={s.eventDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.eventName} numberOfLines={1}>{event.title}</Text>
                    <Text style={s.eventMeta}>
                      {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {event.area ? ` · ${event.area}` : ''}
                    </Text>
                  </View>
                  <Text style={s.eventRsvp}>{event.booking_count ?? 0} RSVPs</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Reviews */}
          <Text style={s.sectionTitle}>Reviews</Text>

          {reviews.length === 0 ? (
            <View style={s.emptyReviews}>
              <Feather name="message-square" size={24} color={T.textMute} />
              <Text style={s.emptyReviewsTx}>No reviews yet. Be the first!</Text>
            </View>
          ) : (
            reviews.map(r => (
              <View key={r.id} style={s.reviewCard}>
                <View style={s.reviewHeader}>
                  <View style={s.reviewAvatar}>
                    <Text style={s.reviewAvatarText}>
                      {(r.profiles?.display_name ?? 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.reviewName}>{r.profiles?.display_name ?? 'Guest'}</Text>
                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <Feather key={n} name="star" size={11} color={n <= r.rating ? '#F59E0B' : 'rgba(255,255,255,0.15)'} />
                      ))}
                    </View>
                  </View>
                  <Text style={s.reviewDate}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                {r.comment ? <Text style={s.reviewComment}>{r.comment}</Text> : null}
              </View>
            ))
          )}

          {/* Leave a review */}
          {myId && myId !== hostId && (
            <View style={s.reviewForm}>
              <Text style={s.reviewFormTitle}>Leave a review</Text>
              <StarRow rating={myRating} onRate={setMyRating} />
              <TextInput
                style={s.commentInput}
                value={myComment}
                onChangeText={setMyComment}
                placeholder="Share your experience with this host…"
                placeholderTextColor={T.textMute}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
              />
              <TouchableOpacity
                style={[s.submitBtn, (!myRating || submitting) && { opacity: 0.45 }]}
                onPress={handleSubmitReview}
                disabled={!myRating || submitting}
                activeOpacity={0.88}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#090909" />
                  : <Text style={s.submitText}>Submit review</Text>}
              </TouchableOpacity>
            </View>
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
    back:   { marginTop: 8, marginBottom: 20, alignSelf: 'flex-start', padding: 4 },

    hero:       { alignItems: 'center', paddingBottom: 24 },
    avatarWrap: { marginBottom: 14 },
    avatar:     { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: T.accent },
    avatarFallback: { backgroundColor: 'rgba(232,227,216,0.12)', alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { fontSize: 28, fontWeight: '700', color: T.accent },
    name:     { fontSize: 22, fontWeight: '700', color: T.text, letterSpacing: -0.5, marginBottom: 4 },
    username: { fontSize: 14, color: T.textMute, marginBottom: 8 },
    bio:      { fontSize: 14, color: T.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 12, paddingHorizontal: 16 },

    badges:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 },
    badge:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    badgeNew:    { backgroundColor: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.30)' },
    badgeNewText:{ color: '#F59E0B', fontSize: 11, fontWeight: '600' },
    badgeExp:    { backgroundColor: 'rgba(0,211,127,0.10)', borderColor: 'rgba(0,211,127,0.30)' },
    badgeExpText:{ color: '#00D37F', fontSize: 11, fontWeight: '600' },
    badgeStar:   { backgroundColor: 'rgba(232,227,216,0.08)', borderColor: 'rgba(232,227,216,0.20)' },
    badgeStarText:{ color: T.accent, fontSize: 11, fontWeight: '600' },

    followBtn:      { paddingHorizontal: 32, paddingVertical: 13, borderRadius: 28, backgroundColor: T.accent, minWidth: 140, alignItems: 'center' },
    followBtnActive:{ backgroundColor: 'transparent', borderWidth: 1, borderColor: T.accent },
    followText:     { color: '#090909', fontSize: 15, fontWeight: '700' },
    followTextActive:{ color: T.accent },

    statsRow: { flexDirection: 'row', backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 20, paddingVertical: 16, marginBottom: 28 },
    statCol:  { flex: 1, alignItems: 'center' },
    statDiv:  { width: 1, backgroundColor: T.border, marginVertical: 6 },
    statVal:  { fontSize: 18, fontWeight: '700', color: T.text, letterSpacing: -0.3, marginBottom: 3 },
    statLbl:  { fontSize: 9, fontWeight: '600', color: T.textMute, letterSpacing: 1.2, textTransform: 'uppercase' },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: T.text, letterSpacing: -0.3, marginBottom: 12 },

    eventRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border },
    eventDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: T.accent },
    eventName: { fontSize: 14, fontWeight: '600', color: T.text, marginBottom: 2 },
    eventMeta: { fontSize: 12, color: T.textMute },
    eventRsvp: { fontSize: 12, color: T.textMute, fontWeight: '500' },

    emptyReviews:   { alignItems: 'center', gap: 8, paddingVertical: 32 },
    emptyReviewsTx: { color: T.textMute, fontSize: 14 },

    reviewCard:   { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, marginBottom: 10 },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    reviewAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(232,227,216,0.15)', alignItems: 'center', justifyContent: 'center' },
    reviewAvatarText: { fontSize: 13, fontWeight: '700', color: T.accent },
    reviewName:   { fontSize: 13, fontWeight: '600', color: T.text },
    reviewDate:   { fontSize: 11, color: T.textMute },
    reviewComment:{ fontSize: 13, color: T.textSub, lineHeight: 20 },

    reviewForm:      { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 20, padding: 18, marginTop: 16 },
    reviewFormTitle: { fontSize: 15, fontWeight: '700', color: T.text, marginBottom: 14 },
    commentInput:    { color: T.text, fontSize: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 14, marginTop: 14, marginBottom: 14, minHeight: 80 },
    submitBtn:       { height: 50, borderRadius: 25, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
    submitText:      { color: '#090909', fontSize: 15, fontWeight: '700' },
  });
}
