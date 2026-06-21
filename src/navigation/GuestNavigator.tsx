import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
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
import RSVPNavigator from '../features/parties/screens/rsvp/RSVPNavigator';
import HostProfileScreen from '../features/parties/screens/HostProfileScreen';
import ConversationsScreen from '../features/chat/screens/ConversationsScreen';
import NotificationsScreen from '../features/notifications/NotificationsScreen';
import SettingsScreen from '../features/settings/SettingsScreen';
import EditPlaylistScreen from '../features/parties/screens/EditPlaylistScreen';
import UserProfileScreen from '../features/profile/screens/UserProfileScreen';
import PeopleSearchScreen from '../features/people/screens/PeopleSearchScreen';
import EventAttendeesScreen from '../features/parties/screens/EventAttendeesScreen';

export type GuestStackParamList = {
  Home: undefined;
  Discover: undefined;
  Saved: undefined;
  Profile: undefined;
  EditProfile: undefined;
  NearbyHosts: undefined;
  EventDetail: { eventId: string; alreadyRsvped?: boolean; bookingRef?: string; bookingId?: string };
  ClosedEvent: { eventId: string };
  Gallery: { eventId?: string };
  Chat: { hostId?: string };
  RSVPFlow: { eventId: string };
  HostProfile: { hostId: string };
  Conversations: undefined;
  Notifications: undefined;
  Settings: undefined;
  EditPlaylist: { eventId: string; playlistUrl?: string | null; tracks?: any[] };
  UserProfile: { userId: string };
  PeopleSearch: undefined;
  EventAttendees: { eventId: string; eventTitle?: string };
};

const Stack = createNativeStackNavigator<GuestStackParamList>();

export default function GuestNavigator({ initialRoute = 'Home' }: { initialRoute?: keyof GuestStackParamList }) {
  const { T } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: T.bg },
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
      <Stack.Screen
        name="RSVPFlow"
        component={RSVPNavigator}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="HostProfile"    component={HostProfileScreen} />
      <Stack.Screen name="Conversations"  component={ConversationsScreen} />
      <Stack.Screen name="Notifications"  component={NotificationsScreen} />
      <Stack.Screen name="Settings"       component={SettingsScreen} />
      <Stack.Screen name="EditPlaylist"   component={EditPlaylistScreen} />
      <Stack.Screen name="UserProfile"    component={UserProfileScreen} />
      <Stack.Screen name="PeopleSearch"   component={PeopleSearchScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="EventAttendees" component={EventAttendeesScreen} />
    </Stack.Navigator>
  );
}
