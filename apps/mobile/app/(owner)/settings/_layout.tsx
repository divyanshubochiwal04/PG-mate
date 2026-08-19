import React from 'react';
import { Stack } from 'expo-router';

export default function SettingsLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="organization" />
      <Stack.Screen name="properties" />
      <Stack.Screen name="facilities" />
      <Stack.Screen name="mess-config" />
      <Stack.Screen name="billing-config" />
      <Stack.Screen name="account" />
      <Stack.Screen name="org-profile" />
    </Stack>
  );
}
