import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../auth/authStore';
import { fetchEventAttendees, type EventAttendee } from '../../../services/eventService';
import { computeVibeScore, scoreLabel, scoreRingColor } from '../../../services/vibeService';

type Props = { route: any; navigation: any };
type Scored = EventAttendee & { score: number | null };

export default function EventAttendeesScreen({ route, navigation }: Props) {
  const { eventId, eventTitle } = route.params as { eventId: string; eventTitle?: string };
  const { T, isDark } = useTheme();
  const { session, profile: me } = useAuthStore();
  const myId = session?.user?.id ?? null;
  const myHasTaste = !!(me?.top_genres?.length || me?.vibe_tags?.length || me?.top_artists?.length);

  const [rows,    setRows]    = useState<Scored[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const attendees = await fetchEventAttendees(eventId, myId ?? undefined);
      const scored: Scored[] = attendees.map(a => ({
        ...a,
        score: myHasTaste ? computeVibeScore(me!, a) : null,
      }));
      // Best vibe match first; unscored fall to the bottom.
      scored.sort((x, y) => (y.score ?? -1) - (x.score ?? -1));
      if (alive) { setRows(scored); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [eventId, myId, myHasTaste]);

  const s = makeStyles(T, isDark);

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.back}>
            <Feather name="arrow-left" size={20} color={T.textMute} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Who’s going</Text>
            {eventTitle ? <Text style={s.subtitle} numberOfLines={1}>{eventTitle}</Text> : null}
          </View>
        </View>

        {loading ? (
          <View style={s.empty}><ActivityIndicator color={T.accent} /></View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            renderItem={({ item }) => {
              const ring = item.score !== null ? scoreRingColor(item.score) : T.border;
              const label = item.score !== null ? scoreLabel(item.score) : null;
              return (
                <TouchableOpacity
                  style={s.row}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
                >
                  <View style={[s.avatarWrap, { borderColor: ring }]}>
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} style={s.avatar} />
                    ) : (
                      <View style={[s.avatar, s.avatarFallback]}>
                        <Text style={s.avatarInitials}>
                          {(item.display_name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={s.name}>{item.display_name}</Text>
                      {item.is_verified && <Feather name="check-circle" size={13} color="#3897F0" style={{ marginLeft: 5 }} />}
                    </View>
                    {item.username ? <Text style={s.username}>@{item.username}</Text> : null}
                  </View>
                  {label && <Text style={[s.score, { color: label.color }]}>{item.score}%</Text>}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Feather name="users" size={26} color={T.textMute} />
                <Text style={s.emptyText}>No confirmed guests yet — be the first to RSVP.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T: any, isDark: boolean) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: T.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
    back:   { padding: 4 },
    title:    { fontSize: 19, fontWeight: '700', color: T.text, letterSpacing: -0.4 },
    subtitle: { fontSize: 13, color: T.textMute, marginTop: 1 },

    list:   { paddingHorizontal: 16, paddingTop: 4 },
    row:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    avatarWrap: { borderRadius: 28, borderWidth: 2, padding: 2 },
    avatar: { width: 46, height: 46, borderRadius: 23 },
    avatarFallback: { backgroundColor: 'rgba(232,227,216,0.12)', alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { fontSize: 16, fontWeight: '700', color: T.accent },
    name:     { fontSize: 15, fontWeight: '600', color: T.text },
    username: { fontSize: 13, color: T.textMute, marginTop: 1 },
    score:    { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },

    empty:     { alignItems: 'center', gap: 10, paddingTop: 80 },
    emptyText: { color: T.textMute, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  });
}
