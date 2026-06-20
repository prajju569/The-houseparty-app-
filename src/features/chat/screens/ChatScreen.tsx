import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
  StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../../features/auth/authStore';
import {
  sendMessage, fetchConversation, subscribeToConversation,
  type Message,
} from '../../../services/messageService';
import { supabase } from '../../../services/supabaseClient';

function TypingDots() {
  const { T } = useTheme();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    dots.forEach((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 200),
        ])
      ).start()
    );
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 }}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={{
          width: 7, height: 7, borderRadius: 3.5,
          backgroundColor: T.textMute, marginHorizontal: 2,
          opacity: dot,
          transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
        }} />
      ))}
    </View>
  );
}

function AvatarCircle({ name, size = 28 }: { name: string; size?: number }) {
  const { T } = useTheme();
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(232,227,216,0.15)', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: T.accent }}>{initials}</Text>
    </View>
  );
}

type OtherProfile = { id: string; display_name: string; avatar_url: string | null };

export default function ChatScreen({ navigation, route }: any) {
  const { T, isDark } = useTheme();
  const { session } = useAuthStore();
  const myId = session?.user?.id ?? null;

  const otherId: string | undefined = route?.params?.hostId ?? route?.params?.userId;

  const [messages,   setMessages]   = useState<Message[]>([]);
  const [other,      setOther]      = useState<OtherProfile | null>(null);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [sending,    setSending]    = useState(false);
  const [typing,     setTyping]     = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Load other user's profile
  useEffect(() => {
    if (!otherId) return;
    supabase.from('profiles').select('id, display_name, avatar_url').eq('id', otherId).single()
      .then(({ data }) => setOther(data as OtherProfile | null));
  }, [otherId]);

  // Load message history
  const loadMessages = useCallback(async () => {
    if (!myId || !otherId) { setLoading(false); return; }
    try {
      const data = await fetchConversation(myId, otherId);
      setMessages(data);
    } catch {
      // leave messages empty on error
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 80);
    }
  }, [myId, otherId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!myId || !otherId) return;
    const unsub = subscribeToConversation(myId, otherId, (msg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    });
    return () => { unsub(); };
  }, [myId, otherId]);

  async function handleSend() {
    if (!input.trim() || !myId || !otherId || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const sent = await sendMessage(myId, otherId, text);
    if (sent) {
      setMessages(prev => [...prev, sent]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    }
    setSending(false);
  }

  const CHAT_HEADER = isDark ? 'rgba(20,20,21,0.90)' : 'rgba(246,244,239,0.95)';
  const CHAT_SENT   = isDark ? 'rgba(232,227,216,0.92)' : 'rgba(42,36,32,0.88)';

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    headerWrap: {
      backgroundColor: CHAT_HEADER,
      borderBottomWidth: 1, borderBottomColor: T.border,
      ...Platform.select({
        ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
        android: { elevation: 8 },
      }),
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { padding: 4 },
    otherName: { color: T.text, fontSize: 16, fontWeight: '600', flex: 1 },
    kav:  { flex: 1 },
    messages: { flex: 1 },
    messagesContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 8, paddingBottom: 24 },
    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    rowLeft:   { justifyContent: 'flex-start' },
    rowRight:  { justifyContent: 'flex-end' },
    bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    recvBubble: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderBottomLeftRadius: 4 },
    sentBubble: { backgroundColor: CHAT_SENT, borderBottomRightRadius: 4 },
    bubbleText: { color: T.text, fontSize: 14, lineHeight: 20 },
    sentText:   { color: isDark ? '#090909' : '#F4F2EC' },
    bubbleTime: { color: T.textMute, fontSize: 10, marginTop: 4 },
    sentTime:   { color: isDark ? 'rgba(9,9,9,0.45)' : 'rgba(244,242,236,0.55)' },
    composerWrap: {
      borderTopWidth: 1, borderTopColor: T.border,
      backgroundColor: isDark ? 'rgba(13,13,14,0.92)' : 'rgba(246,244,239,0.95)',
      paddingTop: 10,
    },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
    composerInput: {
      flex: 1, minHeight: 46, maxHeight: 100,
      backgroundColor: T.surface, borderRadius: 23, paddingHorizontal: 18, paddingVertical: 12,
      color: T.text, fontSize: 14, borderWidth: 1, borderColor: T.border,
    },
    sendBtn: {
      width: 46, height: 46, borderRadius: 23, backgroundColor: T.accent,
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        ios:     { shadowColor: T.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
        android: { elevation: 6 },
      }),
    },
    sendBtnOff: { opacity: 0.35 },

    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' },
    emptyTx:   { color: T.textMute, fontSize: 14, textAlign: 'center' },

    noUserBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
    noUserTx:  { color: T.textMute, fontSize: 15, textAlign: 'center' },
  });

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  if (!otherId || !myId) {
    return (
      <View style={[s.root, s.noUserBox]}>
        <Feather name="message-circle" size={32} color={T.textMute} />
        <Text style={s.noUserTx}>Select a conversation to start chatting.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={{ color: T.accent, fontSize: 15, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <SafeAreaView style={s.headerWrap} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={T.text} />
          </TouchableOpacity>
          <AvatarCircle name={other?.display_name ?? '?'} size={36} />
          <Text style={s.otherName} numberOfLines={1}>
            {other?.display_name ?? 'Loading…'}
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={s.emptyBox}>
            <ActivityIndicator color={T.accent} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={s.messages}
            contentContainerStyle={[s.messagesContent, messages.length === 0 && { flex: 1 }]}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={s.emptyBox}>
                <View style={s.emptyIcon}>
                  <Feather name="message-circle" size={24} color={T.textMute} />
                </View>
                <Text style={s.emptyTx}>
                  No messages yet.{'\n'}Say hi to {other?.display_name ?? 'them'}!
                </Text>
              </View>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_id === myId;
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id === myId);
                return (
                  <View key={msg.id} style={[s.bubbleRow, isMe ? s.rowRight : s.rowLeft]}>
                    {!isMe && (
                      <View style={{ opacity: showAvatar ? 1 : 0 }}>
                        <AvatarCircle name={other?.display_name ?? '?'} size={28} />
                      </View>
                    )}
                    <View style={[s.bubble, isMe ? s.sentBubble : s.recvBubble]}>
                      <Text style={[s.bubbleText, isMe && s.sentText]}>{msg.content}</Text>
                      <Text style={[s.bubbleTime, isMe && s.sentTime]}>{fmtTime(msg.created_at)}</Text>
                    </View>
                  </View>
                );
              })
            )}
            {typing && (
              <View style={[s.bubbleRow, s.rowLeft]}>
                <AvatarCircle name={other?.display_name ?? '?'} size={28} />
                <View style={[s.bubble, s.recvBubble]}>
                  <TypingDots />
                </View>
              </View>
            )}
          </ScrollView>
        )}

        <SafeAreaView edges={['bottom']} style={s.composerWrap}>
          <View style={s.composer}>
            <TextInput
              style={s.composerInput}
              value={input}
              onChangeText={setInput}
              placeholder={`Message ${other?.display_name ?? ''}…`}
              placeholderTextColor={T.textMute}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnOff]}
              onPress={handleSend}
              activeOpacity={0.8}
              disabled={!input.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#090909" />
                : <Feather name="arrow-up" size={20} color="#090909" />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
