import React from 'react';
import { Stack } from 'expo-router';

export default function BillingLayout(): React.JSX.Element {
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
      <Stack.Screen name="invoices/[id]" />
    </Stack>
  );
}
