import 'react-native-gesture-handler';
import React from 'react';
import { useSession } from './src/hooks/useSession';
import AppNavigator from './src/navigation/AppNavigator';

function AppRoot() {
  // Boots the Supabase auth listener and syncs state into Zustand
  useSession();
  return <AppNavigator />;
}

export default function App() {
  return <AppRoot />;
}
