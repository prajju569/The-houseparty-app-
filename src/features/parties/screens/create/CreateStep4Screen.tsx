import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Image, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const MAX_PHOTOS = 5;

type Props = { route: any; navigation: any };

export default function CreateStep4Screen({ route, navigation }: Props) {
  const prev = route.params;
  // photoUris[0] = cover, [1..4] = additional gallery photos
  const [photoUris, setPhotoUris] = useState<(string | null)[]>([null, null, null, null, null]);
  const [picking,   setPicking]   = useState<number | null>(null);

  async function pickForSlot(index: number) {
    setPicking(index);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: index === 0 ? [16, 9] : [1, 1],
      quality: 0.85,
    });
    setPicking(null);
    if (!result.canceled && result.assets[0]) {
      setPhotoUris(prev => {
        const next = [...prev];
        next[index] = result.assets[0].uri;
        return next;
      });
    }
  }

  function removePhoto(index: number) {
    setPhotoUris(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  function next() {
    navigation.navigate('CreateStep5', {
      ...prev,
      coverLocalUri: photoUris[0],
      extraPhotoUris: photoUris.slice(1).filter(Boolean) as string[],
    });
  }

  const coverUri   = photoUris[0];
  const hasCover   = !!coverUri;
  const filledCount = photoUris.filter(Boolean).length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color="rgba(244,242,236,0.6)" />
          </TouchableOpacity>

          <View style={s.steps}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={[s.step, i <= 4 ? s.stepActive : s.stepDot]} />
            ))}
          </View>

          <Text style={s.title}>Add photos</Text>
          <Text style={s.sub}>Cover photo + up to 4 more. First photo is the cover shown on the card.</Text>

          {/* Cover photo — large 16:9 */}
          <Text style={s.slotLabel}>Cover photo</Text>
          <TouchableOpacity
            style={s.coverBox}
            onPress={() => pickForSlot(0)}
            activeOpacity={0.8}
          >
            {picking === 0 ? (
              <ActivityIndicator color="#E8E3D8" />
            ) : coverUri ? (
              <Image source={{ uri: coverUri }} style={s.coverPreview} resizeMode="cover" />
            ) : (
              <>
                <View style={s.iconCircle}>
                  <Feather name="image" size={28} color="rgba(232,227,216,0.6)" />
                </View>
                <Text style={s.pickText}>Tap to choose cover</Text>
                <Text style={s.pickSub}>16:9 ratio · shown on the event card</Text>
              </>
            )}
            {coverUri && (
              <TouchableOpacity
                style={s.removeBtn}
                onPress={() => removePhoto(0)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={14} color="#090909" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Additional photos — 4 small squares */}
          <Text style={[s.slotLabel, { marginTop: 24 }]}>
            Gallery photos <Text style={s.slotSub}>(optional · up to 4 more)</Text>
          </Text>
          <View style={s.grid}>
            {[1, 2, 3, 4].map(i => {
              const uri = photoUris[i];
              return (
                <TouchableOpacity
                  key={i}
                  style={s.gridSlot}
                  onPress={() => pickForSlot(i)}
                  activeOpacity={0.8}
                >
                  {picking === i ? (
                    <ActivityIndicator color="#E8E3D8" size="small" />
                  ) : uri ? (
                    <>
                      <Image source={{ uri }} style={s.gridPreview} resizeMode="cover" />
                      <TouchableOpacity
                        style={s.removeBtn}
                        onPress={() => removePhoto(i)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="x" size={12} color="#090909" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Feather name="plus" size={22} color="rgba(232,227,216,0.4)" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {filledCount > 0 && (
            <Text style={s.countNote}>{filledCount}/{MAX_PHOTOS} photo{filledCount !== 1 ? 's' : ''} selected</Text>
          )}

          <View style={{ height: 32 }} />

          <View style={s.btns}>
            <TouchableOpacity style={s.skipBtn} onPress={next} activeOpacity={0.7}>
              <Text style={s.skipText}>Skip for now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.cta, !hasCover && s.ctaDim]}
              onPress={next}
              activeOpacity={0.88}
            >
              <Text style={s.ctaText}>Next</Text>
              <Feather name="arrow-right" size={18} color="#090909" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>

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
  stepActive: { flex: 2, backgroundColor: '#E8E3D8' },
  stepDot:    { flex: 1, backgroundColor: 'rgba(232,227,216,0.20)' },

  title: { fontSize: 28, fontWeight: '700', color: '#F4F2EC', letterSpacing: -0.9, marginBottom: 8 },
  sub:   { fontSize: 14, color: 'rgba(244,242,236,0.48)', marginBottom: 24 },

  slotLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(232,227,216,0.55)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  slotSub:   { fontSize: 11, fontWeight: '400', textTransform: 'none', color: 'rgba(232,227,216,0.35)', letterSpacing: 0 },

  coverBox: {
    height: 200, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  coverPreview: { width: '100%', height: '100%' },
  iconCircle:   { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pickText:     { color: 'rgba(244,242,236,0.70)', fontSize: 15, fontWeight: '500', marginBottom: 4 },
  pickSub:      { color: 'rgba(244,242,236,0.35)', fontSize: 12 },

  removeBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(232,227,216,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },

  grid:     { flexDirection: 'row', gap: 10 },
  gridSlot: {
    flex: 1, aspectRatio: 1, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  gridPreview: { width: '100%', height: '100%' },

  countNote: { color: 'rgba(244,242,236,0.38)', fontSize: 12, textAlign: 'center', marginTop: 14 },

  btns:    { flexDirection: 'row', gap: 12, alignItems: 'center' },
  skipBtn: { height: 56, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  skipText:{ color: 'rgba(244,242,236,0.40)', fontSize: 14 },
  cta:     { flex: 1, height: 56, borderRadius: 28, backgroundColor: '#E8E3D8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 }, android: { elevation: 10 } }) },
  ctaDim:  { opacity: 0.5 },
  ctaText: { color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
