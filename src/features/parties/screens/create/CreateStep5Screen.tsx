import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Image, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../../../features/auth/authStore';
import { createEvent, uploadEventCover } from '../../../../services/eventService';
import { uploadGalleryPhoto } from '../../../../services/galleryService';

type Props = { route: any; navigation: any };

export default function CreateStep5Screen({ route, navigation }: Props) {
  const {
    title, description, vibe, date,
    capacity, entry_fee, venue, address, area, lat, lng,
    is_private, coverLocalUri, extraPhotoUris = [], min_age = null,
    playlist_url = null, playlist_tracks = null,
  } = route.params;

  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const eventDate = new Date(date);
  const dateStr   = eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr   = eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  async function publish() {
    if (!session?.user) return;
    setLoading(true);

    let cover_image: string | null = null;
    if (coverLocalUri) {
      cover_image = await uploadEventCover(session.user.id, coverLocalUri);
    }

    const { data, error } = await createEvent({
      host_id:     session.user.id,
      title,
      description: description || null,
      vibe:        vibe?.length ? vibe : null,
      date,
      venue:       venue || null,
      address:     address || null,
      area:        area || null,
      lat:         lat  ?? null,
      lng:         lng  ?? null,
      capacity,
      entry_fee,
      min_age:     min_age ?? null,
      cover_image,
      playlist_url:    playlist_url ?? null,
      playlist_tracks: playlist_tracks ?? null,
      is_private,
      status: 'upcoming',
    });

    if (error || !data) {
      setLoading(false);
      Alert.alert('Could not publish', error ?? 'Try again in a moment.');
      return;
    }

    // Upload extra gallery photos in parallel (fire-and-forget, non-blocking)
    if (extraPhotoUris.length > 0) {
      Promise.all(
        (extraPhotoUris as string[]).map((uri: string) =>
          uploadGalleryPhoto(data.id, session.user.id, uri)
        )
      ).catch(() => {});
    }

    setLoading(false);
    // Success — pop the whole create flow back to Dashboard
    navigation.navigate('Dashboard');
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color="rgba(244,242,236,0.6)" />
          </TouchableOpacity>

          <View style={s.steps}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={[s.step, s.stepActive]} />
            ))}
          </View>

          <Text style={s.title}>Looks great 🎉</Text>
          <Text style={s.sub}>Review your event before publishing.</Text>

          {/* Cover preview */}
          <View style={[s.coverBox, !coverLocalUri && s.coverPlaceholder]}>
            {coverLocalUri ? (
              <Image source={{ uri: coverLocalUri }} style={s.cover} resizeMode="cover" />
            ) : (
              <Feather name="image" size={32} color="rgba(232,227,216,0.3)" />
            )}
          </View>

          {/* Extra photos strip */}
          {(extraPhotoUris as string[]).length > 0 && (
            <View style={s.extraStrip}>
              {(extraPhotoUris as string[]).map((uri: string, i: number) => (
                <Image key={i} source={{ uri }} style={s.extraThumb} resizeMode="cover" />
              ))}
              <Text style={s.extraNote}>+{(extraPhotoUris as string[]).length} gallery photo{(extraPhotoUris as string[]).length > 1 ? 's' : ''}</Text>
            </View>
          )}

          {/* Details card */}
          <View style={s.card}>
            <Text style={s.eventTitle}>{title}</Text>
            {description ? <Text style={s.eventDesc}>{description}</Text> : null}

            <View style={s.detailRow}>
              <Feather name="calendar" size={14} color="rgba(232,227,216,0.5)" />
              <Text style={s.detailText}>{dateStr} · {timeStr}</Text>
            </View>
            {(venue || area) ? (
              <View style={s.detailRow}>
                <Feather name="map-pin" size={14} color="rgba(232,227,216,0.5)" />
                <Text style={s.detailText}>{[venue, area].filter(Boolean).join(' · ')}</Text>
              </View>
            ) : null}
            <View style={s.detailRow}>
              <Feather name="users" size={14} color="rgba(232,227,216,0.5)" />
              <Text style={s.detailText}>{capacity} guests max · {entry_fee === 0 ? 'Free entry' : `₹${entry_fee} entry`}</Text>
            </View>
            {is_private ? (
              <View style={s.detailRow}>
                <Feather name="eye-off" size={14} color="rgba(232,227,216,0.5)" />
                <Text style={s.detailText}>Address hidden until RSVP confirmed</Text>
              </View>
            ) : null}
            {vibe?.length ? (
              <View style={s.vibeRow}>
                {vibe.map((v: string) => (
                  <View key={v} style={s.vibeChip}>
                    <Text style={s.vibeText}>{v}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color="#E8E3D8" />
              <Text style={s.loadingText}>Publishing your event…</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.cta} onPress={publish} activeOpacity={0.88}>
              <Text style={s.ctaText}>Publish event</Text>
              <Feather name="check" size={18} color="#090909" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#090909' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  back:   { marginTop: 8, marginBottom: 24, alignSelf: 'flex-start', padding: 4 },

  steps:      { flexDirection: 'row', gap: 6, marginBottom: 32 },
  step:       { height: 4, borderRadius: 2 },
  stepActive: { flex: 1, backgroundColor: '#E8E3D8' },

  title: { fontSize: 28, fontWeight: '700', color: '#F4F2EC', letterSpacing: -0.9, marginBottom: 8 },
  sub:   { fontSize: 14, color: 'rgba(244,242,236,0.48)', marginBottom: 28 },

  coverBox:        { height: 180, borderRadius: 20, overflow: 'hidden', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  coverPlaceholder:{ alignItems: 'center', justifyContent: 'center' },
  cover:           { width: '100%', height: '100%' },

  card:        { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 20, padding: 20, marginBottom: 28 },
  eventTitle:  { fontSize: 20, fontWeight: '700', color: '#F4F2EC', letterSpacing: -0.4, marginBottom: 8 },
  eventDesc:   { fontSize: 13, color: 'rgba(244,242,236,0.55)', lineHeight: 20, marginBottom: 16 },
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  detailText:  { color: 'rgba(244,242,236,0.65)', fontSize: 13 },
  vibeRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  vibeChip:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(232,227,216,0.10)' },
  vibeText:    { color: 'rgba(232,227,216,0.70)', fontSize: 11 },

  loadingBox:  { alignItems: 'center', gap: 12, paddingVertical: 24 },
  loadingText: { color: 'rgba(244,242,236,0.5)', fontSize: 14 },

  extraStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  extraThumb: { width: 56, height: 56, borderRadius: 12 },
  extraNote:  { color: 'rgba(244,242,236,0.4)', fontSize: 12 },

  cta:    { height: 56, borderRadius: 28, backgroundColor: '#E8E3D8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 }, android: { elevation: 10 } }) },
  ctaText:{ color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
