import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

const T = {
  card: '#161616', border: '#2A2A2A', gold: '#C9A84C',
  textMute: '#5A5A56',
};

const NAV_ITEMS = [
  { icon: '⊞', label: 'Home',    screen: 'Home' },
  { icon: '◎', label: 'Explore', screen: 'Discover' },
  { icon: '★', label: 'Saved',   screen: 'Saved' },
  { icon: '◯', label: 'Profile', screen: 'Profile' },
];

export function BottomNav({ navigation, active }: { navigation: any; active: string }) {
  return (
    <View style={s.navBar}>
      {NAV_ITEMS.slice(0, 2).map(item => (
        <TouchableOpacity
          key={item.label} style={s.navItem} activeOpacity={0.7}
          onPress={() => active !== item.screen && navigation.navigate(item.screen)}
        >
          <Text style={[s.navIcon, active === item.screen && s.navActive]}>{item.icon}</Text>
          <Text style={[s.navLabel, active === item.screen && s.navActiveLbl]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
      <View style={s.navCenter}>
        <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('NearbyHosts')} activeOpacity={0.8}>
          <Text style={s.createIcon}>＋</Text>
        </TouchableOpacity>
      </View>
      {NAV_ITEMS.slice(2).map(item => (
        <TouchableOpacity
          key={item.label} style={s.navItem} activeOpacity={0.7}
          onPress={() => active !== item.screen && navigation.navigate(item.screen)}
        >
          <Text style={[s.navIcon, active === item.screen && s.navActive]}>{item.icon}</Text>
          <Text style={[s.navLabel, active === item.screen && s.navActiveLbl]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.border,
    paddingBottom: Platform.OS === 'android' ? 8 : 24,
    paddingTop: 8, paddingHorizontal: 8,
    ...(Platform.OS === 'android' ? { elevation: 24 } : {
      shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.4, shadowRadius: 16,
    }),
  },
  navItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  navIcon: { fontSize: 20, color: T.textMute },
  navLabel: { fontSize: 10, color: T.textMute, fontWeight: '500' },
  navActive: { color: T.gold },
  navActiveLbl: { color: T.gold },
  navCenter: { width: 64, alignItems: 'center' },
  createBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    ...(Platform.OS === 'android' ? { elevation: 8 } : {
      shadowColor: T.gold, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5, shadowRadius: 10,
    }),
  },
  createIcon: { color: '#000', fontSize: 24, lineHeight: 28, fontWeight: '700' },
});
