import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HostDashboardScreen from '../features/parties/screens/HostDashboardScreen';
import DiscoverScreen from '../features/parties/screens/DiscoverScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';

export type HostTabParamList = {
  Dashboard: undefined;
  Discover: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<HostTabParamList>();

export default function HostNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={HostDashboardScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
