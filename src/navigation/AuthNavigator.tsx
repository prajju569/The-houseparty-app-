import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../features/auth/screens/OnboardingScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import SetupUsernameScreen from '../features/auth/screens/SetupUsernameScreen';
import SetupDOBScreen from '../features/auth/screens/SetupDOBScreen';
import SetupGenderScreen from '../features/auth/screens/SetupGenderScreen';
import PhoneAuthScreen from '../features/auth/screens/PhoneAuthScreen';

export type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: { role?: 'guest' | 'host' };
  PhoneAuth: undefined;
  SetupUsername: { role: 'guest' | 'host' };
  SetupDOB: { role: 'guest' | 'host'; username: string };
  SetupGender: { role: 'guest' | 'host'; username: string; dob: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator({ initialRoute = 'Onboarding' }: { initialRoute?: keyof AuthStackParamList }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Onboarding"    component={OnboardingScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="SignIn"        component={LoginScreen} />
      <Stack.Screen name="SignUp"        component={RegisterScreen} />
      <Stack.Screen name="PhoneAuth"     component={PhoneAuthScreen} />
      <Stack.Screen name="SetupUsername" component={SetupUsernameScreen} />
      <Stack.Screen name="SetupDOB"      component={SetupDOBScreen} />
      <Stack.Screen name="SetupGender"   component={SetupGenderScreen} />
    </Stack.Navigator>
  );
}
