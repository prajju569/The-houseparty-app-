import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, StatusBar, KeyboardAvoidingView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

type Props = {
  route: { params: { role: 'guest' | 'host'; username: string } };
  navigation: any;
};

export default function SetupDOBScreen({ route, navigation }: Props) {
  const { role = 'guest', username = '' } = route.params ?? {};
  const [day, setDay]     = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear]   = useState('');

  const monthRef = useRef<TextInput>(null);
  const yearRef  = useRef<TextInput>(null);

  const canContinue = day.length === 2 && month.length === 2 && year.length === 4;

  function handleContinue() {
    const d = parseInt(day, 10), m = parseInt(month, 10), y = parseInt(year, 10);
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear() - 13) {
      Alert.alert('Invalid date', 'Enter a valid date of birth. You must be at least 13.');
      return;
    }
    const dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    navigation.navigate('SetupGender', { role, username, dob });
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.inner}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Feather name="arrow-left" size={20} color="rgba(244,242,236,0.6)" />
            </TouchableOpacity>

            <View style={s.steps}>
              <View style={[s.step, s.stepDone]} />
              <View style={[s.step, s.stepActive]} />
              <View style={s.step} />
            </View>

            <Text style={s.title}>When's your birthday?</Text>
            <Text style={s.sub}>
              Used to verify age for 18+ events. Hosts only see your age range — never your exact date.
            </Text>

            <View style={s.dateRow}>
              <View style={s.dateBox}>
                <Text style={s.dateLabel}>Day</Text>
                <TextInput
                  style={s.dateInput}
                  value={day}
                  onChangeText={t => {
                    const v = t.replace(/\D/g, '').slice(0, 2);
                    setDay(v);
                    if (v.length === 2) monthRef.current?.focus();
                  }}
                  placeholder="DD"
                  placeholderTextColor="rgba(244,242,236,0.22)"
                  keyboardType="number-pad"
                  maxLength={2}
                  textAlign="center"
                />
              </View>

              <Text style={s.sep}>/</Text>

              <View style={s.dateBox}>
                <Text style={s.dateLabel}>Month</Text>
                <TextInput
                  ref={monthRef}
                  style={s.dateInput}
                  value={month}
                  onChangeText={t => {
                    const v = t.replace(/\D/g, '').slice(0, 2);
                    setMonth(v);
                    if (v.length === 2) yearRef.current?.focus();
                  }}
                  placeholder="MM"
                  placeholderTextColor="rgba(244,242,236,0.22)"
                  keyboardType="number-pad"
                  maxLength={2}
                  textAlign="center"
                />
              </View>

              <Text style={s.sep}>/</Text>

              <View style={[s.dateBox, { flex: 1.5 }]}>
                <Text style={s.dateLabel}>Year</Text>
                <TextInput
                  ref={yearRef}
                  style={s.dateInput}
                  value={year}
                  onChangeText={t => setYear(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="YYYY"
                  placeholderTextColor="rgba(244,242,236,0.22)"
                  keyboardType="number-pad"
                  maxLength={4}
                  textAlign="center"
                  returnKeyType="done"
                  onSubmitEditing={canContinue ? handleContinue : undefined}
                />
              </View>
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              style={[s.cta, !canContinue && s.ctaDim]}
              onPress={handleContinue}
              activeOpacity={0.88}
              disabled={!canContinue}
            >
              <Text style={s.ctaText}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#090909" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#090909' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },

  backBtn: { marginTop: 8, marginBottom: 24, alignSelf: 'flex-start', padding: 4 },

  steps:      { flexDirection: 'row', gap: 8, marginBottom: 32 },
  step:       { height: 5, width: 20, borderRadius: 3, backgroundColor: 'rgba(232,227,216,0.22)' },
  stepDone:   { backgroundColor: 'rgba(232,227,216,0.42)' },
  stepActive: { width: 32, backgroundColor: '#E8E3D8' },

  title: { fontSize: 28, fontWeight: '700', color: '#F4F2EC', letterSpacing: -0.9, marginBottom: 10 },
  sub:   { fontSize: 14, color: 'rgba(244,242,236,0.48)', lineHeight: 21, marginBottom: 36 },

  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dateBox: { flex: 1 },
  dateLabel: {
    fontSize: 11, fontWeight: '600', color: 'rgba(232,227,216,0.42)',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center',
  },
  dateInput: {
    height: 64, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    color: '#F4F2EC', fontSize: 22, fontWeight: '600',
  },
  sep: {
    color: 'rgba(244,242,236,0.22)', fontSize: 22,
    marginBottom: 16, paddingHorizontal: 2,
  },

  cta: {
    height: 56, borderRadius: 28, backgroundColor: '#E8E3D8',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 },
      android: { elevation: 10 },
    }),
  },
  ctaDim:  { opacity: 0.32 },
  ctaText: { color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
