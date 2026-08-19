import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { TaskDto } from '@m-square/contracts';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors, radius, spacing, typography } from '../../../design-system';

interface TaskItemCardProps {
  task: TaskDto;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  isStarting?: boolean;
  isCompleting?: boolean;
}

export function TaskItemCard({
  task,
  onStart,
  onComplete,
  isStarting,
  isCompleting,
}: TaskItemCardProps): React.JSX.Element {
  const router = useRouter();
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  return (
    <Card style={styles.taskCard}>
      <TouchableOpacity
        onPress={() => router.push(`/(owner)/tasks/${task.id}` as never)}
        activeOpacity={0.7}
      >
        <View style={styles.taskHeader}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            {Boolean(task.description) && (
              <Text style={styles.taskDesc} numberOfLines={2}>
                {task.description}
              </Text>
            )}
          </View>
          <StatusBadge status={task.status} label={task.status.replace('_', ' ')} />
        </View>

        <View style={styles.metaRow}>
          <StatusBadge
            status={task.priority === 'CRITICAL' ? 'DANGER' : task.priority === 'HIGH' ? 'WARNING' : 'INFO'}
            label={task.priority}
          />
          {Boolean(task.dueDate) && (
            <View style={styles.dueTag}>
              <Ionicons
                name="time-outline"
                size={12}
                color={isOverdue ? colors.danger : colors.textSecondary}
              />
              <Text style={[styles.dueText, isOverdue && styles.overdueText]}>
                Due {new Date(task.dueDate!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Inline Quick Action */}
      <View style={styles.taskActions}>
        {task.status === 'TODO' && (
          <Button
            title="Start Task"
            size="small"
            variant="outline"
            loading={isStarting}
            onPress={() => onStart(task.id)}
            style={{ flex: 1 }}
          />
        )}
        {task.status === 'IN_PROGRESS' && (
          <Button
            title="Mark Complete"
            size="small"
            icon={<Ionicons name="checkmark-outline" size={14} color={colors.surface} />}
            loading={isCompleting}
            onPress={() => onComplete(task.id)}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  taskTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  taskDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  overdueText: {
    color: colors.danger,
    fontWeight: '700',
  },
  taskActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: spacing.sm,
  },
});
