import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Platform, Switch, Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

type Suggestion = {
  display_name: string;
  address: { road?: string; suburb?: string; city?: string; state?: string; postcode?: string };
  lat: string;
  lon: string;
};

type Props = { route: any; navigation: any };

export default function CreateStep3Screen({ route, navigation }: Props) {
  const prev = route.params;

  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [picked,      setPicked]      = useState<Suggestion | null>(null);
  const [venue,       setVenue]       = useState('');
  const [isPrivate,   setIsPrivate]   = useState(false);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onQueryChange(text: string) {
    setQuery(text);
    setPicked(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => searchPlaces(text), 400);
  }

  async function useMyLocation() {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location denied', 'Enable location permissions to auto-fill your address.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const parts = [geo.streetNumber, geo.street, geo.subregion ?? geo.city].filter(Boolean);
      const addr = parts.join(', ');
      const area = geo.subregion ?? geo.city ?? '';
      const city = geo.city ?? geo.region ?? '';
      setQuery(addr);
      setSuggestions([]);
      if (!venue) setVenue(geo.name ?? geo.street ?? '');
      resolvedRef.current = {
        address: [addr, city, 'India'].filter(Boolean).join(', '),
        area,
        city,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setPicked({ display_name: addr, address: {}, lat: String(pos.coords.latitude), lon: String(pos.coords.longitude) });
    } catch {
      Alert.alert('Could not get location', 'Make sure GPS is enabled and try again.');
    } finally {
      setGpsLoading(false);
    }
  }

  async function searchPlaces(q: string) {
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=in&viewbox=77.4,13.2,77.8,12.8&bounded=0`;
      const res  = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'HousepartyApp/1.0' } });
      const json = await res.json();
      setSuggestions(json);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }

  // Store resolved data on the ref so we can access it in next()
  const resolvedRef = useRef<{ address: string; area: string; city: string; lat: number; lng: number } | null>(null);
  function onPick(s: Suggestion) {
    const addr = s.address;
    const area = addr.suburb ?? addr.city ?? '';
    const city = addr.city ?? addr.state ?? '';
    setPicked(s);
    setQuery(s.display_name.split(',').slice(0, 2).join(',').trim());
    setSuggestions([]);
    if (!venue) setVenue(s.display_name.split(',')[0].trim());
    resolvedRef.current = {
      address: s.display_name,
      area,
      city,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon),
    };
  }

  function next() {
    const r = resolvedRef.current;
    navigation.navigate('CreateStep4', {
      ...prev,
      venue:      venue.trim() || null,
      address:    r?.address ?? (query.trim() || null),
      area:       r?.area    ?? null,
      lat:        r?.lat     ?? null,
      lng:        r?.lng     ?? null,
      is_private: isPrivate,
    });
  }

  const canProceed = query.trim().length > 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color="rgba(244,242,236,0.6)" />
          </TouchableOpacity>

          <View style={s.steps}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={[s.step, i <= 3 ? s.stepActive : s.stepDot]} />
            ))}
          </View>

          <Text style={s.title}>Where is it?</Text>
          <Text style={s.sub}>Search for the venue — we'll auto-fill coordinates so guests can get directions.</Text>

          {/* Use my location */}
          <TouchableOpacity style={s.gpsBtn} onPress={useMyLocation} activeOpacity={0.8} disabled={gpsLoading}>
            {gpsLoading
              ? <ActivityIndicator size="small" color="#090909" />
              : <Feather name="navigation" size={15} color="#090909" />}
            <Text style={s.gpsBtnText}>{gpsLoading ? 'Getting location…' : 'Use my exact location'}</Text>
          </TouchableOpacity>

          <View style={s.orRow}>
            <View style={s.orLine} /><Text style={s.orText}>or search below</Text><View style={s.orLine} />
          </View>

          {/* Location search */}
          <Text style={s.label}>Search location</Text>
          <View style={s.searchWrap}>
            <Feather name="search" size={16} color="rgba(232,227,216,0.45)" style={{ marginLeft: 14 }} />
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={onQueryChange}
              placeholder="e.g. Blue Frog, Bandra West…"
              placeholderTextColor="rgba(244,242,236,0.3)"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color="rgba(232,227,216,0.5)" style={{ marginRight: 14 }} />}
            {picked && !searching && <Feather name="check-circle" size={16} color="#5FC88C" style={{ marginRight: 14 }} />}
          </View>

          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && (
            <View style={s.dropdown}>
              {suggestions.map((s2, i) => {
                const parts = s2.display_name.split(',');
                const name  = parts[0].trim();
                const rest  = parts.slice(1, 3).join(',').trim();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.dropItem, i < suggestions.length - 1 && s.dropDivider]}
                    onPress={() => onPick(s2)}
                    activeOpacity={0.75}
                  >
                    <Feather name="map-pin" size={13} color="rgba(232,227,216,0.4)" style={{ marginRight: 10, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.dropName} numberOfLines={1}>{name}</Text>
                      <Text style={s.dropSub} numberOfLines={1}>{rest}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Map preview when a location is resolved */}
          {picked && resolvedRef.current && (
            <MapView
              style={s.mapPreview}
              region={{
                latitude: resolvedRef.current.lat,
                longitude: resolvedRef.current.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker coordinate={{ latitude: resolvedRef.current.lat, longitude: resolvedRef.current.lng }} />
            </MapView>
          )}

          {/* Venue name override */}
          <Text style={[s.label, { marginTop: 24 }]}>Venue / place name (optional)</Text>
          <TextInput
            style={s.input}
            value={venue}
            onChangeText={setVenue}
            placeholder="e.g. The Blue Rooftop"
            placeholderTextColor="rgba(244,242,236,0.3)"
          />

          {/* Privacy toggle */}
          <View style={[s.privacyCard, { borderColor: isPrivate ? 'rgba(232,227,216,0.40)' : 'rgba(255,255,255,0.10)' }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.privacyTitle}>Hide exact address</Text>
              <Text style={s.privacySub}>Guests see the area only. Full address revealed after RSVP is confirmed.</Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(232,227,216,0.60)' }}
              thumbColor={isPrivate ? '#E8E3D8' : 'rgba(244,242,236,0.60)'}
            />
          </View>

          <TouchableOpacity
            style={[s.cta, !canProceed && { opacity: 0.4 }]}
            onPress={next}
            activeOpacity={0.88}
            disabled={!canProceed}
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

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 4,
  },
  searchInput: {
    flex: 1, height: '100%', paddingHorizontal: 12,
    color: '#F4F2EC', fontSize: 15,
  },

  dropdown: {
    backgroundColor: 'rgba(20,20,20,0.98)',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 4,
    overflow: 'hidden',
  },
  dropItem:    { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12 },
  dropDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  dropName:    { color: '#F4F2EC', fontSize: 14, fontWeight: '600' },
  dropSub:     { color: 'rgba(244,242,236,0.4)', fontSize: 12, marginTop: 2 },

  input: {
    height: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18, color: '#F4F2EC', fontSize: 15, marginBottom: 20,
  },

  privacyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 18, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, marginBottom: 36,
  },
  privacyTitle: { color: '#F4F2EC', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  privacySub:   { color: 'rgba(244,242,236,0.45)', fontSize: 12, lineHeight: 18 },

  cta:     { height: 56, borderRadius: 28, backgroundColor: '#E8E3D8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.38, shadowRadius: 28 }, android: { elevation: 10 } }) },
  ctaText: { color: '#090909', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 48, borderRadius: 24,
    backgroundColor: '#E8E3D8', marginBottom: 16,
    ...Platform.select({ ios: { shadowColor: '#E8E3D8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 16 }, android: { elevation: 6 } }),
  },
  gpsBtnText: { color: '#090909', fontSize: 14, fontWeight: '700' },

  orRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  orText: { color: 'rgba(244,242,236,0.35)', fontSize: 12 },

  mapPreview: {
    height: 140, borderRadius: 16, overflow: 'hidden',
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
});
