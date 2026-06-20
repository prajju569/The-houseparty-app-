import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, TextInput, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  fetchPlaylistMeta, importSpotifyPlaylist, detectPlatform, savePlaylist, updateTrackList,
  type PlaylistTrack,
} from '../../../services/playlistService';

type Props = { route: any; navigation: any };

export default function EditPlaylistScreen({ route, navigation }: Props) {
  const { eventId, playlistUrl: initialUrl = '', tracks: initialTracks = [] } = route.params ?? {};
  const [url, setUrl]     = useState<string>(initialUrl ?? '');
  const [tracks, setTracks] = useState<PlaylistTrack[]>(initialTracks ?? []);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addArtist, setAddArtist] = useState('');
  const [showAdd, setShowAdd]   = useState(false);

  async function onUrlBlur() {
    if (!url.trim() || url === initialUrl) return;
    setFetching(true);

    // Spotify: auto-import the full track list via the edge function.
    if (detectPlatform(url.trim()) === 'spotify') {
      const res = await importSpotifyPlaylist(url.trim());
      setFetching(false);
      if (res.ok) {
        setTracks(res.tracks);
        Alert.alert(`✅ ${res.meta.title}`, `Imported ${res.tracks.length} track${res.tracks.length === 1 ? '' : 's'} from Spotify.`);
      } else {
        Alert.alert('Spotify import failed', `${res.error}\n\nYou can still add tracks manually below.`);
      }
      return;
    }

    // YouTube / other: oEmbed gives title + thumbnail only (no track list).
    const meta = await fetchPlaylistMeta(url.trim());
    setFetching(false);
    if (meta) {
      Alert.alert(`📋 ${meta.title}`, `Platform: ${meta.platform}\n\nTrack auto-import is only available for Spotify. Add ${meta.platform} tracks manually below.`);
    } else {
      Alert.alert('Could not fetch playlist', 'Check the link and try again.');
    }
  }

  function addTrack() {
    if (!addTitle.trim()) return;
    setTracks(prev => [...prev, { title: addTitle.trim(), artist: addArtist.trim() || 'Unknown artist', duration_s: null, thumbnail_url: null }]);
    setAddTitle('');
    setAddArtist('');
    setShowAdd(false);
  }

  function removeTrack(index: number) {
    setTracks(prev => prev.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    const err = url.trim()
      ? (await savePlaylist(eventId, url.trim(), tracks)).error
      : (await updateTrackList(eventId, tracks)).error;
    setSaving(false);
    if (err) { Alert.alert('Save failed', err); return; }
    Alert.alert('Saved! 🎵', 'Playlist updated.');
    navigation.goBack();
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color="rgba(244,242,236,0.6)" />
          </TouchableOpacity>

          <Text style={s.title}>Edit playlist</Text>
          <Text style={s.sub}>Paste a Spotify or YouTube link, then curate the track list.</Text>

          <Text style={s.label}>Playlist link (optional)</Text>
          <View style={s.urlWrap}>
            <Feather name="link" size={15} color="rgba(232,227,216,0.45)" style={{ marginLeft: 14 }} />
            <TextInput
              style={s.urlInput}
              value={url}
              onChangeText={setUrl}
              onBlur={onUrlBlur}
              placeholder="Spotify or YouTube playlist URL…"
              placeholderTextColor="rgba(244,242,236,0.3)"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {fetching && <ActivityIndicator size="small" color="rgba(232,227,216,0.5)" style={{ marginRight: 14 }} />}
          </View>

          <View style={s.tracksHeader}>
            <Text style={s.label}>Tracks ({tracks.length})</Text>
            <TouchableOpacity onPress={() => setShowAdd(v => !v)} activeOpacity={0.75}>
              <Text style={s.addTrackLink}>{showAdd ? 'Cancel' : '+ Add track'}</Text>
            </TouchableOpacity>
          </View>

          {showAdd && (
            <View style={s.addForm}>
              <TextInput
                style={s.addInput}
                value={addTitle}
                onChangeText={setAddTitle}
                placeholder="Track title"
                placeholderTextColor="rgba(244,242,236,0.3)"
              />
              <TextInput
                style={s.addInput}
                value={addArtist}
                onChangeText={setAddArtist}
                placeholder="Artist"
                placeholderTextColor="rgba(244,242,236,0.3)"
              />
              <TouchableOpacity style={s.addFormBtn} onPress={addTrack} activeOpacity={0.85}>
                <Text style={s.addFormBtnText}>Add →</Text>
              </TouchableOpacity>
            </View>
          )}

          {tracks.map((t, i) => (
            <View key={i} style={[s.trackRow, i === 0 && s.trackRowFirst]}>
              <View style={s.trackNumBox}>
                <Text style={s.trackNum}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.trackTitle} numberOfLines={1}>{t.title}</Text>
                <Text style={s.trackArtist}>{t.artist}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeTrack(i)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color="rgba(244,242,236,0.4)" />
              </TouchableOpacity>
            </View>
          ))}

          {tracks.length === 0 && !showAdd && (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No tracks yet — tap "+ Add track" above</Text>
            </View>
          )}

          <View style={{ height: 32 }} />

          {saving ? (
            <View style={s.savingBox}>
              <ActivityIndicator color="#E8E3D8" />
              <Text style={s.savingText}>Saving…</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.cta} onPress={save} activeOpacity={0.88}>
              <Text style={s.ctaText}>Save playlist</Text>
              <Feather name="check" size={18} color="#090909" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#090909' },
  scroll:{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  back:  { marginTop: 8, marginBottom: 24, alignSelf: 'flex-start', padding: 4 },

  title: { fontSize: 28, fontWeight: '700', color: '#F4F2EC', letterSpacing: -0.9, marginBottom: 8 },
  sub:   { fontSize: 14, color: 'rgba(244,242,236,0.48)', marginBottom: 28 },
  label: { fontSize: 12, fontWeight: '600', color: 'rgba(232,227,216,0.55)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },

  urlWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 28,
  },
  urlInput: { flex: 1, height: '100%', paddingHorizontal: 12, color: '#F4F2EC', fontSize: 14 },

  tracksHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  addTrackLink: { color: '#E8E3D8', fontSize: 14, fontWeight: '600' },

  addForm: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, gap: 10, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  addInput: { height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 14, color: '#F4F2EC', fontSize: 14 },
  addFormBtn: { backgroundColor: 'rgba(232,227,216,0.15)', borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,227,216,0.30)' },
  addFormBtnText: { color: '#E8E3D8', fontWeight: '700', fontSize: 14 },

  trackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  trackRowFirst: { borderLeftWidth: 3, borderLeftColor: '#E8E3D8', paddingLeft: 10 },
  trackNumBox:   { width: 28, alignItems: 'center' },
  trackNum:      { color: 'rgba(232,227,216,0.35)', fontSize: 13 },
  trackTitle:    { color: '#F4F2EC', fontSize: 14, fontWeight: '600' },
  trackArtist:   { color: 'rgba(244,242,236,0.45)', fontSize: 12, marginTop: 2 },

  emptyState: { paddingVertical: 28, alignItems: 'center' },
  emptyText:  { color: 'rgba(244,242,236,0.3)', fontSize: 13 },

  savingBox:  { alignItems: 'center', gap: 12, paddingVertical: 24 },
  savingText: { color: 'rgba(244,242,236,0.5)', fontSize: 14 },

  cta:    { height: 56, borderRadius: 28, backgroundColor: '#E8E3D8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 }, android: { elevation: 10 } }) },
  ctaText:{ color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
