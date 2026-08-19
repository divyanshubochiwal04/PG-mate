import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { TaskActivityDto } from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import {
  useCancelTask,
  useCompleteTask,
  useReopenTask,
  useStartTask,
  useTask,
  useTaskActivities,
} from '../../../src/features/tasks/hooks/useTasks';
import { getErrorMessage } from '../../../src/api/error';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function TaskDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: task, isLoading, error, refetch } = useTask(id as string);
  const { data: activities } = useTaskActivities(id as string);

  const startTaskMutation = useStartTask();
  const completeTaskMutation = useCompleteTask();
  const cancelTaskMutation = useCancelTask();
  const reopenTaskMutation = useReopenTask();

  if (isLoading) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.loadingWrap}>
          <SkeletonLoader height={140} style={{ marginBottom: spacing.md }} />
          <SkeletonLoader height={100} style={{ marginBottom: spacing.md }} />
          <SkeletonLoader height={180} style={{ marginBottom: spacing.md }} />
        </View>
      </Screen>
    );
  }

  if (error || !task) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.content}>
          <ErrorState
            title="Failed to load task"
            error={error}
            onRetry={refetch}
          />
          <Button
            title="Back to Tasks"
            variant="outline"
            onPress={() => router.back()}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </Screen>
    );
  }

  const handleStart = async () => {
    try {
      await startTaskMutation.mutateAsync(task.id);
      refetch();
    } catch (err: unknown) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to start task'));
    }
  };

  const handleComplete = async () => {
    try {
      await completeTaskMutation.mutateAsync(task.id);
      refetch();
    } catch (err: unknown) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to complete task'));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelTaskMutation.mutateAsync(task.id);
      refetch();
    } catch (err: unknown) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to cancel task'));
    }
  };

  const handleReopen = async () => {
    try {
      await reopenTaskMutation.mutateAsync(task.id);
      refetch();
    } catch (err: unknown) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to reopen task'));
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Task Header Details Card */}
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={typography.h2}>{task.title}</Text>
              <Text style={styles.taskCode}>ID: {task.id.slice(0, 8)}</Text>
            </View>
            <StatusBadge status={task.status} label={task.status.replace('_', ' ')} />
          </View>

          {Boolean(task.description) && (
            <Text style={styles.descriptionText}>{task.description}</Text>
          )}

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Priority</Text>
              <StatusBadge
                status={task.priority === 'CRITICAL' ? 'DANGER' : task.priority === 'HIGH' ? 'WARNING' : 'INFO'}
                label={task.priority}
              />
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.detailValue}>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {new Date(task.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Operational Actions */}
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>TASK ACTIONS</Text>
          <View style={styles.actionsGrid}>
            {task.status === 'TODO' && (
              <Button
                title="Start Task"
                loading={startTaskMutation.isPending}
                onPress={handleStart}
                style={{ flex: 1 }}
              />
            )}
            {task.status === 'IN_PROGRESS' && (
              <Button
                title="Complete Task"
                icon={<Ionicons name="checkmark-outline" size={16} color={colors.surface} />}
                loading={completeTaskMutation.isPending}
                onPress={handleComplete}
                style={{ flex: 1 }}
              />
            )}
            {['TODO', 'IN_PROGRESS'].includes(task.status) && (
              <Button
                title="Cancel Task"
                variant="danger"
                loading={cancelTaskMutation.isPending}
                onPress={handleCancel}
                style={{ flex: 1 }}
              />
            )}
            {['COMPLETED', 'CANCELLED'].includes(task.status) && (
              <Button
                title="Reopen Task"
                variant="outline"
                loading={reopenTaskMutation.isPending}
                onPress={handleReopen}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </Card>

        {/* Activity Audit Log */}
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>ACTIVITY AUDIT TRAIL</Text>
          {!activities || activities.length === 0 ? (
            <Text style={styles.emptyText}>No activity logged yet.</Text>
          ) : (
            activities.map((act: TaskActivityDto) => (
              <View key={act.id} style={styles.activityRow}>
                <View style={styles.activityBullet} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityAction}>{act.action.replace('_', ' ')}</Text>
                  {Boolean(act.note) && (
                    <Text style={styles.activityDetails}>{act.note}</Text>
                  )}
                  <Text style={styles.activityTime}>
                    {new Date(act.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        <Button
          title="Back to Task List"
          variant="outline"
          icon={<Ionicons name="arrow-back-outline" size={16} color={colors.primary} />}
          onPress={() => router.back()}
          style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  loadingWrap: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  taskCode: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  activityAction: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
  activityDetails: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
