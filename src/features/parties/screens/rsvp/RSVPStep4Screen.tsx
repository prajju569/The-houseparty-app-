import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, TextInput, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../theme/ThemeContext';
import StepIndicator from './StepIndicator';

const FRIENDS = [
  { id: 'f1', name: 'Aditya K.',  handle: '@aditya' },
  { id: 'f2', name: 'Priya S.',   handle: '@priyasinha' },
  { id: 'f3', name: 'Rohan M.',   handle: '@rohanm' },
  { id: 'f4', name: 'Tanvi P.',   handle: '@tanvi22' },
  { id: 'f5', name: 'Karan V.',   handle: '@kv_official' },
];

export default function RSVPStep4Screen({ route, navigation }: any) {
  const { T } = useTheme();
  const { eventId, guestCount, entryFee = 0, paymentMethod } = route.params ?? {};
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = FRIENDS.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    f.handle.includes(query.toLowerCase())
  );

  const perPerson = selected.length > 0
    ? Math.ceil((entryFee * guestCount) / (selected.length + 1))
    : entryFee * guestCount;

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function goNext() {
    navigation.navigate('RSVPStep5', { eventId, guestCount, paymentMethod });
  }

  function handleSendSplit() {
    Alert.alert(
      'Split requests sent',
      `${selected.length} friend${selected.length > 1 ? 's' : ''} will be asked to pay ₹${perPerson} each.`,
      [{ text: 'Sounds good', onPress: goNext }]
    );
  }

  const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: T.bg },
    header:  { paddingHorizontal: 22, paddingTop: 12 },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    backTxt: { color: T.text, fontSize: 18 },
    body:    { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 32 },
    title:   { color: T.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
    sub:     { color: T.textMute, fontSize: 13, marginBottom: 20 },
    search: {
      height: 48, borderRadius: 14, paddingHorizontal: 16,
      backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
      color: T.text, fontSize: 15, marginBottom: 16,
    },
    friendRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.separator,
    },
    avatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: 'rgba(232,227,216,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },
    avatarTxt: { color: T.accent, fontSize: 16, fontWeight: '700' },
    fname:     { color: T.text, fontSize: 15, fontWeight: '600' },
    fhandle:   { color: T.textMute, fontSize: 12, marginTop: 1 },
    tick: {
      marginLeft: 'auto' as any, width: 24, height: 24, borderRadius: 12,
      borderWidth: 2, borderColor: T.border,
      alignItems: 'center', justifyContent: 'center',
    },
    tickOn:  { backgroundColor: T.accent, borderColor: T.accent },
    tickTxt: { color: '#090909', fontSize: 12, fontWeight: '700' },
    splitCard: {
      backgroundColor: T.card, borderRadius: 16, padding: 14,
      marginTop: 14, borderWidth: 1, borderColor: T.border,
    },
    splitTxt:  { color: T.textSub, fontSize: 13, textAlign: 'center' },
    highlight: { color: T.accent, fontWeight: '700' },
    footer:    { paddingHorizontal: 22, paddingBottom: Platform.OS === 'android' ? 20 : 8, gap: 10 },
    skipBtn: {
      height: 50, borderRadius: 25,
      backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
      alignItems: 'center', justifyContent: 'center',
    },
    skipTxt: { color: T.textSub, fontSize: 15, fontWeight: '600' },
    cta: {
      height: 56, borderRadius: 28, backgroundColor: T.accent,
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        ios:     { shadowColor: T.accent, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 32 },
        android: { elevation: 10 },
      }),
    },
    ctaText: { color: '#090909', fontSize: 16, fontWeight: '700' },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>←</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={s.body}>
        <StepIndicator current={4} total={5} T={T} />
        <Text style={s.title}>Split with friends</Text>
        <Text style={s.sub}>Optional — invite friends to cover their share</Text>

        <TextInput
          style={s.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search friends..."
          placeholderTextColor={T.textMute}
        />

        {filtered.map(f => (
          <TouchableOpacity key={f.id} style={s.friendRow} onPress={() => toggle(f.id)} activeOpacity={0.8}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{f.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fname}>{f.name}</Text>
              <Text style={s.fhandle}>{f.handle}</Text>
            </View>
            <View style={[s.tick, selected.includes(f.id) && s.tickOn]}>
              {selected.includes(f.id) && <Text style={s.tickTxt}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}

        {selected.length > 0 && (
          <View style={s.splitCard}>
            <Text style={s.splitTxt}>
              You pay <Text style={s.highlight}>₹{perPerson}</Text> · each friend pays{' '}
              <Text style={s.highlight}>₹{perPerson}</Text>
            </Text>
          </View>
        )}
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.skipBtn} onPress={goNext} activeOpacity={0.8}>
          <Text style={s.skipTxt}>Skip — pay myself</Text>
        </TouchableOpacity>
        {selected.length > 0 && (
          <TouchableOpacity style={s.cta} onPress={handleSendSplit} activeOpacity={0.88}>
            <Text style={s.ctaText}>Send split to {selected.length} friend{selected.length > 1 ? 's' : ''} →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
