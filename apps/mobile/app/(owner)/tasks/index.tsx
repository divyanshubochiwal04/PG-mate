import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { TaskPriority, TaskStatus } from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
import { MetricCard } from '../../../src/components/ui/MetricCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { TaskItemCard } from '../../../src/features/tasks/components/TaskItemCard';
import { CreateTaskModal } from '../../../src/features/tasks/components/CreateTaskModal';
import {
  useCompleteTask,
  useCreateTask,
  useStartTask,
  useTasks,
  useTaskSummary,
} from '../../../src/features/tasks/hooks/useTasks';
import { colors, radius, spacing, typography } from '../../../src/design-system';

type FilterTab = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'OVERDUE' | 'COMPLETED';

export default function TaskCenterScreen(): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryParams = {
    search: search.trim() || undefined,
    status:
      activeTab === 'TODO'
        ? ('TODO' as TaskStatus)
        : activeTab === 'IN_PROGRESS'
        ? ('IN_PROGRESS' as TaskStatus)
        : activeTab === 'COMPLETED'
        ? ('COMPLETED' as TaskStatus)
        : undefined,
    overdue: activeTab === 'OVERDUE' ? true : undefined,
  };

  const { data: summary, refetch: refetchSummary } = useTaskSummary();
  const { data: tasksData, isLoading, refetch, isRefetching } = useTasks(queryParams);
  const createTaskMutation = useCreateTask();
  const startTaskMutation = useStartTask();
  const completeTaskMutation = useCompleteTask();

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchSummary()]);
  };

  const handleCreateTask = async (dto: {
    title: string;
    description?: string | null;
    priority: TaskPriority;
  }) => {
    await createTaskMutation.mutateAsync(dto);
  };

  const tasks = tasksData?.data || [];

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h2}>Operational Tasks</Text>
            <Text style={styles.subtitle}>Action follow-ups, maintenance and resident requests.</Text>
          </View>
          <Button
            title="+ Task"
            size="small"
            icon={<Ionicons name="add-circle-outline" size={16} color={colors.surface} />}
            onPress={() => setIsModalOpen(true)}
          />
        </View>

        {/* Task Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Pending"
            value={(summary?.todoTasks ?? 0) + (summary?.inProgressTasks ?? 0)}
            color={colors.primary}
            style={styles.metricCard}
          />
          <MetricCard
            label="Overdue"
            value={summary?.overdueTasks ?? 0}
            color={colors.danger}
            style={styles.metricCard}
          />
          <MetricCard
            label="Critical"
            value={summary?.criticalTasks ?? 0}
            color={colors.warning}
            style={styles.metricCard}
          />
          <MetricCard
            label="Completed"
            value={summary?.completedTasks ?? 0}
            color={colors.success}
            style={styles.metricCard}
          />
        </View>

        {/* Search Input */}
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search tasks by title or resident..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabScroll}>
          {(['ALL', 'TODO', 'IN_PROGRESS', 'OVERDUE', 'COMPLETED'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="button"
            >
              <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
                {tab.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task List */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={90} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={90} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={90} style={{ marginBottom: spacing.sm }} />
          </View>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="No Tasks Found"
            description="Create follow-ups or select another filter tab."
            actionTitle="+ Create Task"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TaskItemCard
                task={item}
                onStart={(id) => startTaskMutation.mutate(id)}
                onComplete={(id) => completeTaskMutation.mutate(id)}
                isStarting={startTaskMutation.isPending}
                isCompleting={completeTaskMutation.isPending}
              />
            )}
          />
        )}

        {/* Create Task Modal */}
        <CreateTaskModal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateTask}
          isSubmitting={createTaskMutation.isPending}
        />
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginVertical: spacing.xs,
  },
  metricCard: {
    minWidth: '47%',
    flex: 1,
  },
  searchRow: {
    marginVertical: spacing.xs,
  },
  tabScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
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
    paddingBottom: 72,
  },
});
