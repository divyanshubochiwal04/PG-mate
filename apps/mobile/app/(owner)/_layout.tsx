import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Loading } from '../../src/components/ui/Loading';
import { GlobalHeader } from '../../src/components/common/GlobalHeader';
import { colors, radius, shadows, spacing } from '../../src/design-system';
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from '../../src/features/notifications/services/push.manager';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={20} color={focused ? colors.primary : colors.textMuted} />
    </View>
  );
}

export default function OwnerLayout(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync();
      const cleanupListener = setupNotificationListeners((route) => {
        if (route) {
          router.push(route as never);
        }
      });
      return cleanupListener;
    }
  }, [isAuthenticated, router]);


  if (isLoading) {
    return <Loading message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Loading message="Redirecting to login..." />;
  }

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: true,
        header: () => <GlobalHeader />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {/* ── 5 PRIMARY TABS ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Home',
        }}
      />

      <Tabs.Screen
        name="residents"
        options={{
          title: 'Residents',
          headerShown: false,
          tabBarLabel: 'Residents',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Residents',
        }}
      />

      <Tabs.Screen
        name="billing"
        options={{
          title: 'Billing',
          headerShown: false,
          tabBarLabel: 'Billing',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'card' : 'card-outline'} focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Billing',
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Operations',
          headerShown: false,
          tabBarLabel: 'Operations',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Operations',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'More',
          headerShown: false,
          tabBarLabel: 'More',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'menu' : 'menu-outline'} focused={focused} />
          ),
          tabBarAccessibilityLabel: 'More',
        }}
      />

      {/* ── HIDDEN SUB-ROUTE SCREENS ── */}
      <Tabs.Screen name="search" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="properties" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="reports" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="config" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="mess" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="notifications" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="tasks" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 60,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    ...shadows.sm,
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primaryLight,
  },
});
