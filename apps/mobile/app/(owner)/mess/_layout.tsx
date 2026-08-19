import React from 'react';
import { Stack } from 'expo-router';

export default function MessLayout(): React.JSX.Element {
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
      <Stack.Screen name="menu" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="procurement" />
      <Stack.Screen name="expenses" />
    </Stack>
  );
}
