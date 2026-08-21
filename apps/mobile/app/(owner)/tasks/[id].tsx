import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { TaskActivityDto, TaskPriority, UpdateTaskDto } from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
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
  useUpdateTask,
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
  const updateTaskMutation = useUpdateTask();

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('MEDIUM');

  const openEditModal = () => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditPriority(task.priority);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Validation Error', 'Task title cannot be empty.');
      return;
    }
    if (!task) return;

    const updatePayload: UpdateTaskDto = {
      title: editTitle.trim(),
      priority: editPriority,
    };
    if (editDescription.trim()) {
      updatePayload.description = editDescription.trim();
    }

    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: updatePayload,
      });
      setIsEditModalOpen(false);
      refetch();
      Alert.alert('Success', 'Task updated successfully.');
    } catch (err: unknown) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to update task'));
    }
  };

  const handleShare = async () => {
    if (!task) return;
    const text =
      `📋 *PG.mate Operational Task Update*\n\n` +
      `📌 *Task*: ${task.title}\n` +
      `⚡ *Priority*: ${task.priority}\n` +
      `📊 *Status*: ${task.status.replace('_', ' ')}\n` +
      (task.dueDate ? `📅 *Due Date*: ${new Date(task.dueDate).toLocaleDateString()}\n` : '') +
      (task.description ? `📝 *Details*: ${task.description}\n` : '') +
      `\n🏢 PG.mate Smart Co-Living Operations`;

    try {
      await Share.share({ message: text });
    } catch {
      // Ignored
    }
  };

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

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            <View style={styles.descBox}>
              <Text style={styles.descriptionText}>{task.description}</Text>
            </View>
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
              <Text style={[styles.detailValue, isOverdue && styles.overdueDateText]}>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'None'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {new Date(task.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          </View>

          {/* Quick Edit and Share Toolbar */}
          <View style={styles.metaActionRow}>
            <TouchableOpacity style={styles.iconActionBtn} onPress={openEditModal}>
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={styles.iconActionText}>Edit Task</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconActionBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={16} color={colors.primary} />
              <Text style={styles.iconActionText}>Share Update</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Operational Actions */}
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>TASK WORKFLOW ACTIONS</Text>
          <View style={styles.actionsGrid}>
            {task.status === 'TODO' && (
              <Button
                title="Start Working"
                icon={<Ionicons name="play-outline" size={16} color={colors.surface} />}
                loading={startTaskMutation.isPending}
                onPress={handleStart}
                style={{ flex: 1 }}
              />
            )}
            {task.status === 'IN_PROGRESS' && (
              <Button
                title="Mark Completed"
                icon={<Ionicons name="checkmark-done" size={16} color={colors.surface} />}
                loading={completeTaskMutation.isPending}
                onPress={handleComplete}
                style={{ flex: 1 }}
              />
            )}
            {['TODO', 'IN_PROGRESS'].includes(task.status) && (
              <Button
                title="Cancel"
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
                icon={<Ionicons name="refresh" size={16} color={colors.primary} />}
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
          title="Back to Task Center"
          variant="outline"
          icon={<Ionicons name="arrow-back-outline" size={16} color={colors.primary} />}
          onPress={() => router.back()}
          style={{ marginTop: spacing.xs, marginBottom: spacing.xl }}
        />
      </ScrollView>

      {/* Edit Task Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={typography.h3}>Edit Task Details</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              label="Task Title *"
              value={editTitle}
              onChangeText={setEditTitle}
            />

            <TextInput
              label="Description"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.priorityLabel}>Priority</Text>
            <View style={styles.priorityGrid}>
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => {
                const isSelected = editPriority === p;
                const pColor =
                  p === 'CRITICAL'
                    ? colors.danger
                    : p === 'HIGH'
                    ? '#EA580C'
                    : p === 'MEDIUM'
                    ? colors.primary
                    : colors.textSecondary;

                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.pChip,
                      isSelected && { backgroundColor: pColor, borderColor: pColor },
                    ]}
                    onPress={() => setEditPriority(p)}
                  >
                    <Text style={[styles.pChipText, isSelected && { color: '#FFFFFF' }]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setIsEditModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Changes"
                loading={updateTaskMutation.isPending}
                onPress={handleSaveEdit}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: spacing.md,
  },
  loadingWrap: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  taskCode: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  descBox: {
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  descriptionText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  overdueDateText: {
    color: colors.danger,
  },
  metaActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  iconActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  activityAction: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activityDetails: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  activityTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  pChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  pChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});

