import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { DateRangePresetDto } from '@m-square/contracts';
import { Screen } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { MetricCard } from '../../src/components/ui/MetricCard';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { usePropertyContext } from '../../src/context/property-context';
import { useDashboardOverview } from '../../src/features/reporting/hooks/useReporting';
import { useTaskSummary } from '../../src/features/tasks/hooks/useTasks';
import { colors, radius, spacing, typography } from '../../src/design-system';

function OwnerTaskWidget(): React.JSX.Element {
  const router = useRouter();
  const { data: summary } = useTaskSummary();

  const pending = (summary?.todoTasks || 0) + (summary?.inProgressTasks || 0);
  const overdue = summary?.overdueTasks || 0;
  const critical = summary?.criticalTasks || 0;

  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
          <Text style={typography.h3}>Owner Tasks & Follow-Ups</Text>
        </View>
        <Button
          title="Task Center →"
          variant="ghost"
          size="small"
          onPress={() => router.push('/(owner)/tasks' as never)}
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Pending" value={pending} color={colors.primary} />
        <MetricCard label="Overdue" value={overdue} color={colors.danger} />
        <MetricCard label="Critical" value={critical} color={colors.warning} />
      </View>

      {overdue > 0 && (
        <TouchableOpacity
          style={styles.overdueBanner}
          onPress={() => router.push('/(owner)/tasks' as never)}
        >
          <Ionicons name="warning-outline" size={16} color={colors.danger} />
          <Text style={styles.overdueText}>
            {overdue} overdue task(s) require immediate follow-up
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

export default function OwnerHomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { selectedProperty } = usePropertyContext();
  const [preset, setPreset] = useState<DateRangePresetDto>('THIS_MONTH');

  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useDashboardOverview({ preset });

  const handleRefresh = () => {
    void refetch();
  };

  const formattedPreset = preset.replace('_', ' ');

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
      >
        {/* PRESET FILTER BAR */}
        <View style={styles.presetBar}>
          <Text style={styles.presetTitle}>
            {selectedProperty ? selectedProperty.name : 'All Properties'}
          </Text>
          <View style={styles.presetChips}>
            {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.presetChip, preset === p && styles.presetChipActive]}
                onPress={() => setPreset(p)}
              >
                <Text style={[styles.presetChipText, preset === p && styles.presetChipTextActive]}>
                  {p.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={100} style={{ marginBottom: spacing.md }} />
            <SkeletonLoader height={120} style={{ marginBottom: spacing.md }} />
            <SkeletonLoader height={160} style={{ marginBottom: spacing.md }} />
          </View>
        ) : isError || !overview ? (
          <ErrorState
            title="Couldn't load dashboard"
            error={error}
            onRetry={handleRefresh}
          />
        ) : (
          <View>
            {/* OCCUPANCY HEADER BANNER */}
            <Card style={styles.occupancyCard}>
              <View style={styles.occupancyHeader}>
                <View>
                  <Text style={styles.occupancyTitle}>Occupancy Rate</Text>
                  <Text style={styles.occupancySub}>
                    {overview.occupancy.occupiedBeds} / {overview.occupancy.totalBeds} Beds Occupied
                  </Text>
                </View>
                <Text style={styles.occupancyPercent}>
                  {overview.occupancy.occupancyPercentage}%
                </Text>
              </View>
              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, overview.occupancy.occupancyPercentage)}%` },
                  ]}
                />
              </View>
            </Card>

            {/* QUICK ACTIONS BAR */}
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => router.push('/(owner)/residents/register' as never)}
              >
                <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                <Text style={styles.quickActionText}>+ Resident</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => router.push('/(owner)/billing' as never)}
              >
                <Ionicons name="cash-outline" size={20} color={colors.success} />
                <Text style={styles.quickActionText}>Collect Dues</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => router.push('/(owner)/tasks' as never)}
              >
                <Ionicons name="checkbox-outline" size={20} color={colors.warning} />
                <Text style={styles.quickActionText}>Tasks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => router.push('/(owner)/inventory' as never)}
              >
                <Ionicons name="cube-outline" size={20} color={colors.info} />
                <Text style={styles.quickActionText}>Inventory</Text>
              </TouchableOpacity>
            </View>

            {/* BUSINESS OVERVIEW METRICS */}
            <View style={styles.metricsGrid}>
              <MetricCard
                label="Active Residents"
                value={overview.residents.totalActiveResidents}
                subValue={`${overview.residents.totalInactiveResidents} inactive`}
                color={colors.primary}
              />
              <MetricCard
                label="Collected"
                value={`₹${(overview.billing.totalCollected / 1000).toFixed(1)}k`}
                subValue={formattedPreset}
                color={colors.success}
              />
              <MetricCard
                label="Outstanding"
                value={`₹${(overview.billing.totalOutstanding / 1000).toFixed(1)}k`}
                subValue="Dues pending"
                color={colors.danger}
              />
            </View>

            {/* OWNER TASK & FOLLOW-UP WIDGET */}
            <OwnerTaskWidget />

            {/* ACTIONABLE OPERATIONAL ALERTS */}
            {overview.alerts && overview.alerts.length > 0 && (
              <Card style={styles.sectionCard}>
                <View style={styles.titleWithIcon}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                  <Text style={typography.h3}>Attention Needed ({overview.alerts.length})</Text>
                </View>

                {overview.alerts.map((alert) => (
                  <TouchableOpacity
                    key={alert.id}
                    style={styles.alertRow}
                    onPress={() => alert.targetScreen && router.push(alert.targetScreen as never)}
                  >
                    <Ionicons
                      name={alert.severity === 'CRITICAL' ? 'close-circle' : 'warning'}
                      size={18}
                      color={alert.severity === 'CRITICAL' ? colors.danger : colors.warning}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      <Text style={styles.alertMessage}>{alert.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: 72 },
  presetBar: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetTitle: { ...typography.h3, marginBottom: spacing.xs },
  presetChips: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  presetChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryLight,
  },
  presetChipActive: { backgroundColor: colors.primary },
  presetChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  presetChipTextActive: { color: colors.surface },
  loadingWrap: { gap: spacing.md },
  occupancyCard: { backgroundColor: colors.surface, marginBottom: spacing.md },
  occupancyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  occupancyTitle: { ...typography.smallBold, color: colors.textSecondary },
  occupancySub: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
  occupancyPercent: { ...typography.display, color: colors.primary },
  progressBg: {
    height: 8,
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.pill,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  quickActionText: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  sectionCard: { marginBottom: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  metricsRow: { flexDirection: 'row', gap: spacing.xs },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerLight,
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  overdueText: { ...typography.caption, color: colors.danger, fontWeight: '700' },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  alertTitle: { ...typography.smallBold, color: colors.textPrimary },
  alertMessage: { ...typography.caption, color: colors.textSecondary },
});
