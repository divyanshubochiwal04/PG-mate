import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Loading } from '../../src/components/ui/Loading';
import { colors } from '../../src/theme/colors';

export default function OwnerLayout(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <Loading message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Loading message="Redirecting to login..." />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Properties',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="residents"
        options={{
          title: 'Residents',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
