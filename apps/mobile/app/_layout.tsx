import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/auth/auth.context';
import { PropertyProvider } from '../src/context/property-context';
import { queryClient } from '../src/config/query-client';

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PropertyProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right',
                fullScreenGestureEnabled: true,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(owner)" />
            </Stack>
          </PropertyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
