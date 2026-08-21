import { Injectable, Logger } from '@nestjs/common';
import { dbService, KyselyNotificationRepository } from '@m-square/database';
import type { PushNotificationPayloadDto } from '@m-square/contracts';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly db = dbService.db;
  private readonly notificationRepo = new KyselyNotificationRepository(this.db);
  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  /**
   * Dispatches a push notification to all active devices in an organization.
   */
  public async sendToOrganization(
    organizationId: string,
    payload: PushNotificationPayloadDto
  ): Promise<void> {
    try {
      const tokens = await this.notificationRepo.getPushTokensForOrganization(organizationId);
      if (!tokens || tokens.length === 0) {
        return;
      }
      await this.sendToTokens(tokens, payload);
    } catch (err) {
      this.logger.warn(`Failed to dispatch organization push notification: ${err}`);
    }
  }

  /**
   * Dispatches a push notification to a specific user's registered devices.
   */
  public async sendToUser(
    userId: string,
    payload: PushNotificationPayloadDto
  ): Promise<void> {
    try {
      const tokens = await this.notificationRepo.getPushTokensForUser(userId);
      if (!tokens || tokens.length === 0) {
        return;
      }
      await this.sendToTokens(tokens, payload);
    } catch (err) {
      this.logger.warn(`Failed to dispatch user push notification: ${err}`);
    }
  }

  /**
   * Internal helper to send push notifications via Expo Push API
   */
  public async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayloadDto
  ): Promise<void> {
    const validTokens = tokens.filter(
      (t) => typeof t === 'string' && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))
    );

    if (validTokens.length === 0) {
      return;
    }

    const messages = validTokens.map((token) => ({
      to: token,
      sound: payload.sound || 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      badge: payload.badge,
      channelId: payload.channelId || 'default',
      priority: 'high',
    }));

    try {
      const response = await fetch(this.expoPushUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      this.logger.log(`Expo Push Notification sent to ${validTokens.length} device(s). Status: ${response.status}`);
    } catch (err: any) {
      this.logger.error(`Error sending push notification via Expo API: ${err.message}`, err.stack);
    }
  }
}

