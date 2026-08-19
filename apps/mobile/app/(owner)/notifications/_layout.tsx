import React from 'react';
import { Stack } from 'expo-router';

export default function NotificationsLayout(): React.JSX.Element {
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
    </Stack>
  );
}
