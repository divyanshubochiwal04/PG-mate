import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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

    // 2. Check physical device or simulator
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device for remote APNs/FCM tokens.');
    }

    // 3. Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission denied by user.');
      return null;
    }

    // 4. Retrieve Expo Push Token
    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync();
      token = tokenResponse.data;
    } catch (tokenErr) {
      console.warn('Could not fetch Expo Push Token:', tokenErr);
      return null;
    }

    // 5. Register with backend
    if (token) {
      const deviceType = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
      await registerPushTokenApi(token, deviceType);
      console.log(`[PUSH] Registered push token with backend: ${token.substring(0, 20)}...`);
    }
  } catch (error) {
    console.warn('Failed to initialize push notifications:', error);
  }

  return token;
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
