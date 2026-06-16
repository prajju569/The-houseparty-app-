import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, StatusBar, Dimensions, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GALLERY_POSTS, EVENTS, GalleryPost } from '../../../data/fakeData';

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.15)',
  green: '#00D37F', text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
};

const W = Dimensions.get('window').width;
const THUMB = (W - 44 - 8) / 2;

export default function GalleryScreen({ route, navigation }: any) {
  const eventId = route?.params?.eventId;
  const posts = eventId ? GALLERY_POSTS.filter(p => p.eventId === eventId) : GALLERY_POSTS;
  const [liked, setLiked] = useState<Record<string, boolean>>(
    Object.fromEntries(GALLERY_POSTS.map(p => [p.id, p.isLiked]))
  );
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    Object.fromEntries(GALLERY_POSTS.map(p => [p.id, p.likes]))
  );
  const [selected, setSelected] = useState<GalleryPost | null>(null);
  const event = eventId ? EVENTS.find(e => e.id === eventId) : null;

  function toggleLike(id: string) {
    setLiked(prev => {
      const next = !prev[id];
      setLikeCounts(counts => ({ ...counts, [id]: counts[id] + (next ? 1 : -1) }));
      return { ...prev, [id]: next };
    });
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{event ? event.title : 'Gallery'}</Text>
            <Text style={s.sub}>{posts.length} photos</Text>
          </View>
        </View>

        {event && (
          <View style={s.hostRow}>
            <Image source={{ uri: event.host.avatar }} style={s.hostAvatar} />
            <View>
              <Text style={s.hostLabel}>Hosted by</Text>
              <Text style={s.hostName}>{event.host.name}</Text>
            </View>
            <View style={[s.ratingBadge, { marginLeft: 'auto' }]}>
              <Text style={s.ratingText}>★ {event.host.rating}</Text>
            </View>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.grid}>
          {posts.map(post => (
            <TouchableOpacity
              key={post.id}
              activeOpacity={0.9}
              onPress={() => setSelected(post)}
              style={s.gridItem}
            >
              <Image source={{ uri: post.image }} style={s.thumb} resizeMode="cover" />
              {/* Overlay on thumb */}
              <View style={s.thumbOverlay}>
                <View style={s.posterRow}>
                  <Image source={{ uri: post.posterAvatar }} style={s.posterAvatar} />
                  <Text style={s.posterName} numberOfLines={1}>{post.posterName.split(' ')[0]}</Text>
                </View>
                <View style={s.likeRow}>
                  <TouchableOpacity onPress={() => toggleLike(post.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[s.likeIcon, liked[post.id] && s.likeActive]}>
                      {liked[post.id] ? '❤️' : '♡'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={s.likeCount}>{likeCounts[post.id]}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Fullscreen modal */}
      <Modal visible={!!selected} transparent animationType="fade">
        {selected && (
          <View style={m.root}>
            <TouchableOpacity style={m.close} onPress={() => setSelected(null)}>
              <Text style={m.closeIcon}>✕</Text>
            </TouchableOpacity>

            <Image source={{ uri: selected.image }} style={m.fullImg} resizeMode="contain" />

            <View style={m.info}>
              <View style={m.infoHeader}>
                <Image source={{ uri: selected.posterAvatar }} style={m.infoAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={m.infoName}>{selected.posterName}</Text>
                  <Text style={m.infoEvent}>@ {selected.eventTitle}</Text>
                </View>
                <TouchableOpacity
                  style={[m.likeBtn, liked[selected.id] && m.likeBtnActive]}
                  onPress={() => toggleLike(selected.id)}
                >
                  <Text style={[m.likeBtnIcon, liked[selected.id] && { color: '#000' }]}>
                    {liked[selected.id] ? '❤️' : '♡'}
                  </Text>
                  <Text style={[m.likeBtnCount, liked[selected.id] && { color: '#000' }]}>
                    {likeCounts[selected.id]}
                  </Text>
                </TouchableOpacity>
              </View>
              {selected.caption ? (
                <Text style={m.caption}>{selected.caption}</Text>
              ) : null}
              <View style={m.hostRow}>
                <Image source={{ uri: selected.hostAvatar }} style={m.hostAvatar} />
                <Text style={m.hostText}>Hosted by {selected.hostName}</Text>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  back: { padding: 4 },
  backIcon: { color: T.text, fontSize: 32, lineHeight: 32, fontWeight: '300' },
  title: { color: T.text, fontSize: 18, fontWeight: '700' },
  sub: { color: T.textMute, fontSize: 12, marginTop: 1 },

  hostRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  hostAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.elevated },
  hostLabel: { color: T.textMute, fontSize: 10 },
  hostName: { color: T.text, fontSize: 14, fontWeight: '600' },
  ratingBadge: {
    backgroundColor: T.goldDim, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  ratingText: { color: T.gold, fontSize: 13, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  gridItem: { width: THUMB, height: THUMB, borderRadius: 14, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'space-between',
    padding: 8,
  },
  posterRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  posterAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.elevated },
  posterName: { color: '#fff', fontSize: 11, fontWeight: '600', flex: 1 },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  likeIcon: { color: '#fff', fontSize: 18 },
  likeActive: { color: '#FF5A5A' },
  likeCount: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

const m = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  close: {
    position: 'absolute', top: 56, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: T.elevated, alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { color: T.text, fontSize: 16, fontWeight: '700' },
  fullImg: { width: '100%', height: '60%' },
  info: {
    backgroundColor: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 12, position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.elevated },
  infoName: { color: T.text, fontSize: 15, fontWeight: '700' },
  infoEvent: { color: T.textSub, fontSize: 12 },
  likeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.elevated, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: T.border,
  },
  likeBtnActive: { backgroundColor: T.gold, borderColor: T.gold },
  likeBtnIcon: { color: T.text, fontSize: 16 },
  likeBtnCount: { color: T.text, fontSize: 14, fontWeight: '600' },
  caption: { color: T.textSub, fontSize: 14, lineHeight: 20 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hostAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: T.elevated },
  hostText: { color: T.textMute, fontSize: 12 },
});
