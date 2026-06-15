import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DiscoverScreen from '../features/parties/screens/DiscoverScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';

export type GuestTabParamList = {
  Discover: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<GuestTabParamList>();

export default function GuestNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
