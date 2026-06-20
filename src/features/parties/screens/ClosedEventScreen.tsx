import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, TextInput, Alert, Dimensions, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import { fetchEvent, type Event as SupaEvent } from '../../../services/eventService';
import { supabase } from '../../../services/supabaseClient';
import { useAuthStore } from '../../../features/auth/authStore';

const W = Dimensions.get('window').width;

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { T } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={{ padding: 4 }}
        >
          <Text style={{ fontSize: 28, color: n <= value ? T.gold : T.elevated }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: any }) {
  const { T } = useTheme();
  const rv = StyleSheet.create({
    card: {
      backgroundColor: T.elevated, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: T.border, gap: 10,
    },
    header:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar:  { width: 36, height: 36, borderRadius: 18, backgroundColor: T.card },
    name:    { color: T.text, fontSize: 14, fontWeight: '600', marginBottom: 3 },
    date:    { color: T.textMute, fontSize: 11 },
    comment: { color: T.textSub, fontSize: 13, lineHeight: 20 },
  });

  return (
    <View style={rv.card}>
      <View style={rv.header}>
        <Image source={{ uri: review.avatar }} style={rv.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={rv.name}>{review.user}</Text>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {[1,2,3,4,5].map(n => (
              <Text key={n} style={{ color: n <= review.rating ? T.gold : T.border, fontSize: 12 }}>★</Text>
            ))}
          </View>
        </View>
        <Text style={rv.date}>{review.date}</Text>
      </View>
      <Text style={rv.comment}>{review.comment}</Text>
    </View>
  );
}

export default function ClosedEventScreen({ route, navigation }: any) {
  const { T } = useTheme();
  const { profile } = useAuthStore();
  const eventId = route?.params?.eventId;
  const [event,       setEvent]       = useState<SupaEvent | null>(null);
  const [hostProfile, setHostProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [myRating,    setMyRating]    = useState(0);
  const [myReview,    setMyReview]    = useState('');
  const [reviews,     setReviews]     = useState<{ id: string; user: string; avatar?: string; rating: number; comment: string; date: string }[]>([]);
  const [submitted,   setSubmitted]   = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetchEvent(eventId).then(ev => {
      setEvent(ev);
      setLoading(false);
      if (ev?.host_id) {
        supabase.from('public_profiles').select('display_name, avatar_url').eq('id', ev.host_id).single()
          .then(({ data }) => { if (data) setHostProfile(data as any); });
      }
    });
  }, [eventId]);

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },

    cover: { height: 240, position: 'relative' },
    coverImg: { width: '100%', height: '100%' },
    coverOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
    coverTop: {
      position: 'absolute', top: 0, left: 0, right: 0,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 8,
    },
    back: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
    closedBadge: {
      backgroundColor: 'rgba(255,90,90,0.2)', borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: 'rgba(255,90,90,0.4)',
    },
    closedText: { color: '#FF5A5A', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
    coverBottom: { position: 'absolute', bottom: 20, left: 20 },
    coverTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    coverSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },

    content: { padding: 20 },

    ratingCard: {
      flexDirection: 'row', backgroundColor: T.card, borderRadius: 16,
      padding: 16, borderWidth: 1, borderColor: T.border, marginBottom: 16, gap: 16,
    },
    ratingLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 80 },
    bigRating:  { color: T.gold, fontSize: 42, fontWeight: '800' },
    reviewCount:{ color: T.textMute, fontSize: 11, marginTop: 2 },
    ratingBars: { flex: 1, justifyContent: 'center', gap: 5 },
    barRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
    barStar:    { color: T.textMute, fontSize: 11, width: 10 },
    barTrack: {
      flex: 1, height: 4, backgroundColor: T.elevated, borderRadius: 2, overflow: 'hidden',
    },
    barFill:  { height: '100%', backgroundColor: T.gold, borderRadius: 2 },
    barCount: { color: T.textMute, fontSize: 10, width: 14, textAlign: 'right' },

    hostRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: T.card, borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: T.border, marginBottom: 16,
    },
    hostAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.elevated },
    hostedBy:   { color: T.textMute, fontSize: 11 },
    hostName:   { color: T.text, fontSize: 15, fontWeight: '700' },
    chatChip: {
      backgroundColor: T.goldDim, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 7,
      borderWidth: 1, borderColor: 'rgba(232,227,216,0.22)',
    },
    chatChipText: { color: T.gold, fontSize: 13, fontWeight: '600' },

    galleryLink: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: T.card, borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: T.border, marginBottom: 20,
    },
    galleryThumbRow: { flexDirection: 'row', gap: 3 },
    galleryThumb:    { width: 40, height: 40, borderRadius: 8, backgroundColor: T.elevated },
    galleryTitle:    { color: T.text, fontSize: 14, fontWeight: '600' },
    gallerySub:      { color: T.textSub, fontSize: 12, marginTop: 2 },

    sectionLabel: {
      color: T.textMute, fontSize: 11, fontWeight: '600',
      letterSpacing: 1.4, marginBottom: 14,
    },

    writeReview: {
      backgroundColor: T.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: T.border, gap: 14,
    },
    reviewInput: {
      backgroundColor: T.elevated, borderRadius: 12, padding: 14,
      color: T.text, fontSize: 14, lineHeight: 20,
      borderWidth: 1, borderColor: T.border, minHeight: 80, textAlignVertical: 'top',
    },
    submitBtn: {
      backgroundColor: T.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    },
    submitText: { color: '#000', fontSize: 15, fontWeight: '700' },

    doneCard: {
      backgroundColor: T.greenDim, borderRadius: 16, padding: 18,
      borderWidth: 1, borderColor: 'rgba(0,211,127,0.3)',
      flexDirection: 'row', gap: 14, alignItems: 'center',
    },
    doneIcon: { color: T.green, fontSize: 24 },
    doneText: { color: T.green, fontSize: 15, fontWeight: '700' },
    doneSub:  { color: 'rgba(0,211,127,0.7)', fontSize: 12, marginTop: 2 },

    reviewsList: { gap: 12 },
  });

  const avgRating = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  function submitReview() {
    if (myRating === 0) { Alert.alert('Add a rating', 'Tap the stars to rate the event.'); return; }
    const newReview = {
      id: `r${Date.now()}`,
      user: profile?.display_name ?? 'You',
      rating: myRating,
      comment: myReview.trim() || 'Great event!',
      date: 'Just now',
    };
    setReviews(prev => [newReview, ...prev]);
    setSubmitted(true);
    Animated.spring(successAnim, {
      toValue: 1, damping: 14, stiffness: 120, useNativeDriver: true,
    }).start();
  }

  if (loading || !event) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={T.accent} size="large" />
      </View>
    );
  }

  const hostName   = hostProfile?.display_name ?? 'Host';
  const hostAvatar = hostProfile?.avatar_url ?? undefined;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={s.cover}>
        <Image source={{ uri: event.cover_image ?? undefined }} style={s.coverImg} resizeMode="cover" />
        <View style={s.coverOverlay} />
        <SafeAreaView edges={['top']} style={s.coverTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={s.closedBadge}>
            <Text style={s.closedText}>EVENT CLOSED</Text>
          </View>
        </SafeAreaView>
        <View style={s.coverBottom}>
          <Text style={s.coverTitle}>{event.title}</Text>
          <Text style={s.coverSub}>{event.area ?? event.venue ?? ''}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <View style={s.ratingCard}>
            <View style={s.ratingLeft}>
              <Text style={s.bigRating}>{avgRating.toFixed(1)}</Text>
              <View style={{ flexDirection: 'row', gap: 2, marginVertical: 4 }}>
                {[1,2,3,4,5].map(n => (
                  <Text key={n} style={{ color: n <= Math.round(avgRating) ? T.gold : T.border, fontSize: 16 }}>★</Text>
                ))}
              </View>
              <Text style={s.reviewCount}>{reviews.length} reviews</Text>
            </View>
            <View style={s.ratingBars}>
              {[5,4,3,2,1].map(star => {
                const count = reviews.filter(r => r.rating === star).length;
                const pct = reviews.length ? count / reviews.length : 0;
                return (
                  <View key={star} style={s.barRow}>
                    <Text style={s.barStar}>{star}</Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${pct * 100}%` }]} />
                    </View>
                    <Text style={s.barCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={s.hostRow} onPress={() => navigation.navigate('Chat', { hostId: event.host_id })}>
            {hostAvatar
              ? <Image source={{ uri: hostAvatar }} style={s.hostAvatar} />
              : <View style={[s.hostAvatar, { backgroundColor: 'rgba(232,227,216,0.12)', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: T.accent, fontSize: 15, fontWeight: '700' }}>{hostName[0]?.toUpperCase()}</Text>
                </View>}
            <View style={{ flex: 1 }}>
              <Text style={s.hostedBy}>Hosted by</Text>
              <Text style={s.hostName}>{hostName}</Text>
            </View>
            <View style={s.chatChip}><Text style={s.chatChipText}>💬 Chat</Text></View>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.galleryLink}
            onPress={() => navigation.navigate('Gallery', { eventId: event.id })}
          >
            <View style={s.galleryThumbRow}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[s.galleryThumb, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.galleryTitle}>Event Gallery</Text>
              <Text style={s.gallerySub}>Tap to view photos</Text>
            </View>
            <Text style={{ color: T.gold, fontSize: 20 }}>›</Text>
          </TouchableOpacity>

          {!submitted ? (
            <View style={s.writeReview}>
              <Text style={s.sectionLabel}>RATE THIS EVENT</Text>
              <StarPicker value={myRating} onChange={setMyRating} />
              <TextInput
                style={s.reviewInput}
                value={myReview}
                onChangeText={setMyReview}
                placeholder="Share your experience..."
                placeholderTextColor={T.textMute}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={s.submitBtn} onPress={submitReview} activeOpacity={0.85}>
                <Text style={s.submitText}>Post Review</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View style={[s.doneCard, {
              opacity: successAnim,
              transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
            }]}>
              <Text style={s.doneIcon}>✓</Text>
              <View>
                <Text style={s.doneText}>Review posted!</Text>
                <Text style={s.doneSub}>Thanks for sharing your experience 🙌</Text>
              </View>
            </Animated.View>
          )}

          <Text style={[s.sectionLabel, { marginTop: 24 }]}>WHAT PEOPLE SAID</Text>
          <View style={s.reviewsList}>
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}
