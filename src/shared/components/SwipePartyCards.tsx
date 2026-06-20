import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Dimensions, Animated,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const { width: W } = Dimensions.get('window');
const CARD_W = W * 0.74;
const CARD_H = 240;
const SPACING = 14;
const SNAP = CARD_W + SPACING;

export function SwipePartyCards({ events, navigation }: { events: any[]; navigation: any }) {
  const { T } = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<Animated.LegacyRef<any>>(null);
  const [current, setCurrent] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const s = StyleSheet.create({
    wrap: { marginBottom: 8 },

    card: {
      width: CARD_W,
      height: CARD_H + 100,
      backgroundColor: T.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: T.border,
      overflow: 'hidden',
    },

    img: { width: '100%', height: CARD_H, position: 'absolute', top: 0 },
    imgOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, height: CARD_H,
      backgroundColor: 'rgba(0,0,0,0.38)',
    },

    verifiedBadge: {
      position: 'absolute', top: 12, left: 12,
      backgroundColor: 'rgba(0,211,127,0.2)', borderRadius: 8,
      paddingHorizontal: 9, paddingVertical: 4,
      borderWidth: 1, borderColor: 'rgba(0,211,127,0.4)',
    },
    verifiedBadgeText: { color: '#00D37F', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

    closedBadge: {
      position: 'absolute', top: 12, left: 12,
      backgroundColor: 'rgba(255,90,90,0.2)', borderRadius: 8,
      paddingHorizontal: 9, paddingVertical: 4,
      borderWidth: 1, borderColor: 'rgba(255,90,90,0.4)',
    },
    closedBadgeText: { color: '#FF5A5A', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

    titleOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: CARD_H,
      justifyContent: 'flex-end',
      padding: 14,
      backgroundColor: 'transparent',
    },
    dateStr: { color: T.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
    title:   { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 5 },
    areaRow: { flexDirection: 'row', gap: 10 },
    area:    { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    metro:   { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

    infoBar: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: T.card,
      paddingHorizontal: 14, paddingVertical: 12, gap: 8,
      top: CARD_H,
    },

    hostRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
    hostAvatar:{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)' },
    hostName:  { flex: 1, color: T.textSub, fontSize: 12 },
    hostRating:{ color: T.gold, fontSize: 12, fontWeight: '700' },

    pillRow: { flexDirection: 'row', gap: 7 },
    feePill: {
      backgroundColor: T.goldDim, borderRadius: 7,
      paddingHorizontal: 8, paddingVertical: 3,
      borderWidth: 1, borderColor: 'rgba(232,227,216,0.22)',
    },
    feeText: { color: T.gold, fontSize: 11, fontWeight: '700' },
    spotPill: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
    spotOpen: { backgroundColor: T.greenDim, borderColor: 'rgba(0,211,127,0.3)' },
    spotFull: { backgroundColor: 'rgba(255,90,90,0.1)', borderColor: 'rgba(255,90,90,0.3)' },
    spotClosed: { backgroundColor: 'rgba(255,90,90,0.1)', borderColor: 'rgba(255,90,90,0.3)' },
    spotText:       { fontSize: 11, fontWeight: '600' },
    spotTextOpen:   { color: T.green },
    spotTextFull:   { color: '#FF5A5A' },
    spotTextClosed: { color: '#FF5A5A' },
    agePill: {
      backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 7,
      paddingHorizontal: 8, paddingVertical: 3,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    },
    ageText: { color: T.textSub, fontSize: 11 },

    amenityRow: { flexDirection: 'row', gap: 5 },
    amenityIcon: { fontSize: 14 },

    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
    dot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.09)',
    },
    dotActive: {
      width: 20, backgroundColor: T.gold, borderRadius: 3,
    },
  });

  function startAuto() {
    stopAuto();
    autoRef.current = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % events.length;
        (scrollRef.current as any)?.scrollTo({ x: next * SNAP, animated: true });
        return next;
      });
    }, 5000);
  }
  function stopAuto() {
    if (autoRef.current) clearInterval(autoRef.current);
  }

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [events.length]);

  return (
    <View style={s.wrap}>
      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: (W - CARD_W) / 2, gap: SPACING }}
        scrollEventThrottle={16}
        onScrollBeginDrag={stopAuto}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP);
          setCurrent(Math.max(0, Math.min(idx, events.length - 1)));
          startAuto();
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
      >
        {events.map((event, i) => {
          const range = [(i - 1) * SNAP, i * SNAP, (i + 1) * SNAP];

          const rotateY = scrollX.interpolate({
            inputRange: range, outputRange: ['28deg', '0deg', '-28deg'], extrapolate: 'clamp',
          });
          const scale = scrollX.interpolate({
            inputRange: range, outputRange: [0.86, 1, 0.86], extrapolate: 'clamp',
          });
          const translateY = scrollX.interpolate({
            inputRange: range, outputRange: [22, 0, 22], extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange: range, outputRange: [0.55, 1, 0.55], extrapolate: 'clamp',
          });

          const d       = new Date(event.date);
          const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          const isClosed = event.status === 'closed';

          return (
            <Animated.View
              key={event.id}
              style={[
                s.card,
                {
                  opacity,
                  transform: [
                    { perspective: 900 },
                    { rotateY },
                    { scale },
                    { translateY },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                style={{ flex: 1 }}
                onPress={() => navigation.navigate(
                  isClosed ? 'ClosedEvent' : 'EventDetail', { eventId: event.id }
                )}
              >
                <Image source={{ uri: event.coverImage }} style={s.img} resizeMode="cover" />
                <View style={s.imgOverlay} />

                {isClosed ? (
                  <View style={s.closedBadge}><Text style={s.closedBadgeText}>CLOSED · Rate it</Text></View>
                ) : (
                  event.host.verified && (
                    <View style={s.verifiedBadge}><Text style={s.verifiedBadgeText}>✓ VERIFIED</Text></View>
                  )
                )}

                <View style={s.titleOverlay}>
                  <Text style={s.dateStr}>{dateStr.toUpperCase()} · {timeStr}</Text>
                  <Text style={s.title} numberOfLines={1}>{event.title}</Text>
                  <View style={s.areaRow}>
                    <Text style={s.area}>📍 {event.area}</Text>
                    <Text style={s.metro}>🚇 {event.metroDistance}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={s.infoBar}>
                <View style={s.hostRow}>
                  <Image source={{ uri: event.host.avatar }} style={s.hostAvatar} />
                  <Text style={s.hostName}>{event.host.name}</Text>
                  <Text style={s.hostRating}>★ {event.host.rating}</Text>
                </View>

                <View style={s.pillRow}>
                  <View style={s.feePill}>
                    <Text style={s.feeText}>{event.fee === 0 ? 'Free' : `₹${event.fee}`}</Text>
                  </View>
                  <View style={[
                    s.spotPill,
                    event.spotsLeft === 0 ? s.spotFull : s.spotOpen,
                    isClosed && s.spotClosed,
                  ]}>
                    <Text style={[
                      s.spotText,
                      event.spotsLeft === 0 ? s.spotTextFull : s.spotTextOpen,
                      isClosed && s.spotTextClosed,
                    ]}>
                      {isClosed ? 'Ended' : event.spotsLeft === 0 ? 'Full' : `${event.spotsLeft} spots`}
                    </Text>
                  </View>
                  <View style={s.agePill}>
                    <Text style={s.ageText}>{event.ageMin}–{event.ageMax}</Text>
                  </View>
                </View>

                <View style={s.amenityRow}>
                  {[
                    event.alcohol  && '🍻',
                    event.food     && '🍕',
                    event.pets     && '🐾',
                    event.smoking  && '🚬',
                    event.ac       && '❄️',
                    event.wifi     && '📶',
                  ].filter(Boolean).map((icon, k) => (
                    <Text key={k} style={s.amenityIcon}>{icon as string}</Text>
                  ))}
                </View>
              </View>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      <View style={s.dots}>
        {events.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              stopAuto();
              (scrollRef.current as any)?.scrollTo({ x: i * SNAP, animated: true });
              setCurrent(i);
              startAuto();
            }}
          >
            <Animated.View style={[s.dot, i === current && s.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
