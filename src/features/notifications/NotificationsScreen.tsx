import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../features/auth/authStore';
import { supabase } from '../../services/supabaseClient';
import { getPendingRequests, acceptFollowRequest, declineFollowRequest, type FollowRequest } from '../../services/followService';

type AppNotification = {
  id: string;
  user_id: string;
  type: 'rsvp_approved' | 'rsvp_pending' | 'new_follower' | 'event_reminder' | 'review_received' | 'message';
  title: string;
  body: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
};

const TYPE_ICON: Record<AppNotification['type'], { icon: keyof typeof Feather.glyphMap; color: string }> = {
  rsvp_approved:   { icon: 'check-circle', color: '#00D37F' },
  rsvp_pending:    { icon: 'clock',        color: '#F59E0B' },
  new_follower:    { icon: 'user-plus',    color: '#5B8CFF' },
  event_reminder:  { icon: 'bell',         color: '#E8E3D8' },
  review_received: { icon: 'star',         color: '#F59E0B' },
  message:         { icon: 'message-circle', color: '#E8E3D8' },
};

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationsScreen({ navigation }: any) {
  const { T, isDark } = useTheme();
  const { session } = useAuthStore();
  const myId = session?.user?.id ?? null;

  const [notifs,       setNotifs]       = useState<AppNotification[]>([]);
  const [followReqs,   setFollowReqs]   = useState<FollowRequest[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const load = useCallback(async () => {
    if (!myId) { setLoading(false); return; }
    const [notifsRes, reqsRes] = await Promise.all([
      supabase.from('notifications').select('*').eq('user_id', myId).order('created_at', { ascending: false }).limit(50),
      getPendingRequests(myId),
    ]);
    setNotifs((notifsRes.data ?? []) as AppNotification[]);
    setFollowReqs(reqsRes);
    setLoading(false);
    setRefreshing(false);
  }, [myId]);

  useEffect(() => { load(); }, [load]);

  async function markAllRead() {
    if (!myId) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', myId).eq('read', false);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const unreadCount = notifs.filter(n => !n.read).length;

  const s = StyleSheet.create({
    root:   { flex: 1, backgroundColor: T.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: T.border,
    },
    titleRow: { gap: 2 },
    title:    { fontSize: 26, fontWeight: '700', color: T.text, letterSpacing: -0.6 },
    sub:      { fontSize: 13, color: T.textMute },
    markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
    markAllTx:  { fontSize: 12, fontWeight: '600', color: T.accent },

    row: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 14,
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    },
    rowUnread: { backgroundColor: isDark ? 'rgba(232,227,216,0.03)' : 'rgba(0,0,0,0.02)' },
    iconWrap:  { width: 42, height: 42, borderRadius: 21, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
    content:   { flex: 1, gap: 3 },
    notifTitle:{ fontSize: 14, fontWeight: '600', color: T.text, lineHeight: 20 },
    notifBody: { fontSize: 13, color: T.textMute, lineHeight: 18 },
    meta:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    time:      { fontSize: 11, color: T.textMute },
    unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.accent },

    loadBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
    emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' },
    emptyTitle:{ fontSize: 18, fontWeight: '700', color: T.text },
    emptyTx:   { fontSize: 14, color: T.textMute, textAlign: 'center', lineHeight: 22 },
  });

  function renderItem({ item: n }: { item: AppNotification }) {
    const meta = TYPE_ICON[n.type] ?? { icon: 'bell' as const, color: T.accent };
    return (
      <TouchableOpacity
        style={[s.row, !n.read && s.rowUnread]}
        onPress={() => { markRead(n.id); }}
        activeOpacity={0.8}
      >
        <View style={s.iconWrap}>
          <Feather name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={s.content}>
          <Text style={s.notifTitle}>{n.title}</Text>
          {!!n.body && <Text style={s.notifBody} numberOfLines={2}>{n.body}</Text>}
          <View style={s.meta}>
            {!n.read && <View style={s.unreadDot} />}
            <Text style={s.time}>{timeSince(n.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <SafeAreaView edges={['top']}>
        <View style={s.header}>
          <View style={s.titleRow}>
            <Text style={s.title}>Notifications</Text>
            {!loading && (
              <Text style={s.sub}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={s.markAllBtn} onPress={markAllRead} activeOpacity={0.8}>
              <Text style={s.markAllTx}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={s.loadBox}><ActivityIndicator color={T.accent} /></View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={n => n.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={T.accent} />
          }
          ListHeaderComponent={
            followReqs.length > 0 ? (
              <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
                <Text style={{ color: T.textMute, fontSize: 11, fontWeight: '700', letterSpacing: 1.3, marginBottom: 12 }}>FOLLOW REQUESTS</Text>
                {followReqs.map(req => {
                  const profile = req.profiles as any;
                  const name = profile?.display_name ?? profile?.username ?? 'Someone';
                  return (
                    <View key={req.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, backgroundColor: T.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: T.border }}>
                      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(232,227,216,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: T.accent, fontWeight: '700', fontSize: 16 }}>{name[0]?.toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: T.text, fontWeight: '600', fontSize: 14 }}>{name}</Text>
                        <Text style={{ color: T.textMute, fontSize: 12, marginTop: 1 }}>wants to follow you</Text>
                      </View>
                      <TouchableOpacity
                        style={{ backgroundColor: '#E8E3D8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 7, marginRight: 6 }}
                        onPress={async () => {
                          await acceptFollowRequest(req.id, req.requester_id, req.target_id);
                          setFollowReqs(prev => prev.filter(r => r.id !== req.id));
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: '#090909', fontWeight: '700', fontSize: 12 }}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: T.border }}
                        onPress={async () => {
                          await declineFollowRequest(req.id);
                          setFollowReqs(prev => prev.filter(r => r.id !== req.id));
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: T.textMute, fontWeight: '600', fontSize: 12 }}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <View style={s.emptyIcon}><Feather name="bell" size={28} color={T.textMute} /></View>
              <Text style={s.emptyTitle}>Nothing yet</Text>
              <Text style={s.emptyTx}>When hosts approve your RSVPs, you follow new people, or parties are updated — you'll see it here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
