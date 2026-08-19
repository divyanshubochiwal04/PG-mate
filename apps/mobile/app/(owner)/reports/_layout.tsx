import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../../src/theme';

export default function ReportsLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="residents" />
      <Stack.Screen name="occupancy" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="mess" />
      <Stack.Screen name="expenses" />
    </Stack>
  );
}
