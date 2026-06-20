import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../../shared/types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  appMode: 'GUEST' | 'HOST';
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setAppMode: (mode: 'GUEST' | 'HOST') => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: false,
  appMode: 'GUEST',
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setAppMode: (appMode) => set({ appMode }),
  reset: () => set({ session: null, profile: null, isLoading: false, appMode: 'GUEST' }),
}));
