import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Image, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../features/auth/authStore';
import { useTheme } from '../../../theme/ThemeContext';
import { updateProfile, uploadAvatar } from '../../../services/profileService';
import { ALL_GENRES, ALL_VIBES } from '../../../services/vibeService';

const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
const GENDER_LABELS: Record<string, string> = {
  male: 'Male', female: 'Female', other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

export default function EditProfileScreen({ navigation }: any) {
  const { T, isDark } = useTheme();
  const { profile, setProfile, session } = useAuthStore();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [username,    setUsername]    = useState(profile?.username    ?? '');
  const [phone,       setPhone]       = useState(profile?.phone       ?? '');
  const [bio,         setBio]         = useState(profile?.bio         ?? '');
  const [gender,      setGender]      = useState<string>(profile?.gender ?? '');
  const [dob,         setDob]         = useState(profile?.date_of_birth ?? '');
  const [avatarUri,   setAvatarUri]   = useState(profile?.avatar_url ?? '');
  const [localAvatar, setLocalAvatar] = useState<string | null>(null); // picked but not yet uploaded
  const [saving, setSaving]           = useState(false);
  const [genderModal, setGenderModal] = useState(false);

  // Music & vibe
  const [selectedGenres,  setSelectedGenres]  = useState<string[]>(profile?.top_genres  ?? []);
  const [selectedVibes,   setSelectedVibes]   = useState<string[]>(profile?.vibe_tags   ?? []);
  const [topArtists,      setTopArtists]      = useState(profile?.top_artists?.join(', ') ?? '');
  const [playlistUrl,     setPlaylistUrl]     = useState(profile?.fav_playlist_url ?? '');

  function toggleChip<T extends string>(list: T[], item: T, setList: (v: T[]) => void) {
    if (list.includes(item)) setList(list.filter(x => x !== item));
    else if (list.length < 5) setList([...list, item]);
  }

  const s = makeStyles(T);

  async function pickAvatar() {
    // First try camera roll; fall back to camera if denied
    const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (libPerm.status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Houseparty needs access to your photos to set a profile picture.\n\nGo to Settings → Apps → Houseparty → Permissions → Photos.',
        [{ text: 'OK' }]
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,   // triggers native crop UI on iOS & Android
      aspect: [1, 1],        // square crop
      quality: 0.9,
      // Android: base64 not needed; exifData slows things down
      exif: false,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalAvatar(result.assets[0].uri);
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (camPerm.status !== 'granted') {
      Alert.alert('Camera permission required', 'Allow camera access to take a profile photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      exif: false,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalAvatar(result.assets[0].uri);
      setAvatarUri(result.assets[0].uri);
    }
  }

  function showAvatarOptions() {
    Alert.alert('Change photo', 'Choose a source', [
      { text: 'Camera roll', onPress: pickAvatar },
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleSave() {
    if (!displayName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    const userId = session?.user?.id;
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in again to update your profile.');
      return;
    }
    setSaving(true);
    try {
      let finalAvatarUrl: string | null = profile?.avatar_url ?? localAvatar ?? null;

      if (localAvatar) {
        const uploaded = await uploadAvatar(userId, localAvatar);
        if (uploaded) finalAvatarUrl = uploaded;
      }

      const artistsArr = topArtists.split(',').map(s => s.trim()).filter(Boolean);
      const updates: Parameters<typeof updateProfile>[1] = {
        display_name:       displayName.trim(),
        username:           username.trim().replace(/^@/, ''),
        phone:              phone.trim() || null,
        bio:                bio.trim() || null,
        gender:             (gender as any) || null,
        date_of_birth:      dob || null,
        avatar_url:         finalAvatarUrl,
        top_genres:         selectedGenres.length > 0 ? selectedGenres : null,
        vibe_tags:          selectedVibes.length > 0 ? selectedVibes : null,
        top_artists:        artistsArr.length > 0 ? artistsArr : null,
        fav_playlist_url:   playlistUrl.trim() || null,
      };

      const { error } = await updateProfile(userId, updates);
      if (error) throw new Error(error);
      setProfile(profile ? { ...profile, ...updates } : null);

      Alert.alert('Saved ✓', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const previewAvatar = localAvatar ?? avatarUri;
  const usernameDisplay = username.startsWith('@') ? username : `@${username}`;

  return (
    <View style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={T.bg}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={[s.header, { borderBottomColor: T.border }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[s.backBtn, { color: T.gold }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: T.text }]}>Edit Profile</Text>
            <View style={{ width: 56 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
          >
            {/* Avatar picker */}
            <View style={s.avatarSection}>
              <TouchableOpacity onPress={showAvatarOptions} activeOpacity={0.8} style={s.avatarWrap}>
                <Image
                  source={{ uri: previewAvatar }}
                  style={[s.avatar, { borderColor: T.gold, backgroundColor: T.elevated }]}
                />
                <View style={[s.cameraBadge, { backgroundColor: T.gold, borderColor: T.bg }]}>
                  <Text style={{ fontSize: 14 }}>📷</Text>
                </View>
              </TouchableOpacity>
              <Text style={[s.displayName, { color: T.text }]}>{displayName || 'Your Name'}</Text>
              <Text style={[s.usernamePreview, { color: T.textMute }]}>{usernameDisplay}</Text>
            </View>

            <View style={[s.divider, { backgroundColor: T.border }]} />

            {/* Form fields */}
            <View style={s.form}>

              {/* Full name */}
              <Field label="Full name" T={T}>
                <TextInput
                  style={[s.input, { color: T.text }]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your full name"
                  placeholderTextColor={T.textMute}
                  returnKeyType="next"
                  autoCapitalize="words"
                />
              </Field>

              {/* Username */}
              <Field label="Username" T={T}>
                <View style={s.usernameRow}>
                  <Text style={[s.atSign, { color: T.textMute }]}>@</Text>
                  <TextInput
                    style={[s.input, { flex: 1, color: T.text }]}
                    value={username.replace(/^@/, '')}
                    onChangeText={v => setUsername(v.replace(/\s/g, '').toLowerCase())}
                    placeholder="yourhandle"
                    placeholderTextColor={T.textMute}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </Field>

              {/* Gender + DOB row */}
              <View style={s.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { color: T.textMute }]}>Gender</Text>
                  <TouchableOpacity
                    style={[s.fieldCard, { backgroundColor: T.card, borderColor: T.border }]}
                    onPress={() => setGenderModal(true)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.input, { color: gender ? T.text : T.textMute }]}>
                      {gender ? GENDER_LABELS[gender] : 'Select'}
                    </Text>
                    <Text style={{ color: T.textMute, fontSize: 12 }}>▾</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { color: T.textMute }]}>Date of birth</Text>
                  <View style={[s.fieldCard, { backgroundColor: T.card, borderColor: T.border }]}>
                    <TextInput
                      style={[s.input, { flex: 1, color: T.text }]}
                      value={dob}
                      onChangeText={setDob}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={T.textMute}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                      returnKeyType="next"
                    />
                  </View>
                </View>
              </View>

              {/* Phone */}
              <Field label="Phone number" T={T}>
                <TextInput
                  style={[s.input, { color: T.text }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 9876543210"
                  placeholderTextColor={T.textMute}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
              </Field>

              {/* Bio */}
              <Field label="Bio" T={T}>
                <TextInput
                  style={[s.input, s.bioInput, { color: T.text }]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell people a bit about yourself..."
                  placeholderTextColor={T.textMute}
                  multiline
                  maxLength={160}
                />
                <Text style={[s.charCount, { color: T.textMute }]}>{bio.length}/160</Text>
              </Field>

            </View>

            {/* ── Music & Vibe section ── */}
            <View style={s.musicSection}>
              <Text style={[s.musicSectionTitle, { color: T.text }]}>🎵 Music & Vibe</Text>
              <Text style={[s.musicSectionSub, { color: T.textMute }]}>Pick up to 5 — powers your vibe match score</Text>

              {/* Genre chips */}
              <Text style={[s.chipGroupLabel, { color: T.textMute }]}>GENRES</Text>
              <View style={s.chipWrap}>
                {ALL_GENRES.map(g => {
                  const on = selectedGenres.includes(g);
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[s.chip, { backgroundColor: on ? T.accent : T.card, borderColor: on ? T.accent : T.border }]}
                      onPress={() => toggleChip(selectedGenres, g, setSelectedGenres)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.chipText, { color: on ? '#090909' : T.textMute }]}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Vibe chips */}
              <Text style={[s.chipGroupLabel, { color: T.textMute }]}>YOUR VIBE</Text>
              <View style={s.chipWrap}>
                {ALL_VIBES.map(v => {
                  const on = selectedVibes.includes(v);
                  return (
                    <TouchableOpacity
                      key={v}
                      style={[s.chip, { backgroundColor: on ? T.accent : T.card, borderColor: on ? T.accent : T.border }]}
                      onPress={() => toggleChip(selectedVibes, v, setSelectedVibes)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.chipText, { color: on ? '#090909' : T.textMute }]}>{v}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Top artists */}
              <Text style={[s.chipGroupLabel, { color: T.textMute }]}>TOP ARTISTS (comma-separated)</Text>
              <View style={[s.fieldCard, { backgroundColor: T.card, borderColor: T.border }]}>
                <TextInput
                  style={[s.input, { color: T.text }]}
                  value={topArtists}
                  onChangeText={setTopArtists}
                  placeholder="e.g. Drake, Dua Lipa, Nucleya"
                  placeholderTextColor={T.textMute}
                  returnKeyType="next"
                />
              </View>

              {/* Playlist URL */}
              <Text style={[s.chipGroupLabel, { color: T.textMute }]}>FAVOURITE PLAYLIST (optional URL)</Text>
              <View style={[s.fieldCard, { backgroundColor: T.card, borderColor: T.border }]}>
                <TextInput
                  style={[s.input, { color: T.text }]}
                  value={playlistUrl}
                  onChangeText={setPlaylistUrl}
                  placeholder="Spotify / YouTube / Apple Music link"
                  placeholderTextColor={T.textMute}
                  autoCapitalize="none"
                  keyboardType="url"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: T.text }, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={T.bg} />
              ) : (
                <Text style={[s.saveBtnText, { color: T.bg }]}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Gender picker modal */}
      <Modal
        visible={genderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setGenderModal(false)}
      >
        <TouchableOpacity
          style={s.modalBackdrop}
          activeOpacity={1}
          onPress={() => setGenderModal(false)}
        >
          <View style={[s.modalSheet, { backgroundColor: T.card, borderColor: T.border }]}>
            <View style={[s.modalHandle, { backgroundColor: T.border }]} />
            <Text style={[s.modalTitle, { color: T.text }]}>Select Gender</Text>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g}
                style={[
                  s.modalItem,
                  { borderBottomColor: T.separator },
                  gender === g && { backgroundColor: T.goldDim },
                ]}
                onPress={() => { setGender(g); setGenderModal(false); }}
              >
                <Text style={[s.modalItemText, { color: T.text }, gender === g && { color: T.gold, fontWeight: '700' }]}>
                  {GENDER_LABELS[g]}
                </Text>
                {gender === g && <Text style={{ color: T.gold }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── Small wrapper so every field has consistent label + card ─────────────────
function Field({ label, T, children }: { label: string; T: any; children: React.ReactNode }) {
  const s = makeStyles(T);
  return (
    <View>
      <Text style={[s.fieldLabel, { color: T.textMute }]}>{label}</Text>
      <View style={[s.fieldCard, { backgroundColor: T.card, borderColor: T.border }]}>
        {children}
      </View>
    </View>
  );
}

function makeStyles(T: any) {
  return StyleSheet.create({
    root: { flex: 1 },

    // Header
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn:    { fontSize: 14, fontWeight: '700', width: 56 },
    headerTitle:{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },

    scroll: { paddingBottom: 20 },

    // Avatar section
    avatarSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 20 },
    avatarWrap:    { position: 'relative', marginBottom: 14 },
    avatar: {
      width: 96, height: 96, borderRadius: 48,
      borderWidth: 2.5,
    },
    cameraBadge: {
      position: 'absolute', bottom: 0, right: 0,
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2,
    },
    displayName:    { fontSize: 20, fontWeight: '800', marginBottom: 4 },
    usernamePreview:{ fontSize: 13 },

    divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 20, marginBottom: 24 },

    // Form
    form: { paddingHorizontal: 20, gap: 14 },

    fieldLabel: {
      fontSize: 12, fontWeight: '600', letterSpacing: 0.4,
      marginBottom: 6, paddingHorizontal: 4,
    },
    fieldCard: {
      borderRadius: 14, borderWidth: 1,
      paddingHorizontal: 16, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center',
    },
    input: { fontSize: 16, flex: 1 },
    bioInput: { minHeight: 72, textAlignVertical: 'top' },
    charCount: { fontSize: 11, alignSelf: 'flex-end', marginTop: 4 },

    usernameRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    atSign: { fontSize: 16, marginRight: 2 },

    rowTwo: { flexDirection: 'row', gap: 12 },

    // Music & Vibe
    musicSection:      { paddingHorizontal: 20, marginTop: 24, gap: 0 },
    musicSectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },
    musicSectionSub:   { fontSize: 12, marginBottom: 16 },
    chipGroupLabel:    { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginTop: 14, marginBottom: 8 },
    chipWrap:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
      borderWidth: 1,
    },
    chipText: { fontSize: 13, fontWeight: '500' },

    // Save
    saveBtn: {
      marginHorizontal: 20, marginTop: 28,
      borderRadius: 16, paddingVertical: 16,
      alignItems: 'center',
    },
    saveBtnText: { fontSize: 16, fontWeight: '800' },

    // Modal
    modalBackdrop: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderWidth: 1, paddingBottom: 34,
    },
    modalHandle: {
      width: 36, height: 4, borderRadius: 2,
      alignSelf: 'center', marginTop: 12, marginBottom: 16,
    },
    modalTitle: {
      fontSize: 16, fontWeight: '700',
      paddingHorizontal: 24, marginBottom: 8,
    },
    modalItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 24, paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    modalItemText: { fontSize: 16 },
  });
}
