import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RollingCounter } from './RollingCounter';

const T = {
  card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', goldDim: 'rgba(201,168,76,0.12)',
  green: '#00D37F', greenDim: 'rgba(0,211,127,0.12)',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
};

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune'];

const MICRO_STATS = [
  { value: '340+', label: 'Verified Hosts' },
  { value: '12',   label: 'Cities' },
  { value: '4.8★', label: 'Avg Rating' },
];

export function SocialProof() {
  return (
    <View style={s.card}>
      {/* Glow accent */}
      <View style={s.glowDot} />

      {/* Eyebrow */}
      <Text style={s.eyebrow}>TRUSTED BY INDIA</Text>

      {/* Counter + hook */}
      <View style={s.counterRow}>
        <RollingCounter
          value={10000}
          suffix="+"
          fontSize={44}
          color={T.gold}
          fontWeight="900"
          staggerMs={80}
        />
      </View>

      {/* The hook — CRED-style: short, confident, slightly cocky */}
      <Text style={s.hook}>nights that didn't disappoint.</Text>
      <Text style={s.sub}>
        Real hosts. Vetted vibes. Zero boring weekends.
      </Text>

      {/* Divider */}
      <View style={s.divider} />

      {/* Micro stats row */}
      <View style={s.statsRow}>
        {MICRO_STATS.map((stat, i) => (
          <View key={stat.label} style={[s.stat, i < MICRO_STATS.length - 1 && s.statBorder]}>
            <Text style={s.statVal}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* City pills */}
      <View style={s.cityRow}>
        <Text style={s.cityLabel}>📍 Active in</Text>
        {CITIES.map(city => (
          <View key={city} style={s.cityPill}>
            <Text style={s.cityText}>{city}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: T.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },

  // Subtle gold glow in top-right corner
  glowDot: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(201,168,76,0.07)',
  },

  eyebrow: {
    color: T.textMute,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },

  hook: {
    color: T.text,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 6,
  },

  sub: {
    color: T.textSub,
    fontSize: 13,
    lineHeight: 19,
  },

  divider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 16,
  },

  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: T.border,
  },
  statVal: {
    color: T.gold,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 3,
  },
  statLabel: {
    color: T.textMute,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  cityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  cityLabel: {
    color: T.textMute,
    fontSize: 11,
    marginRight: 2,
  },
  cityPill: {
    backgroundColor: T.elevated,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  cityText: {
    color: T.textSub,
    fontSize: 11,
    fontWeight: '500',
  },
});
