import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Dimensions, Animated, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NEARBY_HOSTS, NearbyHost } from '../../../data/fakeData';

const { width: W, height: H } = Dimensions.get('window');

// Radar sits in top 58% of screen — gives space for host list below
const RADAR_H   = H * 0.58;
const RADAR_CX  = W / 2;
const RADAR_CY  = RADAR_H * 0.52;   // slightly below visual center

// Three proximity rings (in px radius on screen)
const RING_R  = [W * 0.14, W * 0.28, W * 0.43];
// Boundary of each distance bucket (metres)
const RING_DIST = [600, 1500, Infinity];

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.12)',
  green: '#00D37F',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
  purple: '#A855F7',
};

// ── Single expanding ring ─────────────────────────────────────────────────────
function PulseRing({ radius, delay, color, duration = 4000 }: {
  radius: number; delay: number; color: string; duration?: number;
}) {
  const scale   = useRef(new Animated.Value(0.18)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.08, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.5, duration: 350, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: duration - 350, useNativeDriver: true }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.18, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const size = radius * 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: radius,
        borderWidth: 1.2,
        borderColor: color,
        opacity,
        transform: [{ scale }],
        left: RADAR_CX - radius,
        top: RADAR_CY  - radius,
      }}
    />
  );
}

// ── Static faint ring (distance marker) ──────────────────────────────────────
function StaticRing({ radius, label }: { radius: number; label: string }) {
  const size = radius * 2;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: radius,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.15)',
        left: RADAR_CX - radius,
        top:  RADAR_CY  - radius,
        alignItems: 'center',
      }}
    >
      <Text style={{
        position: 'absolute',
        top: 6, color: 'rgba(201,168,76,0.45)',
        fontSize: 9, fontWeight: '600', letterSpacing: 0.5,
      }}>{label}</Text>
    </View>
  );
}

// ── Host avatar pin on the radar ──────────────────────────────────────────────
function HostPin({
  host, ringIndex, selected, onPress, entryDelay,
}: {
  host: NearbyHost; ringIndex: number;
  selected: boolean; onPress: () => void; entryDelay: number;
}) {
  const AVATAR = 44;
  const angleRad = (host.angle * Math.PI) / 180;
  const r = RING_R[ringIndex];
  const cx = RADAR_CX + Math.cos(angleRad) * r - AVATAR / 2;
  const cy = RADAR_CY  + Math.sin(angleRad) * r - AVATAR / 2;

  // Entry animation
  const entry   = useRef(new Animated.Value(0)).current;
  const pulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(entryDelay),
      Animated.spring(entry, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 1800, useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => loop.start(), entryDelay);
    return () => { clearTimeout(t); loop.stop(); };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', left: cx, top: cy,
        opacity: entry,
        transform: [{ scale: Animated.multiply(entry, pulse) }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          s.pin,
          selected && s.pinSelected,
          { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 },
        ]}
      >
        <Image
          source={{ uri: host.avatar }}
          style={{ width: AVATAR - 4, height: AVATAR - 4, borderRadius: (AVATAR - 4) / 2 }}
        />
      </TouchableOpacity>
      {/* Host name label */}
      <Text style={s.pinLabel} numberOfLines={1}>{host.name.split(' ')[0]}</Text>
    </Animated.View>
  );
}

// ── Host card in the bottom list ──────────────────────────────────────────────
function HostRow({ host, selected, onPress }: {
  host: NearbyHost; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.hostRow, selected && s.hostRowSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={s.hostRowLeft}>
        <Image source={{ uri: host.avatar }} style={s.hostRowAvatar} />
        {host.verified && <View style={s.verifiedDot} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.hostRowName}>{host.name}</Text>
        <Text style={s.hostRowMeta}>
          {host.eventsHosted} events · ⭐ {host.rating}
          {host.nextEvent ? ` · "${host.nextEvent}"` : ''}
        </Text>
      </View>
      <View style={s.distPill}>
        <Text style={s.distTxt}>{host.distance}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function NearbyHostsScreen({ navigation }: any) {
  const [selected, setSelected] = useState<string | null>(null);

  // Which static ring each host sits on
  const ringOf = (h: NearbyHost) =>
    h.distanceM < RING_DIST[0] ? 0
    : h.distanceM < RING_DIST[1] ? 1
    : 2;

  // Expanding MagicRings — alternate gold / purple, 7 pulses staggered
  const PULSE_RINGS = [
    { radius: W * 0.50, delay: 0,    color: T.gold,   dur: 4000 },
    { radius: W * 0.50, delay: 600,  color: T.purple, dur: 4000 },
    { radius: W * 0.50, delay: 1200, color: T.gold,   dur: 4000 },
    { radius: W * 0.50, delay: 1800, color: T.purple, dur: 4000 },
    { radius: W * 0.50, delay: 2400, color: T.gold,   dur: 4000 },
    { radius: W * 0.50, delay: 3000, color: T.purple, dur: 4000 },
    { radius: W * 0.50, delay: 3600, color: T.gold,   dur: 4000 },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Radar canvas ─────────────────────────────────── */}
      <View style={[s.radar, { height: RADAR_H }]}>

        {/* Expanding pulse rings (MagicRings effect) */}
        {PULSE_RINGS.map((r, i) => (
          <PulseRing key={i} radius={r.radius} delay={r.delay} color={r.color} duration={r.dur} />
        ))}

        {/* Static distance markers */}
        <StaticRing radius={RING_R[0]} label="< 600 m" />
        <StaticRing radius={RING_R[1]} label="< 1.5 km" />
        <StaticRing radius={RING_R[2]} label="< 3.5 km" />

        {/* Centre — "you" dot */}
        <View style={s.centre}>
          <View style={s.centreRing} />
          <View style={s.centreDot} />
          <Text style={s.centreLabel}>YOU</Text>
        </View>

        {/* Host pins */}
        {NEARBY_HOSTS.map((h, i) => (
          <HostPin
            key={h.id}
            host={h}
            ringIndex={ringOf(h)}
            selected={selected === h.id}
            onPress={() => setSelected(prev => prev === h.id ? null : h.id)}
            entryDelay={300 + i * 200}
          />
        ))}

        {/* Header overlay */}
        <SafeAreaView edges={['top']} style={s.headerOverlay}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>NEARBY HOSTS</Text>
            <Text style={s.headerSub}>{NEARBY_HOSTS.length} hosts found near you</Text>
          </View>
          <View style={{ width: 48 }} />
        </SafeAreaView>
      </View>

      {/* ── Host list ─────────────────────────────────────── */}
      <View style={s.listWrap}>
        <View style={s.listHandle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {NEARBY_HOSTS.map(h => (
            <HostRow
              key={h.id}
              host={h}
              selected={selected === h.id}
              onPress={() => setSelected(prev => prev === h.id ? null : h.id)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  radar: {
    width: W,
    backgroundColor: T.bg,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },

  centre: {
    position: 'absolute',
    left: RADAR_CX - 22,
    top:  RADAR_CY  - 22,
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  centreRing: {
    position: 'absolute',
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: T.gold,
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  centreDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: T.gold,
  },
  centreLabel: {
    position: 'absolute',
    top: 48, color: T.gold,
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
  },

  // Avatar pin
  pin: {
    borderWidth: 2, borderColor: T.border,
    backgroundColor: T.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  pinSelected: {
    borderColor: T.gold,
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 10,
  },
  pinLabel: {
    color: T.textSub,
    fontSize: 9, fontWeight: '700',
    textAlign: 'center', marginTop: 2,
  },

  // Header overlay
  headerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8,
  },
  back: { color: T.gold, fontSize: 14, fontWeight: '700', width: 48 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    color: T.text, fontSize: 13, fontWeight: '800', letterSpacing: 2,
  },
  headerSub: { color: T.textMute, fontSize: 11, marginTop: 2 },

  // Host list
  listWrap: {
    flex: 1, backgroundColor: T.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 8,
  },
  listHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: T.border, alignSelf: 'center', marginBottom: 12,
  },
  hostRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  hostRowSelected: { backgroundColor: T.elevated },
  hostRowLeft: { position: 'relative' },
  hostRowAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: T.elevated },
  verifiedDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: T.green,
    borderWidth: 2, borderColor: T.card,
  },
  hostRowName: { color: T.text, fontSize: 14, fontWeight: '700' },
  hostRowMeta: { color: T.textMute, fontSize: 11, marginTop: 2, lineHeight: 15 },
  distPill: {
    backgroundColor: T.elevated, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: T.border,
  },
  distTxt: { color: T.gold, fontSize: 12, fontWeight: '700' },
});
