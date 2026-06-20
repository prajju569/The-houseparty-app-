import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const VIBES = ['🔥 Hot', '🎵 Music', '🍕 Food', '🎨 Art', '🕺 Dance', '🎮 Gaming', '🌿 Chill', '🥂 Rooftop'];

type Props = { navigation: any };

export default function CreateStep1Screen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [desc,  setDesc]  = useState('');
  const [vibes, setVibes] = useState<string[]>([]);

  function toggleVibe(v: string) {
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  function next() {
    if (!title.trim()) return;
    navigation.navigate('CreateStep2', { title: title.trim(), description: desc.trim(), vibe: vibes });
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="x" size={22} color="rgba(244,242,236,0.6)" />
          </TouchableOpacity>

          <View style={s.steps}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={[s.step, i === 1 ? s.stepActive : s.stepDot]} />
            ))}
          </View>

          <Text style={s.title}>What's the party?</Text>
          <Text style={s.sub}>Give it a name people will remember.</Text>

          <Text style={s.label}>Event name</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Sunset Rooftop Rave"
            placeholderTextColor="rgba(244,242,236,0.3)"
            autoFocus
            maxLength={60}
          />

          <Text style={s.label}>Description (optional)</Text>
          <TextInput
            style={[s.input, s.multiline]}
            value={desc}
            onChangeText={setDesc}
            placeholder="What's the vibe? Who's invited? What to bring?"
            placeholderTextColor="rgba(244,242,236,0.3)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
          />

          <Text style={s.label}>Vibe tags</Text>
          <View style={s.vibeGrid}>
            {VIBES.map(v => (
              <TouchableOpacity
                key={v}
                style={[s.vibeChip, vibes.includes(v) && s.vibeChipActive]}
                onPress={() => toggleVibe(v)}
                activeOpacity={0.8}
              >
                <Text style={[s.vibeText, vibes.includes(v) && s.vibeTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.cta, !title.trim() && s.ctaDim]}
            onPress={next}
            activeOpacity={0.88}
            disabled={!title.trim()}
          >
            <Text style={s.ctaText}>Next</Text>
            <Feather name="arrow-right" size={18} color="#090909" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
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
  sub:   { fontSize: 14, color: 'rgba(244,242,236,0.48)', marginBottom: 32 },

  label: { fontSize: 12, fontWeight: '600', color: 'rgba(232,227,216,0.55)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  input: {
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18, paddingVertical: 14, color: '#F4F2EC', fontSize: 15, marginBottom: 24,
  },
  multiline: { height: 100, paddingTop: 14 },

  vibeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 36 },
  vibeChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  vibeChipActive: { backgroundColor: 'rgba(232,227,216,0.14)', borderColor: 'rgba(232,227,216,0.50)' },
  vibeText:       { color: 'rgba(244,242,236,0.55)', fontSize: 13 },
  vibeTextActive: { color: '#F4F2EC', fontWeight: '600' },

  cta:    { height: 56, borderRadius: 28, backgroundColor: '#E8E3D8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 }, android: { elevation: 10 } }) },
  ctaDim: { opacity: 0.4 },
  ctaText:{ color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
