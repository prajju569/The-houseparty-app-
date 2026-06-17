import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import { useAuthStore } from '../features/auth/authStore';
import type { Profile } from '../shared/types';

export const BYPASS_PROFILE_KEY = '@hp_bypass_profile';

export function useSession() {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        // No real session — load a locally-persisted bypass profile so
        // profile edits survive restarts even with BYPASS_AUTH = true
        AsyncStorage.getItem(BYPASS_PROFILE_KEY).then(raw => {
          if (raw) setProfile(JSON.parse(raw) as Profile);
          setLoading(false);
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        AsyncStorage.getItem(BYPASS_PROFILE_KEY).then(raw => {
          setProfile(raw ? JSON.parse(raw) as Profile : null);
          setLoading(false);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data as Profile | null);
    setLoading(false);
  }
}
