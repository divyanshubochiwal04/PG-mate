import React from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  const priorityColor =
    task.priority === 'CRITICAL'
      ? colors.danger
      : task.priority === 'HIGH'
      ? '#EA580C'
      : task.priority === 'MEDIUM'
      ? colors.primary
      : colors.textSecondary;

  const handleShare = async () => {
    const text =
      `📋 *PG.mate Operational Task*\n` +
      `📌 *Title*: ${task.title}\n` +
      `⚡ *Priority*: ${task.priority}\n` +
      `📊 *Status*: ${task.status.replace('_', ' ')}\n` +
      (task.dueDate ? `📅 *Due*: ${new Date(task.dueDate).toLocaleDateString()}\n` : '') +
      (task.description ? `📝 *Notes*: ${task.description}\n` : '');

    try {
      await Share.share({ message: text });
    } catch {
      // Ignored
    }
  };

  return (
    <Card style={[styles.taskCard, { borderLeftColor: priorityColor, borderLeftWidth: 4 }]}>
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
            <View style={[styles.dueTag, isOverdue && styles.dueTagOverdue]}>
              <Ionicons
                name="time-outline"
                size={12}
                color={isOverdue ? colors.danger : colors.textSecondary}
              />
              <Text style={[styles.dueText, isOverdue && styles.overdueText]}>
                {isOverdue ? 'Overdue: ' : 'Due: '}
                {new Date(task.dueDate!).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                })}
              </Text>
            </View>
          )}

          {Boolean(task.residentId) && (
            <View style={styles.residentTag}>
              <Ionicons name="person-outline" size={11} color={colors.primary} />
              <Text style={styles.residentTagText}>Linked Resident</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Inline Quick Actions */}
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
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-social-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
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
    borderColor: '#E2E8F0',
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
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  dueTagOverdue: {
    backgroundColor: '#FEE2E2',
  },
  dueText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  overdueText: {
    color: colors.danger,
    fontWeight: '700',
  },
  residentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  residentTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

