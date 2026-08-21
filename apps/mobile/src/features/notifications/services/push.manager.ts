import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { registerPushTokenApi } from '../api/notifications.api';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Checks if current runtime is the standard Expo Go sandbox app
 */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Registers device for push notifications and sends token to backend
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  try {
    // 1. Android specific channel configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'PG.mate Alerts & Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // 2. Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PUSH] Push notification permission not granted.');
      return null;
    }

    // 3. In Expo Go (SDK 53+), remote FCM push tokens are disabled in the shared store client.
    // Remote push tokens work in Standalone APKs & Development Builds.
    if (isExpoGo) {
      console.log(
        '[PUSH] Running in Expo Go. System push tokens will activate in standalone APK builds.'
      );
      return null;
    }

    // 4. Retrieve Expo Push Token for Standalone APK / Dev Build
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = tokenResponse.data;
    } catch (tokenErr) {
      console.log('[PUSH] Could not fetch remote push token:', tokenErr);
      return null;
    }

    // 5. Register token with backend
    if (token) {
      const deviceType =
        Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
      await registerPushTokenApi(token, deviceType);
      console.log(`[PUSH] Registered push token: ${token.substring(0, 20)}...`);
    }
  } catch (error) {
    console.log('[PUSH] Notification initialization note:', error);
  }

  return token;
}

/**
 * Triggers an immediate local in-app/system notification (works in both Expo Go & APK)
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // show immediately
    });
  } catch (err) {
    console.warn('Failed to show local notification:', err);
  }
}

/**

 * Attaches a listener for when a user clicks on a notification in status bar / lockscreen
 */
export function setupNotificationListeners(
  onNavigate: (route: string) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const data = response.notification.request.content.data;
      if (data && typeof data.actionRoute === 'string' && data.actionRoute.trim()) {
        onNavigate(data.actionRoute.trim());
      }
    } catch (err) {
      console.warn('Error handling notification click navigation:', err);
    }
  });

  return () => {
    subscription.remove();
  };
}
