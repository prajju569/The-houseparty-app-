import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import { fetchNearbyHosts, type NearbyHost, followUser, unfollowUser } from '../../../services/followService';
import { useLocationStore } from '../../../store/locationStore';
import { useAuthStore } from '../../../features/auth/authStore';
import { supabase } from '../../../services/supabaseClient';

export default function NearbyHostsScreen({ navigation }: any) {
  const { T } = useTheme();
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? null;
  const { lat, lng } = useLocationStore();
  const [hosts,     setHosts]     = useState<NearbyHost[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (lat && lng) {
        const nearby = await fetchNearbyHosts(lat, lng, 15);
        setHosts(nearby);
      } else {
        // Fallback: all hosts (no GPS)
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, bio')
          .eq('role', 'host')
          .limit(20);
        const hostsWithMeta = await Promise.all(
          (data ?? []).map(async (h: any) => {
            const { count } = await supabase.from('events').select('id', { count: 'exact', head: true }).eq('host_id', h.id);
            return { ...h, event_count: count ?? 0, distance_km: 0 };
          })
        );
        setHosts(hostsWithMeta);
      }
      setLoading(false);
    }
    load();
  }, [lat, lng]);

  const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: T.bg },
    content: { paddingHorizontal: 20, paddingTop: 8 },

    header:  { marginBottom: 20 },
    title:   { color: T.text, fontSize: 26, fontWeight: '600', letterSpacing: -0.7 },
    sub:     { color: T.textMute, fontSize: 14, fontWeight: '500', marginTop: 4 },

    card: {
      backgroundColor: T.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: T.border,
      padding: 18,
      marginBottom: 14,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      marginBottom: 14,
    },
    avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.06)' },
    name:   { color: T.text, fontSize: 16, fontWeight: '600' },
    meta:   { color: T.textMute, fontSize: 12, fontWeight: '500', marginTop: 4 },

    followBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    followBtnActive: {
      backgroundColor: 'rgba(232,227,216,0.92)',
      borderColor: 'transparent',
    },
    followText:       { color: T.text,      fontSize: 12, fontWeight: '600' },
    followTextActive: { color: T.onAccent,  fontSize: 12, fontWeight: '600' },

    photosRow: { flexDirection: 'row', gap: 8 },
    photo:     { flex: 1, height: 64, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)' },
  });

  async function toggle(id: string) {
    if (!userId) return;
    const isNow = following.has(id);
    setFollowing(prev => {
      const next = new Set(prev);
      isNow ? next.delete(id) : next.add(id);
      return next;
    });
    if (isNow) {
      await unfollowUser(userId, id);
    } else {
      await followUser(userId, id);
    }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <View style={s.header}>
            <Text style={s.title}>Hosts near you</Text>
            <Text style={s.sub}>People throwing the best rooms</Text>
          </View>

          {loading && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ActivityIndicator color={T.accent} />
            </View>
          )}

          {!loading && hosts.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ color: T.textMute, fontSize: 15 }}>No hosts nearby yet</Text>
            </View>
          )}

          {hosts.map(host => {
            const isFollowing = following.has(host.id);
            const initial = (host.display_name ?? host.username ?? '?')[0]?.toUpperCase();
            return (
              <TouchableOpacity
                key={host.id}
                style={s.card}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('HostProfile', { hostId: host.id })}
              >
                <View style={s.cardRow}>
                  {host.avatar_url
                    ? <Image source={{ uri: host.avatar_url }} style={s.avatar} />
                    : <View style={[s.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,227,216,0.12)' }]}>
                        <Text style={{ color: T.accent, fontSize: 20, fontWeight: '700' }}>{initial}</Text>
                      </View>}
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{host.display_name ?? host.username}</Text>
                    <Text style={s.meta}>
                      {host.event_count} {host.event_count === 1 ? 'party' : 'parties'} hosted
                      {host.distance_km > 0 ? ` · ${host.distance_km} km away` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[s.followBtn, isFollowing && s.followBtnActive]}
                    onPress={() => toggle(host.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.followText, isFollowing && s.followTextActive]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={s.photosRow}>
                  {[0, 1, 2].map(i => (
                    <View key={i} style={[s.photo, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

    </View>
  );
}
