import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GuestDashboardScreen from '../features/parties/screens/GuestDashboardScreen';
import DiscoverScreen from '../features/parties/screens/DiscoverScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';

export type GuestTabParamList = {
  Home: undefined;
  Discover: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<GuestTabParamList>();

export default function GuestNavigator() {
  return (
    // tabBar hidden — GuestDashboardScreen renders its own premium nav bar
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tab.Screen name="Home"     component={GuestDashboardScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}
