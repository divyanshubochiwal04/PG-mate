import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { NotificationDto, NotificationSeverity } from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../../../src/features/notifications/hooks/useNotifications';
import { useCreateTask } from '../../../src/features/tasks/hooks/useTasks';
import { colors, radius, spacing, typography } from '../../../src/design-system';

type FilterTab = 'ALL' | 'UNREAD' | 'TASKS' | 'CRITICAL' | 'WARNING' | 'INFO';

export default function NotificationCenterScreen(): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const queryParams = {
    status: activeTab === 'UNREAD' ? ('UNREAD' as const) : undefined,
    severity:
      activeTab === 'CRITICAL' || activeTab === 'WARNING' || activeTab === 'INFO'
        ? (activeTab as NotificationSeverity)
        : undefined,
  };

  const { data, isLoading, refetch, isRefetching } = useNotifications(queryParams);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleNotificationPress = async (notification: NotificationDto) => {
    if (notification.status === 'UNREAD') {
      try {
        await markReadMutation.mutateAsync(notification.id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    if (notification.actionRoute) {
      router.push(notification.actionRoute as never);
    }
  };

  const formatRelativeTime = (isoString: string): string => {
    const diffMs = new Date().getTime() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const allNotifications: NotificationDto[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? (data as any)
    : [];
  const notifications =
    activeTab === 'TASKS'
      ? allNotifications.filter(
          (n) => n.type === 'TASK_OVERDUE' || n.type === 'TASK_CRITICAL' || n.entityType === 'TASK'
        )
      : allNotifications;

  const unreadCount = typeof data?.unreadCount === 'number' ? data.unreadCount : 0;

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h2}>Notifications & Reminders</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0 ? `${unreadCount} unread operational alerts & reminders` : 'All alerts and task reminders caught up'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <Button
              title="Mark All Read"
              variant="outline"
              size="small"
              icon={<Ionicons name="checkmark-done-outline" size={14} color={colors.primary} />}
              loading={markAllReadMutation.isPending}
              onPress={() => markAllReadMutation.mutate()}
            />
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {(['ALL', 'UNREAD', 'TASKS', 'CRITICAL', 'WARNING', 'INFO'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="button"
            >
              <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification List */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={80} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={80} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={80} style={{ marginBottom: spacing.sm }} />
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title="No Notifications"
            description="You are all caught up! No operational alerts or task reminders in this category."
          />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isUnread = item.status === 'UNREAD';
              const isTaskReminder =
                item.type === 'TASK_OVERDUE' ||
                item.type === 'TASK_CRITICAL' ||
                item.entityType === 'TASK';

              return (
                <TouchableOpacity
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.7}
                >
                  <Card style={[styles.notifCard, isUnread && styles.notifUnreadCard]}>
                    <View style={styles.notifHeader}>
                      <View style={styles.notifBadgeGroup}>
                        {isTaskReminder && (
                          <View style={styles.taskBadge}>
                            <Ionicons name="clipboard" size={11} color="#2563EB" />
                            <Text style={styles.taskBadgeText}>TASK REMINDER</Text>
                          </View>
                        )}
                        <StatusBadge
                          status={
                            item.severity === 'CRITICAL'
                              ? 'DANGER'
                              : item.severity === 'WARNING'
                              ? 'WARNING'
                              : item.severity === 'SUCCESS'
                              ? 'SUCCESS'
                              : 'INFO'
                          }
                          label={item.severity}
                        />
                        <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
                      </View>
                      {isUnread && <View style={styles.unreadDot} />}
                    </View>

                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifMessage}>{item.message}</Text>

                    {/* Operational Action Buttons */}
                    <View style={styles.notifFooter}>
                      {Boolean(item.actionRoute) && (
                        <View style={styles.routeAction}>
                          <Text style={styles.actionRouteText}>
                            {isTaskReminder ? 'Open Task →' : 'Open Details'}
                          </Text>
                          <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                        </View>
                      )}
                      {isUnread && (
                        <TouchableOpacity
                          onPress={() => markReadMutation.mutate(item.id)}
                          style={styles.markReadBtn}
                        >
                          <Ionicons name="checkmark-circle-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.markReadText}>Mark read</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  tabChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  tabChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tabChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  loadingWrap: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  notifCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  notifUnreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.surface,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notifBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notifTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  notifMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  notifFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  routeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionRouteText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markReadText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginRight: 4,
  },
  taskBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
  },
});
