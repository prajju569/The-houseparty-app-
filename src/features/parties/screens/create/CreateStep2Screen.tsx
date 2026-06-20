import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = { route: any; navigation: any };

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
}

export default function CreateStep2Screen({ route, navigation }: Props) {
  const prev = route.params;

  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [picked, setPicked] = useState<Date | null>(null);
  const [capacity, setCapacity] = useState(20);
  const [fee, setFee] = useState(0);
  const [minAge, setMinAge] = useState<number | null>(null);

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') { setPickerMode(null); return; }
      if (pickerMode === 'date' && selected) {
        setPicked(prev => {
          const base = prev ?? new Date();
          selected.setHours(base.getHours(), base.getMinutes());
          return selected;
        });
        setPickerMode('time');
        return;
      }
      if (pickerMode === 'time' && selected) {
        setPicked(prev => {
          if (!prev) return selected;
          const d = new Date(prev);
          d.setHours(selected.getHours(), selected.getMinutes());
          return d;
        });
        setPickerMode(null);
      }
    } else {
      // iOS: inline picker updates continuously
      if (selected) setPicked(selected);
    }
  }

  function openPicker() {
    setPickerMode('date');
  }

  function confirmIOSPicker() {
    if (pickerMode === 'date') {
      setPickerMode('time');
    } else {
      setPickerMode(null);
    }
  }

  function next() {
    if (!picked) {
      Alert.alert('Missing info', 'Please select a date and time for the event.');
      return;
    }
    const iso = picked.toISOString();
    navigation.navigate('CreateStep3', {
      ...prev,
      date: iso,
      capacity,
      entry_fee: fee,
      min_age: minAge,
    });
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color="rgba(244,242,236,0.6)" />
          </TouchableOpacity>

          <View style={s.steps}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={[s.step, i <= 2 ? s.stepActive : s.stepDot]} />
            ))}
          </View>

          <Text style={s.title}>When & how many?</Text>
          <Text style={s.sub}>Set the date, time, and how many guests you can fit.</Text>

          {/* Date/time selector */}
          <Text style={s.label}>Date & time</Text>
          <TouchableOpacity style={s.datePill} onPress={openPicker} activeOpacity={0.8}>
            <Feather name="calendar" size={16} color="rgba(232,227,216,0.55)" style={{ marginRight: 10 }} />
            {picked ? (
              <View style={{ flex: 1 }}>
                <Text style={s.dateText}>{formatDate(picked)}</Text>
                <Text style={s.timeText}>{formatTime(picked)}</Text>
              </View>
            ) : (
              <Text style={s.datePlaceholder}>Tap to choose date & time</Text>
            )}
            <Feather name="chevron-right" size={16} color="rgba(232,227,216,0.3)" />
          </TouchableOpacity>

          {/* Android inline picker shown as overlay modal */}
          {pickerMode !== null && (
            <>
              {Platform.OS === 'ios' ? (
                <View style={s.iosPickerWrap}>
                  <DateTimePicker
                    value={picked ?? new Date(Date.now() + 24 * 3600000)}
                    mode={pickerMode}
                    display="spinner"
                    minimumDate={pickerMode === 'date' ? today : undefined}
                    onChange={onPickerChange}
                    textColor="#F4F2EC"
                    themeVariant="dark"
                    style={{ flex: 1 }}
                  />
                  <TouchableOpacity style={s.iosConfirm} onPress={confirmIOSPicker}>
                    <Text style={s.iosConfirmText}>{pickerMode === 'date' ? 'Set time →' : 'Done'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <DateTimePicker
                  value={picked ?? new Date(Date.now() + 24 * 3600000)}
                  mode={pickerMode}
                  display="default"
                  minimumDate={pickerMode === 'date' ? today : undefined}
                  onChange={onPickerChange}
                />
              )}
            </>
          )}

          {/* Capacity */}
          <Text style={[s.label, { marginTop: 28 }]}>Capacity</Text>
          <View style={s.counterRow}>
            <TouchableOpacity style={s.counterBtn} onPress={() => setCapacity(c => Math.max(1, c - 1))}>
              <Feather name="minus" size={16} color="#F4F2EC" />
            </TouchableOpacity>
            <Text style={s.counterVal}>{capacity} guests</Text>
            <TouchableOpacity style={s.counterBtn} onPress={() => setCapacity(c => c + 1)}>
              <Feather name="plus" size={16} color="#F4F2EC" />
            </TouchableOpacity>
          </View>

          {/* Entry fee */}
          <Text style={[s.label, { marginTop: 20 }]}>Entry fee (₹)</Text>
          <View style={s.feeRow}>
            {[0, 99, 199, 299, 499, 799].map(v => (
              <TouchableOpacity
                key={v}
                style={[s.feeChip, fee === v && s.feeChipActive]}
                onPress={() => setFee(v)}
                activeOpacity={0.75}
              >
                <Text style={[s.feeChipText, fee === v && s.feeChipTextActive]}>
                  {v === 0 ? 'Free' : `₹${v}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Age restriction */}
          <Text style={[s.label, { marginTop: 20 }]}>Age restriction</Text>
          <View style={s.feeRow}>
            {[{ label: 'All ages', v: null }, { label: '18+', v: 18 }, { label: '21+', v: 21 }].map(opt => (
              <TouchableOpacity
                key={opt.label}
                style={[s.feeChip, minAge === opt.v && s.feeChipActive]}
                onPress={() => setMinAge(opt.v)}
                activeOpacity={0.75}
              >
                <Text style={[s.feeChipText, minAge === opt.v && s.feeChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {minAge != null && (
            <Text style={{ color: 'rgba(232,227,216,0.45)', fontSize: 11, marginTop: 8, lineHeight: 16 }}>
              Guests under {minAge} can't RSVP — we check the date of birth on their profile.
            </Text>
          )}

          <View style={{ height: 32 }} />

          <TouchableOpacity style={[s.cta, !picked && { opacity: 0.4 }]} onPress={next} activeOpacity={0.88} disabled={!picked}>
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

  label: { fontSize: 12, fontWeight: '600', color: 'rgba(232,227,216,0.55)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },

  datePill: {
    flexDirection: 'row', alignItems: 'center',
    height: 64, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18, marginBottom: 8,
  },
  dateText:        { color: '#F4F2EC', fontSize: 15, fontWeight: '600' },
  timeText:        { color: 'rgba(232,227,216,0.55)', fontSize: 12, marginTop: 2 },
  datePlaceholder: { flex: 1, color: 'rgba(244,242,236,0.30)', fontSize: 15 },

  iosPickerWrap: {
    backgroundColor: 'rgba(20,20,20,0.98)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden', marginBottom: 8,
  },
  iosConfirm:     { alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  iosConfirmText: { color: '#E8E3D8', fontSize: 15, fontWeight: '600' },

  counterRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden', marginBottom: 8,
  },
  counterBtn: { width: 54, alignItems: 'center', justifyContent: 'center' },
  counterVal: { flex: 1, textAlign: 'center', color: '#F4F2EC', fontSize: 17, fontWeight: '600' },

  feeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  feeChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  feeChipActive:    { backgroundColor: 'rgba(232,227,216,0.12)', borderColor: 'rgba(232,227,216,0.40)' },
  feeChipText:      { color: 'rgba(244,242,236,0.55)', fontSize: 14, fontWeight: '600' },
  feeChipTextActive:{ color: '#E8E3D8' },

  cta:    { height: 56, borderRadius: 28, backgroundColor: '#E8E3D8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 }, android: { elevation: 10 } }) },
  ctaText:{ color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
