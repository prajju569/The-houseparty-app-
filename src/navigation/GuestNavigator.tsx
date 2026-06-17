import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GuestDashboardScreen from '../features/parties/screens/GuestDashboardScreen';
import DiscoverScreen from '../features/parties/screens/DiscoverScreen';
import EventDetailScreen from '../features/parties/screens/EventDetailScreen';
import ClosedEventScreen from '../features/parties/screens/ClosedEventScreen';
import GalleryScreen from '../features/parties/screens/GalleryScreen';
import ChatScreen from '../features/chat/screens/ChatScreen';
import SavedScreen from '../features/saved/screens/SavedScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import NearbyHostsScreen from '../features/parties/screens/NearbyHostsScreen';
import EditProfileScreen from '../features/profile/screens/EditProfileScreen';

export type GuestStackParamList = {
  Home: undefined;
  Discover: undefined;
  Saved: undefined;
  Profile: undefined;
  EditProfile: undefined;
  NearbyHosts: undefined;
  EventDetail: { eventId: string; alreadyRsvped?: boolean };
  ClosedEvent: { eventId: string };
  Gallery: { eventId?: string };
  Chat: { hostId?: string };
};

const Stack = createNativeStackNavigator<GuestStackParamList>();

export default function GuestNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0C0C0C' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home"        component={GuestDashboardScreen} />
      <Stack.Screen name="Discover"    component={DiscoverScreen} />
      <Stack.Screen name="Saved"       component={SavedScreen} />
      <Stack.Screen name="Profile"     component={ProfileScreen} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="ClosedEvent" component={ClosedEventScreen} />
      <Stack.Screen name="Gallery"     component={GalleryScreen} />
      <Stack.Screen
        name="NearbyHosts"
        component={NearbyHostsScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
