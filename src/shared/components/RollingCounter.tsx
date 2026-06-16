import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, ViewStyle } from 'react-native';

const SLOT_H = 56;

// Single digit column — 0..9 stacked, spring-animated to the target digit
function RollingDigit({
  target,
  delay,
  fontSize,
  color,
  fontWeight,
}: {
  target: number;
  delay: number;
  fontSize: number;
  color: string;
  fontWeight: '900' | '800' | '700';
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(anim, {
        toValue: target,
        damping: 16,
        stiffness: 90,
        mass: 1.1,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [target, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 9],
    outputRange: [0, -(SLOT_H * 9)],
  });

  return (
    <View style={{ height: SLOT_H, overflow: 'hidden', alignItems: 'center' }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <View key={n} style={{ height: SLOT_H, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{ fontSize, fontWeight, color, includeFontPadding: false }}
              allowFontScaling={false}
            >
              {n}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// Separator character (comma, '+', etc.) — no animation
function Separator({ char, fontSize, color, fontWeight }: {
  char: string; fontSize: number; color: string; fontWeight: '900' | '800' | '700';
}) {
  return (
    <View style={{ height: SLOT_H, justifyContent: 'center', paddingBottom: 4 }}>
      <Text style={{ fontSize, fontWeight, color, includeFontPadding: false }} allowFontScaling={false}>
        {char}
      </Text>
    </View>
  );
}

interface RollingCounterProps {
  value: number;         // e.g. 10000
  suffix?: string;       // e.g. '+'
  fontSize?: number;
  color?: string;
  fontWeight?: '900' | '800' | '700';
  staggerMs?: number;    // ms between each digit animation
  style?: ViewStyle;
}

export function RollingCounter({
  value,
  suffix = '',
  fontSize = 48,
  color = '#C9A84C',
  fontWeight = '900',
  staggerMs = 90,
  style,
}: RollingCounterProps) {
  // Build token list: digits and separators from the formatted number
  // e.g. 10000 → ['1','0',',','0','0','0']
  const formatted = value.toLocaleString('en-IN'); // "10,000"
  const tokens = formatted.split('');

  // For each digit token, calculate its face value and stagger delay
  let digitIndex = 0;
  const items = tokens.map((ch, i) => {
    if (/\d/.test(ch)) {
      const d = parseInt(ch, 10);
      const idx = digitIndex++;
      return { type: 'digit' as const, value: d, delay: idx * staggerMs, key: `d${i}` };
    }
    return { type: 'sep' as const, char: ch, key: `s${i}` };
  });

  if (suffix) {
    items.push({ type: 'sep' as const, char: suffix, key: 'suffix' });
  }

  return (
    <View style={[s.row, style]}>
      {items.map(item =>
        item.type === 'digit' ? (
          <RollingDigit
            key={item.key}
            target={item.value}
            delay={item.delay}
            fontSize={fontSize}
            color={color}
            fontWeight={fontWeight}
          />
        ) : (
          <Separator
            key={item.key}
            char={item.char}
            fontSize={fontSize}
            color={color}
            fontWeight={fontWeight}
          />
        )
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
