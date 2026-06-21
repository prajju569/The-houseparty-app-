import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, Image,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../auth/authStore';
import { searchUsers, type PublicProfile } from '../../../services/profileService';

type Props = { navigation: any };

export default function PeopleSearchScreen({ navigation }: Props) {
  const { T, isDark } = useTheme();
  const { session } = useAuthStore();
  const myId = session?.user?.id ?? null;

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounce the query so we don't fire a request per keystroke.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    const handle = setTimeout(async () => {
      const rows = await searchUsers(q, myId ?? undefined);
      setResults(rows);
      setSearched(true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, myId]);

  const s = makeStyles(T, isDark);

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.back}>
            <Feather name="arrow-left" size={20} color={T.textMute} />
          </TouchableOpacity>
          <View style={s.searchBox}>
            <Feather name="search" size={16} color={T.textMute} style={{ marginLeft: 12 }} />
            <TextInput
              style={s.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Search people by name or @username"
              placeholderTextColor={T.textMute}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={16} color={T.textMute} style={{ marginRight: 12 }} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={results}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.row}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
            >
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Text style={s.avatarInitials}>
                    {(item.display_name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={s.name}>{item.display_name}</Text>
                  {item.is_verified && <Feather name="check-circle" size={13} color="#3897F0" style={{ marginLeft: 5 }} />}
                </View>
                {item.username ? <Text style={s.username}>@{item.username}</Text> : null}
              </View>
              {item.role === 'host' && <Text style={s.hostTag}>HOST</Text>}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            loading ? (
              <View style={s.empty}><ActivityIndicator color={T.accent} /></View>
            ) : searched ? (
              <View style={s.empty}>
                <Feather name="users" size={26} color={T.textMute} />
                <Text style={s.emptyText}>No people found for “{query.trim()}”.</Text>
              </View>
            ) : (
              <View style={s.empty}>
                <Feather name="search" size={26} color={T.textMute} />
                <Text style={s.emptyText}>Find friends by their name or @username.</Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T: any, isDark: boolean) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: T.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    back:   { padding: 4 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
    input:  { flex: 1, height: '100%', paddingHorizontal: 10, color: T.text, fontSize: 15 },

    list:   { paddingHorizontal: 16, paddingTop: 8 },
    row:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
    avatar: { width: 46, height: 46, borderRadius: 23 },
    avatarFallback: { backgroundColor: 'rgba(232,227,216,0.12)', alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { fontSize: 16, fontWeight: '700', color: T.accent },
    name:     { fontSize: 15, fontWeight: '600', color: T.text },
    username: { fontSize: 13, color: T.textMute, marginTop: 1 },
    hostTag:  { fontSize: 10, fontWeight: '700', color: T.accent, letterSpacing: 1 },

    empty:     { alignItems: 'center', gap: 10, paddingTop: 80 },
    emptyText: { color: T.textMute, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  });
}
