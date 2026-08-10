import React from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/auth.context';
import { queryClient } from '@/config/query-client';

export default function RootLayout(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(owner)" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
