import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { useCreateTask, useResidentTasks } from '../../tasks/hooks/useTasks';
import { getErrorMessage } from '../../../api/error';
import { colors, radius, spacing, typography } from '../../../design-system';

interface ResidentTasksCardProps {
  residentId: string;
  residentName: string;
}

export function ResidentTasksCard({ residentId, residentName }: ResidentTasksCardProps): React.JSX.Element {
  const router = useRouter();
  const { data: tasks, isLoading } = useResidentTasks(residentId);
  const createTaskMutation = useCreateTask();

  const handleCreateFollowUp = () => {
    Alert.prompt(
      'New Follow-up Task',
      `Create task for ${residentName}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (title?: string) => {
            if (!title || !title.trim()) return;
            try {
              await createTaskMutation.mutateAsync({
                title: title.trim(),
                residentId,
                priority: 'HIGH',
              });
              Alert.alert('Task Created', 'Follow-up task created successfully.');
            } catch (e: unknown) {
              Alert.alert('Error', getErrorMessage(e, 'Failed to create task'));
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const pendingCount = tasks?.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length || 0;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="clipboard-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>
            TASKS & FOLLOW-UPS {pendingCount > 0 ? `(${pendingCount} PENDING)` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleCreateFollowUp} style={styles.addBtn} accessibilityRole="button">
          <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
          <Text style={styles.addBtnText}>+ Follow-up</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <SkeletonLoader height={40} style={{ marginTop: spacing.sm }} />
      ) : tasks && tasks.length > 0 ? (
        tasks.slice(0, 3).map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.taskRow}
            onPress={() => router.push(`/(owner)/tasks/${t.id}` as never)}
            accessibilityRole="button"
          >
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {t.title}
              </Text>
              {Boolean(t.dueDate) && (
                <Text style={styles.dueDate}>
                  Due {new Date(t.dueDate!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </Text>
              )}
            </View>
            <StatusBadge status={t.status} label={t.status.replace('_', ' ')} />
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>No follow-up tasks recorded</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  taskRow: {
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  dueDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
