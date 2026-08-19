import React from 'react';
import { Stack } from 'expo-router';

export default function ResidentsLayout(): React.JSX.Element {
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
      <Stack.Screen name="register" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="transfer-[id]" />
    </Stack>
  );
}
