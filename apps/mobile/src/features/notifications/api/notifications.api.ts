import { apiClient } from '../../../api/client';
import type {
  NotificationDto,
  NotificationListResponseDto,
  NotificationQueryDto,
} from '@m-square/contracts';

export async function getNotificationsApi(
  query?: NotificationQueryDto
): Promise<NotificationListResponseDto> {
  const response = await apiClient.get<NotificationListResponseDto>('/notifications', {
    params: query,
  });
  return response.data;
}

export async function getUnreadNotificationCountApi(): Promise<{ count: number }> {
  const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return response.data;
}

export async function getNotificationApi(id: string): Promise<NotificationDto> {
  const response = await apiClient.get<NotificationDto>(`/notifications/${id}`);
  return response.data;
}

export async function markNotificationReadApi(id: string): Promise<NotificationDto> {
  const response = await apiClient.patch<NotificationDto>(`/notifications/${id}/read`);
  return response.data;
}

export async function markNotificationUnreadApi(id: string): Promise<NotificationDto> {
  const response = await apiClient.patch<NotificationDto>(`/notifications/${id}/unread`);
  return response.data;
}

export async function markAllNotificationsReadApi(): Promise<{ updatedCount: number }> {
  const response = await apiClient.patch<{ updatedCount: number }>('/notifications/read-all');
  return response.data;
}

export async function resolveNotificationApi(id: string): Promise<NotificationDto> {
  const response = await apiClient.patch<NotificationDto>(`/notifications/${id}/resolve`);
  return response.data;
}

export async function dismissNotificationApi(id: string): Promise<NotificationDto> {
  const response = await apiClient.patch<NotificationDto>(`/notifications/${id}/dismiss`);
  return response.data;
}

export async function generateNotificationsApi(): Promise<{ generatedCount: number; resolvedCount: number }> {
  const response = await apiClient.post<{ generatedCount: number; resolvedCount: number }>('/notifications/generate');
  return response.data;
}
