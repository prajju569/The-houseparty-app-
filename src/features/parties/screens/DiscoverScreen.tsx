import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  TextInput, ScrollView, Platform, ActivityIndicator,
  Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../../../theme/ThemeContext';
import { useLocationStore } from '../../../store/locationStore';
import { fetchNearbyEvents, type NearbyEvent } from '../../../services/eventService';

const FILTERS = ['All', 'Free', 'Tonight', '🔥 Hot', '🎵 Music', '🌿 Chill', '🍕 Food'];

function fmtDist(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function isTonight(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function DiscoverScreen({ navigation }: any) {
  const { T, isDark } = useTheme();
  const { lat, lng, area, city, permissionGranted, setLocation, setPermission } = useLocationStore();

  const [events,       setEvents]       = useState<NearbyEvent[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [filter,       setFilter]       = useState('All');
  const [searching,    setSearching]    = useState(false);
  const [searchText,   setSearchText]   = useState('');
  const [selectedPin,  setSelectedPin]  = useState<string | null>(null);
  const searchRef = useRef<TextInput>(null);
  const mapRef    = useRef<MapView>(null);

  const hasLocation = lat !== null && lng !== null;

  // ── Load nearby events ────────────────────────────────────────────────────
  const loadEvents = useCallback(async (userLat: number, userLng: number) => {
    setLoading(true);
    const data = await fetchNearbyEvents(userLat, userLng, 7);
    setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasLocation) loadEvents(lat!, lng!);
  }, [lat, lng]);

  // ── Manual location request (if permission was denied on boot) ────────────
  async function requestLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location needed',
        'Enable location in Settings to see parties near you.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      setPermission(false);
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;
    const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const a = geo?.district ?? geo?.subregion ?? geo?.city ?? '';
    const c = geo?.city ?? geo?.region ?? '';
    setLocation(latitude, longitude, a, c);
  }

  // ── Filter events ─────────────────────────────────────────────────────────
  const filtered = events.filter(e => {
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.area ?? '').toLowerCase().includes(q) ||
        (e.vibe ?? []).some(v => v.toLowerCase().includes(q))
      );
    }
    if (filter === 'All')     return true;
    if (filter === 'Free')    return e.entry_fee === 0;
    if (filter === 'Tonight') return isTonight(e.date);
    return (e.vibe ?? []).some(v => v.includes(filter.replace(/^[^ ]+ /, '')));
  });

  const selectedEvent = filtered.find(e => e.id === selectedPin) ?? null;

  const s = StyleSheet.create({
    root:  { flex: 1, backgroundColor: T.bg },
    map:   { flex: 1 },

    // Top bar
    topBar: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
      paddingHorizontal: 16,
    },
    locPill: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(9,9,9,0.75)',
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
      marginBottom: 8,
    },
    locText:  { color: 'rgba(244,242,236,0.75)', fontSize: 12, fontWeight: '500' },
    searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    searchBox: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: isDark ? 'rgba(13,13,14,0.90)' : 'rgba(246,244,239,0.95)',
      borderRadius: 16, paddingHorizontal: 14, height: 48,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
    },
    searchInput: { flex: 1, color: T.text, fontSize: 15 },

    // Filter chips
    filtersWrap: {
      position: 'absolute', zIndex: 10,
      left: 0, right: 0,
    },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
    },
    filterChipActive: {
      backgroundColor: T.accent, borderColor: T.accent,
    },
    filterChipText:       { color: T.textSub, fontSize: 13, fontWeight: '500' },
    filterChipTextActive: { color: '#090909', fontWeight: '700' },

    // No-location state
    noLocBox: {
      flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
    },
    noLocIcon:  { width: 72, height: 72, borderRadius: 36, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' },
    noLocTitle: { color: T.text, fontSize: 20, fontWeight: '700', textAlign: 'center', letterSpacing: -0.4 },
    noLocSub:   { color: T.textMute, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    noLocBtn:   { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28, backgroundColor: T.accent },
    noLocBtnTx: { color: '#090909', fontSize: 15, fontWeight: '700' },

    // Bottom sheet
    sheet: {
      position: 'absolute', left: 0, right: 0, bottom: 0,
      backgroundColor: isDark ? 'rgba(13,13,14,0.96)' : 'rgba(246,244,239,0.97)',
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      paddingBottom: Platform.OS === 'android' ? 110 : 100,
    },
    sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', alignSelf: 'center', marginTop: 10, marginBottom: 12 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginBottom: 8 },
    sheetTitle:  { color: T.text, fontSize: 16, fontWeight: '700' },
    sheetCount:  { color: T.textMute, fontSize: 13 },

    // Event row
    eventRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 18, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    },
    eventRowSel: { backgroundColor: isDark ? 'rgba(232,227,216,0.05)' : 'rgba(0,0,0,0.03)' },
    eventDot:    { width: 10, height: 10, borderRadius: 5 },
    eventName:   { color: T.text, fontSize: 15, fontWeight: '600', letterSpacing: -0.2, flex: 1 },
    eventMeta:   { color: T.textMute, fontSize: 12, marginTop: 2 },
    eventDist:   { color: T.textMute, fontSize: 12, fontWeight: '500' },
    eventFee:    { color: T.accent, fontSize: 13, fontWeight: '600' },

    loadingBox: { paddingVertical: 32, alignItems: 'center', gap: 10 },
    loadingTx:  { color: T.textMute, fontSize: 14 },

    emptyBox:  { paddingVertical: 40, alignItems: 'center', gap: 8 },
    emptyTx:   { color: T.textMute, fontSize: 14, textAlign: 'center' },
  });

  const region = hasLocation ? {
    latitude: lat!,
    longitude: lng!,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  } : {
    latitude: 19.0760,
    longitude: 72.8777,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  // Measure top bar height dynamically
  const [topBarH, setTopBarH] = useState(140);

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {permissionGranted === false ? (
        // ── No location permission ─────────────────────────────────────────
        <SafeAreaView style={s.noLocBox} edges={['top']}>
          <View style={s.noLocIcon}>
            <Feather name="map-pin" size={30} color={T.textMute} />
          </View>
          <Text style={s.noLocTitle}>Where should we look?</Text>
          <Text style={s.noLocSub}>
            Houseparty uses your location to show parties within 7 km. We never share your exact position.
          </Text>
          <TouchableOpacity style={s.noLocBtn} onPress={requestLocation} activeOpacity={0.88}>
            <Text style={s.noLocBtnTx}>Enable Location</Text>
          </TouchableOpacity>
        </SafeAreaView>
      ) : (
        <>
          {/* ── Map ──────────────────────────────────────────────────────── */}
          <MapView
            ref={mapRef}
            style={s.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton={false}
            userInterfaceStyle={isDark ? 'dark' : 'light'}
          >
            {/* 7km radius circle */}
            {hasLocation && (
              <Circle
                center={{ latitude: lat!, longitude: lng! }}
                radius={7000}
                strokeColor="rgba(232,227,216,0.25)"
                fillColor="rgba(232,227,216,0.04)"
              />
            )}

            {/* Event pins */}
            {filtered.map(event => (
              <Marker
                key={event.id}
                coordinate={{
                  latitude: event.lat ?? lat ?? 19.076,
                  longitude: event.lng ?? lng ?? 72.877,
                }}
                onPress={() => {
                  setSelectedPin(event.id);
                  mapRef.current?.animateToRegion({
                    latitude: (event.lat ?? lat ?? 19.076) - 0.005,
                    longitude: event.lng ?? lng ?? 72.877,
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.04,
                  }, 400);
                }}
              >
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
                  backgroundColor: selectedPin === event.id ? T.accent : isDark ? 'rgba(20,20,20,0.95)' : 'rgba(246,244,239,0.95)',
                  borderWidth: 1,
                  borderColor: selectedPin === event.id ? T.accent : 'rgba(255,255,255,0.15)',
                }}>
                  <Text style={{
                    fontSize: 12, fontWeight: '700',
                    color: selectedPin === event.id ? '#090909' : T.text,
                  }}>
                    {event.entry_fee === 0 ? 'Free' : `₹${event.entry_fee}`}
                  </Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* ── Top bar (search + location pill) ─────────────────────────── */}
          <SafeAreaView
            style={s.topBar}
            edges={['top']}
            onLayout={e => setTopBarH(e.nativeEvent.layout.height + 16)}
          >
            {/* Location pill */}
            <TouchableOpacity style={s.locPill} onPress={requestLocation} activeOpacity={0.8}>
              <Feather name="map-pin" size={12} color="rgba(232,227,216,0.7)" />
              <Text style={s.locText}>
                {area || city || (hasLocation ? 'Your location' : 'Set location')}
              </Text>
              <Feather name="chevron-down" size={12} color="rgba(232,227,216,0.5)" />
            </TouchableOpacity>

            {/* Search bar */}
            <View style={s.searchRow}>
              <View style={s.searchBox}>
                <Feather name="search" size={16} color={T.textMute} />
                <TextInput
                  ref={searchRef}
                  style={s.searchInput}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search area or vibe…"
                  placeholderTextColor={T.textMute}
                  onFocus={() => setSearching(true)}
                  onBlur={() => { if (!searchText) setSearching(false); }}
                  returnKeyType="search"
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchText(''); setSearching(false); }}>
                    <Feather name="x" size={16} color={T.textMute} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10 }}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[s.filterChip, filter === f && s.filterChipActive]}
                  onPress={() => setFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.filterChipText, filter === f && s.filterChipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>

          {/* ── Bottom sheet ─────────────────────────────────────────────── */}
          <View style={[s.sheet, { maxHeight: '52%' }]}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>
                {searchText ? `Results for "${searchText}"` : `Parties near you`}
              </Text>
              <Text style={s.sheetCount}>{filtered.length} found</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={s.loadingBox}>
                  <ActivityIndicator color={T.accent} />
                  <Text style={s.loadingTx}>Finding parties near you…</Text>
                </View>
              ) : filtered.length === 0 ? (
                <View style={s.emptyBox}>
                  <Feather name="calendar" size={28} color={T.textMute} />
                  <Text style={s.emptyTx}>
                    {hasLocation
                      ? 'No parties within 7 km right now.\nCheck back soon!'
                      : 'Enable location to see nearby parties.'}
                  </Text>
                </View>
              ) : (
                filtered.map(event => (
                  <TouchableOpacity
                    key={event.id}
                    style={[s.eventRow, selectedPin === event.id && s.eventRowSel]}
                    onPress={() => {
                      setSelectedPin(event.id);
                      navigation.navigate('EventDetail', { eventId: event.id });
                    }}
                    activeOpacity={0.82}
                  >
                    <View style={[s.eventDot, {
                      backgroundColor: event.is_private ? T.amber : T.green ?? '#00D37F',
                    }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.eventName} numberOfLines={1}>{event.title}</Text>
                      <Text style={s.eventMeta}>
                        {isTonight(event.date) ? '🔴 Tonight · ' : ''}{fmtTime(event.date)}
                        {event.area ? ` · ${event.area}` : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={s.eventFee}>{event.entry_fee === 0 ? 'Free' : `₹${event.entry_fee}`}</Text>
                      <Text style={s.eventDist}>{fmtDist(event.distance_km)}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}
