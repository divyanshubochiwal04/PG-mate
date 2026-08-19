import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationQueryDto } from '@m-square/contracts';
import {
  dismissNotificationApi,
  generateNotificationsApi,
  getNotificationApi,
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  markNotificationUnreadApi,
  resolveNotificationApi,
} from '../api/notifications.api';

export function useNotifications(query?: NotificationQueryDto) {
  return useQuery({
    queryKey: ['notifications', query],
    queryFn: () => getNotificationsApi(query),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getUnreadNotificationCountApi(),
    refetchInterval: 30000,
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: () => getNotificationApi(id),
    enabled: Boolean(id),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationReadApi(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification', id] });
    },
  });
}

export function useMarkNotificationUnread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationUnreadApi(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification', id] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsReadApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useResolveNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resolveNotificationApi(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification', id] });
    },
  });
}

export function useDismissNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dismissNotificationApi(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification', id] });
    },
  });
}

export function useGenerateNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateNotificationsApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
