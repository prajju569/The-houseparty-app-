import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../../features/auth/authStore';
import { fetchConversations, type ConversationPreview } from '../../../services/messageService';

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function AvatarCircle({ name }: { name: string }) {
  const { T } = useTheme();
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  return (
    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(232,227,216,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,227,216,0.12)' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: T.accent }}>{initials}</Text>
    </View>
  );
}

export default function ConversationsScreen({ navigation }: any) {
  const { T, isDark } = useTheme();
  const { session } = useAuthStore();
  const myId = session?.user?.id ?? null;

  const [convs,      setConvs]      = useState<ConversationPreview[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!myId) { setLoading(false); return; }
    const data = await fetchConversations(myId);
    setConvs(data);
    setLoading(false);
    setRefreshing(false);
  }, [myId]);

  useEffect(() => { load(); }, [load]);

  const s = StyleSheet.create({
    root:   { flex: 1, backgroundColor: T.bg },
    header: {
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: T.border,
    },
    title: { fontSize: 26, fontWeight: '700', color: T.text, letterSpacing: -0.6 },
    sub:   { fontSize: 13, color: T.textMute, marginTop: 3 },

    row: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    },
    nameRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
    name:       { fontSize: 15, fontWeight: '600', color: T.text },
    nameUnread: { fontWeight: '700' },
    preview:    { fontSize: 13, color: T.textMute, numberOfLines: 1 } as any,
    previewUnread: { color: T.textSub ?? T.text } as any,
    time:       { fontSize: 11, color: T.textMute },
    badge:      { backgroundColor: T.accent, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
    badgeTx:    { fontSize: 11, fontWeight: '700', color: '#090909' },

    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyBox:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
    emptyIcon:  { width: 64, height: 64, borderRadius: 32, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: T.text, textAlign: 'center' },
    emptyTx:    { fontSize: 14, color: T.textMute, textAlign: 'center', lineHeight: 22 },
  });

  function renderConv({ item: c }: { item: ConversationPreview }) {
    const hasUnread = c.unread_count > 0;
    return (
      <TouchableOpacity
        style={s.row}
        onPress={() => navigation.navigate('Chat', { hostId: c.other_id })}
        activeOpacity={0.8}
      >
        <AvatarCircle name={c.other_display_name} />
        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={[s.name, hasUnread && s.nameUnread]}>{c.other_display_name}</Text>
            <Text style={s.time}>{timeSince(c.last_message_at)}</Text>
          </View>
          <Text style={[s.preview, hasUnread && s.previewUnread]} numberOfLines={1}>
            {c.last_message}
          </Text>
        </View>
        {hasUnread && (
          <View style={s.badge}>
            <Text style={s.badgeTx}>{c.unread_count > 9 ? '9+' : c.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>Messages</Text>
          {!loading && <Text style={s.sub}>{convs.length} conversation{convs.length !== 1 ? 's' : ''}</Text>}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={T.accent} />
        </View>
      ) : convs.length === 0 ? (
        <View style={s.emptyBox}>
          <View style={s.emptyIcon}>
            <Feather name="message-circle" size={28} color={T.textMute} />
          </View>
          <Text style={s.emptyTitle}>No messages yet</Text>
          <Text style={s.emptyTx}>Follow a host and start a conversation with them from their profile.</Text>
        </View>
      ) : (
        <FlatList
          data={convs}
          keyExtractor={c => c.other_id}
          renderItem={renderConv}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={T.accent}
            />
          }
        />
      )}
    </View>
  );
}
