import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface BottomNavProps {
  appMode: 'GUEST' | 'HOST';
  currentRoute: string;
  onNavigate: (route: string) => void;
}

type GuestTab = { route: string; icon: keyof typeof Feather.glyphMap };
type HostTab  = { route: string; icon: keyof typeof Feather.glyphMap; isCenter?: boolean };

const GUEST_TABS: GuestTab[] = [
  { route: 'Home',        icon: 'home'     },
  { route: 'Discover',    icon: 'compass'  },
  { route: 'Saved',       icon: 'bookmark' },
  { route: 'NearbyHosts', icon: 'users'    },
  { route: 'Profile',     icon: 'user'     },
];

const HOST_TABS: HostTab[] = [
  { route: 'Dashboard',   icon: 'grid'           },
  { route: 'Analytics',   icon: 'bar-chart-2'    },
  { route: 'CreateEvent', icon: 'plus',  isCenter: true },
  { route: 'Messages',    icon: 'message-circle' },
  { route: 'Profile',     icon: 'user'           },
];

export default function BottomNav({ appMode, currentRoute, onNavigate }: BottomNavProps) {
  const { T, isDark } = useTheme();
  const isGuest = appMode === 'GUEST';
  const tabs = isGuest ? GUEST_TABS : HOST_TABS;

  const ACTIVE   = T.accent;
  const INACTIVE = T.textMute;
  const DOCK_BG  = isDark ? 'rgba(18,18,20,0.82)' : 'rgba(240,238,234,0.88)';
  const BORDER   = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={s.wrap} pointerEvents="box-none">
      <View style={[s.dock, { backgroundColor: DOCK_BG, borderColor: BORDER }]}>
        {tabs.map(tab => {
          const isActive  = currentRoute === tab.route;
          const isCenter  = (tab as HostTab).isCenter;

          return (
            <TouchableOpacity
              key={tab.route}
              onPress={() => onNavigate(tab.route)}
              activeOpacity={0.7}
              style={isCenter ? s.centerBtn : s.tab}
            >
              {isCenter ? (
                <View style={[s.centerInner, { backgroundColor: T.accent }]}>
                  <Feather name={tab.icon} size={22} color={T.onAccent} />
                </View>
              ) : (
                <View style={s.tabInner}>
                  <Feather
                    name={tab.icon}
                    size={22}
                    color={isActive ? ACTIVE : INACTIVE}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {isActive && <View style={[s.activeDot, { backgroundColor: ACTIVE }]} />}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },

  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 36,
    borderWidth: 1,
    gap: 4,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24 },
      android: { elevation: 20 },
    }),
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },

  tabInner: {
    alignItems: 'center',
    gap: 4,
  },

  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  centerBtn: {
    marginHorizontal: 4,
  },

  centerInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
