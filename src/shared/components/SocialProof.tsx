import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RollingCounter } from './RollingCounter';
import { useTheme } from '../../theme/ThemeContext';

// Compact promotional strip — trust signal, not a hero section
export function SocialProof() {
  const { T } = useTheme();

  const s = StyleSheet.create({
    strip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: T.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: T.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      overflow: 'hidden',
      position: 'relative',
    },

    glowDot: {
      position: 'absolute',
      top: -30,
      right: -30,
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: 'rgba(232,227,216,0.06)',
    },

    left: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    label: {
      color: T.textMute,
      fontSize: 12,
      fontWeight: '500',
    },

    divider: {
      width: 1,
      height: 24,
      backgroundColor: T.border,
      marginHorizontal: 14,
    },

    right: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexWrap: 'wrap',
    },
    stat: {
      color: T.text,
      fontSize: 12,
      fontWeight: '700',
    },
    statLabel: {
      color: T.textMute,
      fontWeight: '500',
    },
    dot: {
      color: T.border,
      fontSize: 12,
    },
  });

  return (
    <View style={s.strip}>
      <View style={s.glowDot} />

      <View style={s.left}>
        <RollingCounter
          value={10000}
          suffix="+"
          fontSize={20}
          color={T.gold}
          fontWeight="800"
          staggerMs={60}
        />
        <Text style={s.label}>nights hosted</Text>
      </View>

      <View style={s.divider} />

      <View style={s.right}>
        <Text style={s.stat}>340+ <Text style={s.statLabel}>hosts</Text></Text>
        <Text style={s.dot}>·</Text>
        <Text style={s.stat}>12 <Text style={s.statLabel}>cities</Text></Text>
        <Text style={s.dot}>·</Text>
        <Text style={s.stat}>4.8<Text style={s.statLabel}>★</Text></Text>
      </View>
    </View>
  );
}
