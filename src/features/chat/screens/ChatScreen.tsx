import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Image, KeyboardAvoidingView, Platform, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HOSTS, INITIAL_MESSAGES, ChatMessage } from '../../../data/fakeData';

const T = {
  bg: '#0C0C0C', card: '#161616', elevated: '#1E1E1E',
  border: '#2A2A2A', gold: '#C9A84C', green: '#00D37F',
  text: '#F0F0EE', textSub: '#A0A09A', textMute: '#5A5A56',
};

const HOST = HOSTS[0];

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      ).start();
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: T.textMute,
    marginHorizontal: 2,
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

export default function ChatScreen({ navigation }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function send() {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const newMsg: ChatMessage = { id: `m${Date.now()}`, from: 'me', text: input.trim(), time };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        'Got it! See you there 🎉',
        'Of course! Any other questions?',
        'Noted! The party starts at 9 PM sharp 🕘',
        'Happy to help! DM me anytime 🙌',
      ];
      const reply: ChatMessage = {
        id: `m${Date.now() + 1}`,
        from: 'host',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
      setMessages(prev => [...prev, reply]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1400);
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <Image source={{ uri: HOST.avatar }} style={s.hostAvatar} />
          <View style={s.headerInfo}>
            <Text style={s.hostName}>{HOST.name}</Text>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.onlineText}>Online · Host</Text>
            </View>
          </View>
          <View style={s.verifiedBadge}>
            <Text style={s.verifiedText}>✓ Verified</Text>
          </View>
        </View>

        {/* Event context pill */}
        <View style={s.contextPill}>
          <Text style={s.contextText}>🎟️  Retro Bollywood Night · Jun 20</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            style={s.messages}
            contentContainerStyle={s.messagesContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, idx) => {
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showAvatar = msg.from === 'host' && (!prevMsg || prevMsg.from !== 'host');
              return (
                <View
                  key={msg.id}
                  style={[s.bubble, msg.from === 'me' ? s.myBubble : s.hostBubble]}
                >
                  {msg.from === 'host' && (
                    <Image
                      source={{ uri: HOST.avatar }}
                      style={[s.bubbleAvatar, !showAvatar && s.avatarHidden]}
                    />
                  )}
                  <View style={[s.bubbleBody, msg.from === 'me' ? s.myBody : s.hostBody]}>
                    <Text style={[s.bubbleText, msg.from === 'me' && s.myText]}>{msg.text}</Text>
                    <Text style={[s.bubbleTime, msg.from === 'me' && s.myTimeText]}>{msg.time}</Text>
                  </View>
                </View>
              );
            })}
            {isTyping && (
              <View style={[s.bubble, s.hostBubble]}>
                <Image source={{ uri: HOST.avatar }} style={s.bubbleAvatar} />
                <View style={[s.bubbleBody, s.hostBody]}>
                  <TypingDots />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input bar */}
          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message Aryan..."
              placeholderTextColor={T.textMute}
              onSubmitEditing={send}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, !input.trim() && s.sendBtnDisabled]}
              onPress={send}
              activeOpacity={0.8}
            >
              <Text style={s.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border, gap: 10,
  },
  back: { padding: 4 },
  backIcon: { color: T.text, fontSize: 32, lineHeight: 32, fontWeight: '300' },
  hostAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.elevated },
  headerInfo: { flex: 1 },
  hostName: { color: T.text, fontSize: 16, fontWeight: '700' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.green },
  onlineText: { color: T.textSub, fontSize: 12 },
  verifiedBadge: {
    backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  verifiedText: { color: T.gold, fontSize: 11, fontWeight: '600' },

  contextPill: {
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: T.elevated, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: T.border, alignSelf: 'flex-start',
  },
  contextText: { color: T.textSub, fontSize: 12 },

  messages: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingBottom: 12, gap: 12 },

  bubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  myBubble: { justifyContent: 'flex-end' },
  hostBubble: { justifyContent: 'flex-start' },

  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.elevated },
  avatarHidden: { opacity: 0 },

  bubbleBody: {
    maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  hostBody: { backgroundColor: T.card, borderWidth: 1, borderColor: T.border },
  myBody: { backgroundColor: T.gold },

  bubbleText: { color: T.text, fontSize: 14, lineHeight: 20 },
  myText: { color: '#000' },
  bubbleTime: { color: T.textMute, fontSize: 10, marginTop: 4 },
  myTimeText: { color: 'rgba(0,0,0,0.5)' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: T.border,
    backgroundColor: T.card,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: T.elevated, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    color: T.text, fontSize: 14,
    borderWidth: 1, borderColor: T.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: '#000', fontSize: 20, fontWeight: '700' },
});
