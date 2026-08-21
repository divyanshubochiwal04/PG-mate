import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { CreateTaskDto, TaskPriority, TaskStatus } from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
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

type FilterTab = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'OVERDUE' | 'CRITICAL' | 'COMPLETED';

const CATEGORY_CHIPS = [
  { label: 'All Categories', value: '' },
  { label: '⚡ AC & Power', value: 'Electricity' },
  { label: '🚰 Plumbing', value: 'Plumbing' },
  { label: '🧹 Cleaning', value: 'Cleaning' },
  { label: '💰 Rent Dues', value: 'Rent' },
  { label: '🍲 Kitchen & Mess', value: 'Mess' },
  { label: '🔑 Check-In/Out', value: 'Check-In' },
  { label: '📋 General', value: 'General' },
];

export default function TaskCenterScreen(): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryParams = {
    search: search.trim() ? search.trim() : activeCategory ? activeCategory : undefined,
    status:
      activeTab === 'TODO'
        ? ('TODO' as TaskStatus)
        : activeTab === 'IN_PROGRESS'
        ? ('IN_PROGRESS' as TaskStatus)
        : activeTab === 'COMPLETED'
        ? ('COMPLETED' as TaskStatus)
        : undefined,
    priority: activeTab === 'CRITICAL' ? ('CRITICAL' as TaskPriority) : undefined,
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

  const handleCreateTask = async (dto: CreateTaskDto) => {
    await createTaskMutation.mutateAsync(dto);
  };

  const tasks: any[] = Array.isArray(tasksData?.data)
    ? tasksData.data
    : Array.isArray(tasksData)
    ? (tasksData as any)
    : [];
  const totalTasks = summary?.totalTasks || 0;
  const completedTasks = summary?.completedTasks || 0;
  const overdueTasks = summary?.overdueTasks || 0;
  const pendingTasks = (summary?.todoTasks || 0) + (summary?.inProgressTasks || 0);

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        {/* ── 1. HEADER BAR ── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h2}>Task Command Center</Text>
            <Text style={styles.subtitle}>
              Maintenance tickets, staff checklists & resident follow-ups
            </Text>
          </View>
          <Button
            title="+ New Task"
            size="small"
            icon={<Ionicons name="add-circle" size={16} color="#FFFFFF" />}
            onPress={() => setIsModalOpen(true)}
          />
        </View>

        {/* ── 2. EXECUTIVE HEALTH BANNER ── */}
        <Card style={styles.healthBannerCard}>
          <View style={styles.healthHeader}>
            <View>
              <Text style={styles.healthTitle}>Operations Progress</Text>
              <Text style={styles.healthSub}>
                {completedTasks} completed • {pendingTasks} active tickets
              </Text>
            </View>
            <View style={styles.healthBadge}>
              <Text style={styles.healthBadgeText}>{completionRate}% Done</Text>
            </View>
          </View>

          <View style={styles.healthBarBg}>
            <View style={[styles.healthBarFill, { width: `${completionRate}%` }]} />
          </View>
        </Card>

        {/* ── 3. 4-KPI MATRIX GRID ── */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
            onPress={() => setActiveTab('TODO')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiIconRow}>
              <Ionicons name="time-outline" size={18} color="#2563EB" />
              <Text style={[styles.kpiValue, { color: '#1E40AF' }]}>
                {summary?.todoTasks ?? 0}
              </Text>
            </View>
            <Text style={styles.kpiLabel}>To Do</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}
            onPress={() => setActiveTab('IN_PROGRESS')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiIconRow}>
              <Ionicons name="construct-outline" size={18} color="#7C3AED" />
              <Text style={[styles.kpiValue, { color: '#5B21B6' }]}>
                {summary?.inProgressTasks ?? 0}
              </Text>
            </View>
            <Text style={styles.kpiLabel}>In Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.kpiCard,
              {
                backgroundColor: overdueTasks > 0 ? '#FEF2F2' : '#F8FAFC',
                borderColor: overdueTasks > 0 ? '#FECACA' : '#E2E8F0',
              },
            ]}
            onPress={() => setActiveTab('OVERDUE')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiIconRow}>
              <Ionicons
                name="warning"
                size={18}
                color={overdueTasks > 0 ? '#DC2626' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.kpiValue,
                  { color: overdueTasks > 0 ? '#991B1B' : colors.textPrimary },
                ]}
              >
                {overdueTasks}
              </Text>
            </View>
            <Text style={styles.kpiLabel}>Overdue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
            onPress={() => setActiveTab('COMPLETED')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiIconRow}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={[styles.kpiValue, { color: '#065F46' }]}>
                {completedTasks}
              </Text>
            </View>
            <Text style={styles.kpiLabel}>Completed</Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. AUTOMATED REMINDER NOTIFICATION BANNER ── */}
        {overdueTasks > 0 && (
          <TouchableOpacity
            style={styles.reminderBanner}
            onPress={() => setActiveTab('OVERDUE')}
            activeOpacity={0.8}
          >
            <View style={styles.reminderIconCircle}>
              <Ionicons name="notifications" size={16} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>Automated Follow-Up Reminder</Text>
              <Text style={styles.reminderMsg}>
                {overdueTasks} maintenance task(s) past due. Tap to take action.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#DC2626" />
          </TouchableOpacity>
        )}

        {/* ── 5. CATEGORY FILTER CHIPS ── */}
        <View style={styles.categoryScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORY_CHIPS.map((cat) => {
              const isSelected = activeCategory === cat.value;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[styles.catChip, isSelected && styles.catChipActive]}
                  onPress={() => setActiveCategory(isSelected ? '' : cat.value)}
                >
                  <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 6. SEARCH & STATUS FILTER ROW ── */}
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search tasks by title, room or resident..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.tabScroll}>
          {(['ALL', 'TODO', 'IN_PROGRESS', 'OVERDUE', 'CRITICAL', 'COMPLETED'] as const).map((tab) => (
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

        {/* ── 7. TASK LIST ── */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={90} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={90} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={90} style={{ marginBottom: spacing.sm }} />
          </View>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title="No Tasks Found"
            description="Create a new task or adjust your active category/filter tabs."
            actionTitle="+ Create Task"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  healthBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  healthSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  healthBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  healthBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  healthBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: radius.pill,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  kpiIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  reminderIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
  },
  reminderMsg: {
    fontSize: 10,
    color: '#B91C1C',
    marginTop: 1,
  },
  categoryScrollWrap: {
    marginBottom: spacing.xs + 2,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  catChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  searchRow: {
    marginBottom: spacing.xs,
  },
  tabScroll: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  tabChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  loadingWrap: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  listContent: {
    paddingBottom: 80,
  },
});

