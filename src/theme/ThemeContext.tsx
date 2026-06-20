import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@hp_theme';

// ── Wireframe "Liquid Glass" design system ────────────────────────────────────
export const DARK_TOKENS = {
  bg:          '#090909',
  card:        'rgba(255,255,255,0.06)',
  elevated:    'rgba(255,255,255,0.04)',
  surface:     'rgba(255,255,255,0.05)',
  surfaceHigh: 'rgba(255,255,255,0.08)',
  border:      'rgba(255,255,255,0.08)',
  borderHigh:  'rgba(255,255,255,0.12)',
  // accent – champagne (replaces yellow-gold)
  accent:      '#E8E3D8',
  accentDim:   'rgba(232,227,216,0.14)',
  onAccent:    '#090909',
  // legacy alias kept for screens that still reference T.gold
  gold:        '#E8E3D8',
  goldDim:     'rgba(232,227,216,0.14)',
  // semantic
  green:       '#00D37F',
  greenDim:    'rgba(0,211,127,0.14)',
  amber:       '#F59E0B',
  amberDim:    'rgba(245,158,11,0.14)',
  red:         '#FF5A5A',
  blue:        '#5B8CFF',
  // text
  text:        '#F4F2EC',
  textSub:     'rgba(244,242,236,0.65)',
  textMute:    'rgba(244,242,236,0.38)',
  separator:   'rgba(255,255,255,0.06)',
};

export const LIGHT_TOKENS = {
  bg:          '#F2F2F7',
  card:        '#FFFFFF',
  elevated:    '#EBEBF0',
  surface:     'rgba(0,0,0,0.03)',
  surfaceHigh: 'rgba(0,0,0,0.06)',
  border:      'rgba(0,0,0,0.08)',
  borderHigh:  'rgba(0,0,0,0.14)',
  accent:      '#B8902A',
  accentDim:   'rgba(184,144,42,0.10)',
  onAccent:    '#FFFFFF',
  gold:        '#B8902A',
  goldDim:     'rgba(184,144,42,0.10)',
  green:       '#00A86B',
  greenDim:    'rgba(0,168,107,0.10)',
  amber:       '#D97706',
  amberDim:    'rgba(217,119,6,0.10)',
  red:         '#D93025',
  blue:        '#3B82F6',
  text:        '#0C0C0C',
  textSub:     'rgba(12,12,12,0.65)',
  textMute:    'rgba(12,12,12,0.38)',
  separator:   'rgba(0,0,0,0.06)',
};

export type ThemeTokens = typeof DARK_TOKENS;

interface ThemeCtx {
  isDark: boolean;
  T: ThemeTokens;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  isDark: true,
  T: DARK_TOKENS,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v !== null) setIsDark(v === 'dark');
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, T: isDark ? DARK_TOKENS : LIGHT_TOKENS, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
