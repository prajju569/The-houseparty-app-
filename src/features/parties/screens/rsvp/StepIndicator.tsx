import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ThemeTokens } from '../../../../theme/ThemeContext';

type Props = { current: number; total: number; T: ThemeTokens };

export default function StepIndicator({ current, total, T }: Props) {
  const s = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
    dot: { height: 6, borderRadius: 3, backgroundColor: T.border },
  });
  return (
    <View style={s.row}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone   = step < current;
        return (
          <View
            key={i}
            style={[
              s.dot,
              isActive ? { width: 22, backgroundColor: T.accent }
              : isDone  ? { width: 8, backgroundColor: T.accent, opacity: 0.4 }
                        : { width: 8 },
            ]}
          />
        );
      })}
    </View>
  );
}
