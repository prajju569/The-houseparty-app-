import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HostDashboardScreen from '../features/parties/screens/HostDashboardScreen';
import CreateStep1Screen   from '../features/parties/screens/create/CreateStep1Screen';
import CreateStep2Screen   from '../features/parties/screens/create/CreateStep2Screen';
import CreateStep3Screen   from '../features/parties/screens/create/CreateStep3Screen';
import CreateStep4Screen   from '../features/parties/screens/create/CreateStep4Screen';
import CreateStep5Screen   from '../features/parties/screens/create/CreateStep5Screen';
import ProfileScreen         from '../features/profile/screens/ProfileScreen';
import DiscoverScreen        from '../features/parties/screens/DiscoverScreen';
import EventDetailScreen     from '../features/parties/screens/EventDetailScreen';
import ManageGuestsScreen    from '../features/parties/screens/ManageGuestsScreen';
import HostProfileScreen     from '../features/parties/screens/HostProfileScreen';
import ChatScreen           from '../features/chat/screens/ChatScreen';
import ConversationsScreen  from '../features/chat/screens/ConversationsScreen';
import ScanTicketScreen     from '../features/parties/screens/ScanTicketScreen';
import EditPlaylistScreen   from '../features/parties/screens/EditPlaylistScreen';

const Stack = createNativeStackNavigator();

export default function HostNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Dashboard"   component={HostDashboardScreen} />
      <Stack.Screen name="CreateEvent" component={CreateStep1Screen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="CreateStep2" component={CreateStep2Screen} />
      <Stack.Screen name="CreateStep3" component={CreateStep3Screen} />
      <Stack.Screen name="CreateStep4" component={CreateStep4Screen} />
      <Stack.Screen name="CreateStep5" component={CreateStep5Screen} />
      <Stack.Screen name="ManageGuests" component={ManageGuestsScreen} />
      <Stack.Screen name="Discover"    component={DiscoverScreen} />
      <Stack.Screen name="Profile"     component={ProfileScreen} />
      <Stack.Screen name="HostProfile" component={HostProfileScreen} />
      <Stack.Screen name="EventDetail"    component={EventDetailScreen} />
      <Stack.Screen name="Chat"           component={ChatScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Conversations"  component={ConversationsScreen} />
      <Stack.Screen name="ScanTicket"     component={ScanTicketScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="EditPlaylist"   component={EditPlaylistScreen} />
    </Stack.Navigator>
  );
}
