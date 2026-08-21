import { apiClient } from '../../../api/client';
import type {
  NotificationDto,
  NotificationListResponseDto,
  NotificationQueryDto,
} from '@m-square/contracts';

export async function getNotificationsApi(
  query?: NotificationQueryDto
): Promise<NotificationListResponseDto> {
  const response = await apiClient.get<{ data: NotificationListResponseDto }>('/notifications', {
    params: query,
  });
  return response.data?.data ?? response.data;
}

export async function getUnreadNotificationCountApi(): Promise<{ count: number }> {
  const response = await apiClient.get<{ data: { count: number } }>('/notifications/unread-count');
  return response.data?.data ?? response.data;
}

export async function getNotificationApi(id: string): Promise<NotificationDto> {
  const response = await apiClient.get<{ data: NotificationDto }>(`/notifications/${id}`);
  return response.data?.data ?? response.data;
}

export async function markNotificationReadApi(id: string): Promise<NotificationDto> {
  const response = await apiClient.patch<{ data: NotificationDto }>(`/notifications/${id}/read`);
  return response.data?.data ?? response.data;
}

export async function markNotificationUnreadApi(id: string): Promise<NotificationDto> {
  const response = await apiClient.patch<{ data: NotificationDto }>(`/notifications/${id}/unread`);
  return response.data?.data ?? response.data;
}

export async function markAllNotificationsReadApi(): Promise<{ updatedCount: number }> {
  const response = await apiClient.patch<{ data: { updatedCount: number } }>('/notifications/read-all');
  return response.data?.data ?? response.data;
}

export async function resolveNotificationApi(id: string): Promise<NotificationDto> {
  const response = await apiClient.patch<{ data: NotificationDto }>(`/notifications/${id}/resolve`);
  return response.data?.data ?? response.data;
}

export async function dismissNotificationApi(id: string): Promise<NotificationDto> {
  const response = await apiClient.patch<{ data: NotificationDto }>(`/notifications/${id}/dismiss`);
  return response.data?.data ?? response.data;
}

export async function generateNotificationsApi(): Promise<{ generatedCount: number; resolvedCount: number }> {
  const response = await apiClient.post<{ data: { generatedCount: number; resolvedCount: number } }>('/notifications/generate');
  return response.data?.data ?? response.data;
}

export async function registerPushTokenApi(
  pushToken: string,
  deviceType: 'ANDROID' | 'IOS' | 'WEB' | 'UNKNOWN' = 'ANDROID'
): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ data: { success: boolean } }>('/notifications/push-token', {
    pushToken,
    deviceType,
  });
  return response.data?.data ?? response.data;
}


