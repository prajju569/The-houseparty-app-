import React, { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
WebBrowser.maybeCompleteAuthSession();
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import { navigationRef } from './src/navigation/navigationRef';
import { supabase } from './src/services/supabaseClient';
import { useAuthStore } from './src/features/auth/authStore';
import * as Location from 'expo-location';
import { useLocationStore } from './src/store/locationStore';

export default function App() {
  const setSession = useAuthStore(s => s.setSession);
  const setProfile = useAuthStore(s => s.setProfile);
  const setLoading = useAuthStore(s => s.setLoading);
  const { setLocation, setPermission } = useLocationStore();

  // Request location permission once on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setPermission(false); return; }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude: lat, longitude: lng } = pos.coords;
        // Reverse-geocode to get area + city
        const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const area = geo?.district ?? geo?.subregion ?? geo?.city ?? '';
        const city = geo?.city ?? geo?.region ?? '';
        setLocation(lat, lng, area, city);
      } catch {
        setPermission(false);
      }
    })();
  }, []);

  useEffect(() => {
    let settled = false;
    function done() {
      if (!settled) { settled = true; setLoading(false); }
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) {
          supabase.from('profiles').select('*').eq('id', session.user.id).single()
            .then(({ data }) => { setProfile(data ?? null); done(); }, done);
        } else {
          done();
        }
      })
      .catch(done);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      try {
        if (session) {
          let { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          // Auto-create profile row if missing (e.g. first sign-in after signup)
          if (!data) {
            const username = session.user.email?.split('@')[0]?.replace(/[^a-z0-9_.]/gi, '').toLowerCase() ?? 'user';
            const { data: created } = await supabase
              .from('profiles')
              .insert({ id: session.user.id, email: session.user.email, username, display_name: username, role: 'guest' })
              .select()
              .single();
            data = created;
          }
          setProfile(data ?? null);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        done();
      }
    });

    // Safety net: never stay on splash longer than 5s
    const timeout = setTimeout(done, 5000);

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#090909' }}>
      <ThemeProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}