import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@hp_theme';

// ── Token sets ────────────────────────────────────────────────────────────────
export const DARK_TOKENS = {
  bg:        '#0C0C0C',
  card:      '#161616',
  elevated:  '#1E1E1E',
  border:    '#2A2A2A',
  text:      '#F0F0EE',
  textSub:   '#A0A09A',
  textMute:  '#5A5A56',
  gold:      '#C9A84C',
  goldDim:   'rgba(201,168,76,0.14)',
  green:     '#00D37F',
  greenDim:  'rgba(0,211,127,0.14)',
  red:       '#FF5A5A',
  separator: '#1C1C1C',
};

export const LIGHT_TOKENS = {
  bg:        '#F2F2F7',
  card:      '#FFFFFF',
  elevated:  '#EBEBF0',
  border:    '#E0E0E5',
  text:      '#0C0C0C',
  textSub:   '#555558',
  textMute:  '#999999',
  gold:      '#B8902A',
  goldDim:   'rgba(184,144,42,0.10)',
  green:     '#00A86B',
  greenDim:  'rgba(0,168,107,0.10)',
  red:       '#D93025',
  separator: '#E8E8ED',
};

export type ThemeTokens = typeof DARK_TOKENS;

// ── Context ───────────────────────────────────────────────────────────────────
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
