import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RSVPStep1Screen from './RSVPStep1Screen';
import RSVPStep2Screen from './RSVPStep2Screen';
import RSVPStep3Screen from './RSVPStep3Screen';
import RSVPStep4Screen from './RSVPStep4Screen';
import RSVPStep5Screen from './RSVPStep5Screen';

export type RSVPStackParamList = {
  RSVPStep1: { eventId: string };
  RSVPStep2: { eventId: string; guestCount: number };
  RSVPStep3: { eventId: string; guestCount: number };
  RSVPStep4: { eventId: string; guestCount: number; paymentMethod: string };
  RSVPStep5: { eventId: string; guestCount: number; bookingRef?: string; bookingId?: string; paymentMethod?: string };
};

const Stack = createNativeStackNavigator<RSVPStackParamList>();

export default function RSVPNavigator({ route }: any) {
  const { eventId } = route.params ?? {};
  return (
    <Stack.Navigator
      initialRouteName="RSVPStep1"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#090909' },
      }}
    >
      <Stack.Screen name="RSVPStep1" component={RSVPStep1Screen} initialParams={{ eventId }} />
      <Stack.Screen name="RSVPStep2" component={RSVPStep2Screen} />
      <Stack.Screen name="RSVPStep3" component={RSVPStep3Screen} />
      <Stack.Screen name="RSVPStep4" component={RSVPStep4Screen} />
      <Stack.Screen name="RSVPStep5" component={RSVPStep5Screen} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
