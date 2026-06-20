import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, Dimensions, Modal, Alert, Platform,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../../features/auth/authStore';
import {
  fetchGalleryItems, uploadGalleryPhoto, fetchMyLikes,
  type GalleryItem,
} from '../../../services/galleryService';
import { hasAttendedEvent } from '../../../services/bookingService';
import { fetchEvent } from '../../../services/eventService';
import { validatePickedImage } from '../../../shared/utils/image';

const W = Dimensions.get('window').width;
const THUMB = (W - 44 - 8) / 2;

export default function GalleryScreen({ route, navigation }: any) {
  const { T, isDark } = useTheme();
  const { session } = useAuthStore();
  const myId = session?.user?.id ?? null;
  const eventId: string | undefined = route?.params?.eventId;

  // Real items from Supabase; fall back to fake data if no eventId
  const [realItems,   setRealItems]   = useState<GalleryItem[]>([]);
  const [liked,       setLiked]       = useState<Record<string, boolean>>({});
  const [likeCounts,  setLikeCounts]  = useState<Record<string, number>>({});
  const [loading,     setLoading]     = useState(!!eventId);
  const [refreshing,  setRefreshing]  = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [selected,    setSelected]    = useState<GalleryItem | null>(null);
  const [captionModal, setCaptionModal] = useState<{ uri: string } | null>(null);
  const [caption,     setCaption]     = useState('');
  const [eventStatus, setEventStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) { setLoading(false); setRefreshing(false); return; }
    const [items, myLikesSet] = await Promise.all([
      fetchGalleryItems(eventId),
      myId ? fetchMyLikes(myId, []) : Promise.resolve(new Set<string>()),
    ]);
    const likedMap: Record<string, boolean> = {};
    const countMap: Record<string, number>  = {};
    const ids = items.map(i => i.id);
    const myLikes = myId ? await fetchMyLikes(myId, ids) : new Set<string>();
    items.forEach(item => {
      likedMap[item.id] = myLikes.has(item.id);
      countMap[item.id] = item.like_count;
    });
    setRealItems(items);
    setLiked(likedMap);
    setLikeCounts(countMap);
    setLoading(false);
    setRefreshing(false);
  }, [eventId, myId]);

  useEffect(() => {
    if (eventId) {
      load();
      fetchEvent(eventId).then(ev => { if (ev) setEventStatus(ev.status ?? null); }).catch(() => {});
    } else {
      setLoading(false);
    }
  }, [load, eventId]);

  const posts = realItems;

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    safe: { flex: 1 },

    header: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: T.border,
    },
    back:     { padding: 4 },
    backIcon: { color: T.text, fontSize: 32, lineHeight: 32, fontWeight: '300' },
    title:    { color: T.text, fontSize: 19, fontWeight: '700', letterSpacing: -0.4 },
    sub:      { color: T.textMute, fontSize: 12, marginTop: 2 },

    ratingBadge: {
      backgroundColor: 'rgba(232,227,216,0.10)', borderRadius: 10,
      paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: 'rgba(232,227,216,0.18)',
    },
    ratingText: { color: T.accent, fontSize: 13, fontWeight: '700' },

    hostRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: T.border,
    },
    hostAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)' },
    hostLabel:  { color: T.textMute, fontSize: 10, marginBottom: 1 },
    hostName:   { color: T.text, fontSize: 14, fontWeight: '600' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
    gridItem: { width: THUMB, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)' },
    thumb: { width: '100%', height: '100%' },
    thumbOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.22)',
      justifyContent: 'space-between',
      padding: 9,
    },
    posterRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
    posterAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)' },
    posterName:   { color: '#fff', fontSize: 11, fontWeight: '600', flex: 1 },
    likeRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
    likeIcon:     { color: '#fff', fontSize: 18 },
    likeActive:   { color: '#FF5A5A' },
    likeCount:    { color: '#fff', fontSize: 12, fontWeight: '600' },

    addBtn: {
      position: 'absolute', bottom: 28, alignSelf: 'center',
      backgroundColor: T.accent,
      paddingHorizontal: 28, paddingVertical: 14,
      borderRadius: 999,
      ...Platform.select({
        ios:     { shadowColor: T.accent, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 28 },
        android: { elevation: 12 },
      }),
    },
    addBtnText: { color: T.onAccent, fontSize: 15, fontWeight: '700' },
  });

  const m = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
    close: {
      position: 'absolute', top: 56, right: 20, zIndex: 10,
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center', justifyContent: 'center',
    },
    closeIcon: { color: T.text, fontSize: 16, fontWeight: '700' },
    fullImg: { width: '100%', height: '60%' },
    info: {
      backgroundColor: 'rgba(20,20,21,0.94)',
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,0.10)',
      padding: 22, gap: 12, position: 'absolute', bottom: 0, left: 0, right: 0,
    },
    infoHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoAvatar:  { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
    infoName:    { color: T.text, fontSize: 15, fontWeight: '700' },
    infoEvent:   { color: T.textSub, fontSize: 12 },
    likeBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: T.surface, borderRadius: 12,
      paddingHorizontal: 12, paddingVertical: 7,
      borderWidth: 1, borderColor: T.border,
    },
    likeBtnActive: { backgroundColor: 'rgba(232,227,216,0.92)', borderColor: 'transparent' },
    likeBtnIcon:   { color: T.text, fontSize: 16 },
    likeBtnCount:  { color: T.text, fontSize: 14, fontWeight: '600' },
    caption:    { color: T.textSub, fontSize: 14, lineHeight: 20 },
    hostRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
    hostAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
    hostText:   { color: T.textMute, fontSize: 12 },
  });

  function toggleLike(id: string) {
    const wasLiked = liked[id];
    setLiked(prev => ({ ...prev, [id]: !wasLiked }));
    setLikeCounts(counts => ({ ...counts, [id]: (counts[id] ?? 0) + (wasLiked ? -1 : 1) }));
    if (myId && eventId) {
      import('../../../services/galleryService').then(({ toggleGalleryLike }) => {
        toggleGalleryLike(id, myId, wasLiked);
      });
    }
  }

  async function pickAndUpload() {
    if (!myId || !eventId) { Alert.alert('Sign in to add photos'); return; }
    if (eventStatus !== 'closed') {
      Alert.alert('Event not closed yet', 'Photos can only be added after the event ends.');
      return;
    }
    const attended = await hasAttendedEvent(myId, eventId);
    if (!attended) {
      Alert.alert('Attendance required', 'Only guests who attended this event can add photos.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to upload to the gallery.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
      exif: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const imgErr = validatePickedImage(result.assets[0]);
    if (imgErr) { Alert.alert('Image not allowed', imgErr); return; }
    setCaptionModal({ uri: result.assets[0].uri });
  }

  async function confirmUpload() {
    if (!captionModal || !myId || !eventId) return;
    setCaptionModal(null);
    setUploading(true);
    const item = await uploadGalleryPhoto(eventId, myId, captionModal.uri, caption);
    setCaption('');
    if (item) {
      setRealItems(prev => [item, ...prev]);
      setLiked(prev => ({ ...prev, [item.id]: false }));
      setLikeCounts(prev => ({ ...prev, [item.id]: 0 }));
    } else {
      Alert.alert('Upload failed', 'Try again in a moment.');
    }
    setUploading(false);
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back} activeOpacity={0.7}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{eventId ? 'Event Gallery' : 'Gallery'}</Text>
            <Text style={s.sub}>{posts.length} photos</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.grid}>
          {posts.map((post, idx) => {
            const isLeft  = idx % 2 === 0;
            const h       = isLeft ? THUMB : THUMB * 1.28;
            const imgUri  = post.image_url;
            const pName   = post.profiles?.display_name ?? 'Guest';
            const pAvatar = post.profiles?.avatar_url ?? undefined;
            return (
              <TouchableOpacity
                key={post.id}
                activeOpacity={0.88}
                onPress={() => setSelected(post as any)}
                style={[s.gridItem, { height: h }]}
              >
                {imgUri ? <Image source={{ uri: imgUri }} style={s.thumb} resizeMode="cover" /> : <View style={[s.thumb, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />}
                <View style={s.thumbOverlay}>
                  <View style={s.posterRow}>
                    {pAvatar
                      ? <Image source={{ uri: pAvatar }} style={s.posterAvatar} />
                      : <View style={[s.posterAvatar, { backgroundColor: 'rgba(232,227,216,0.15)', alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ color: '#E8E3D8', fontSize: 8, fontWeight: '700' }}>{pName[0]?.toUpperCase()}</Text>
                        </View>}
                    <Text style={s.posterName} numberOfLines={1}>{pName.split(' ')[0]}</Text>
                  </View>
                  <View style={s.likeRow}>
                    <TouchableOpacity onPress={() => toggleLike(post.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={[s.likeIcon, liked[post.id] && s.likeActive]}>
                        {liked[post.id] ? '❤️' : '♡'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={s.likeCount}>{likeCounts[post.id] ?? 0}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100, width: '100%' }} />
        </ScrollView>

        {eventStatus === 'closed' && (
          <TouchableOpacity
            style={[s.addBtn, uploading && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={pickAndUpload}
            disabled={uploading}
          >
            {uploading
              ? <ActivityIndicator size="small" color={T.onAccent} />
              : <Text style={s.addBtnText}>+ Add to gallery</Text>}
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <Modal visible={!!selected} transparent animationType="fade">
        {selected && (() => {
          const imgUri       = selected.image_url;
          const posterName   = selected.profiles?.display_name ?? 'Guest';
          const posterAvatar = selected.profiles?.avatar_url ?? undefined;
          return (
            <View style={m.root}>
              <TouchableOpacity style={m.close} onPress={() => setSelected(null)}>
                <Text style={m.closeIcon}>✕</Text>
              </TouchableOpacity>

              {imgUri ? <Image source={{ uri: imgUri }} style={m.fullImg} resizeMode="contain" /> : <View style={m.fullImg} />}

              <View style={m.info}>
                <View style={m.infoHeader}>
                  {posterAvatar
                    ? <Image source={{ uri: posterAvatar }} style={m.infoAvatar} />
                    : <View style={[m.infoAvatar, { backgroundColor: 'rgba(232,227,216,0.12)', alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ color: T.accent, fontWeight: '700', fontSize: 12 }}>{posterName[0]?.toUpperCase()}</Text>
                      </View>}
                  <View style={{ flex: 1 }}>
                    <Text style={m.infoName}>{posterName}</Text>
                  </View>
                  <TouchableOpacity
                    style={[m.likeBtn, liked[selected.id] && m.likeBtnActive]}
                    onPress={() => toggleLike(selected.id)}
                  >
                    <Text style={[m.likeBtnIcon, liked[selected.id] && { color: '#000' }]}>
                      {liked[selected.id] ? '❤️' : '♡'}
                    </Text>
                    <Text style={[m.likeBtnCount, liked[selected.id] && { color: '#000' }]}>
                      {likeCounts[selected.id] ?? 0}
                    </Text>
                  </TouchableOpacity>
                </View>
                {selected.caption ? <Text style={m.caption}>{selected.caption}</Text> : null}
              </View>
            </View>
          );
        })()}
      </Modal>

      {/* Caption modal */}
      <Modal visible={!!captionModal} transparent animationType="slide" onRequestClose={() => setCaptionModal(null)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setCaptionModal(null)}
        >
          <View style={{
            backgroundColor: isDark ? '#1A1A1B' : '#F6F4EF',
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 24, gap: 16,
          }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'center' }} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: T.text }}>Add a caption</Text>
            <TextInput
              style={{
                backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border,
                padding: 14, color: T.text, fontSize: 15, minHeight: 72, textAlignVertical: 'top',
              }}
              value={caption}
              onChangeText={setCaption}
              placeholder="What's the vibe? (optional)"
              placeholderTextColor={T.textMute}
              multiline
              maxLength={200}
              autoFocus
            />
            <TouchableOpacity
              style={{ backgroundColor: T.accent, borderRadius: 20, height: 52, alignItems: 'center', justifyContent: 'center' }}
              onPress={confirmUpload}
              activeOpacity={0.88}
            >
              <Text style={{ color: '#090909', fontSize: 15, fontWeight: '700' }}>Upload photo</Text>
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
