import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  radius?: 'md' | 'lg' | 'xl';
  flush?: boolean;
}

export function Card({ children, radius = 'xl', flush = false, style, ...props }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[radius],
        flush && styles.flush,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#0A0A0A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: { elevation: 2 },
    }),
  },
  md:    { borderRadius: 12 },
  lg:    { borderRadius: 16 },
  xl:    { borderRadius: 20 },
  flush: { borderRadius: 0 },
});
