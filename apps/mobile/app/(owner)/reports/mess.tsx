import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { GlobalHeader } from '../../../src/components/common/GlobalHeader';
import {
  HorizontalBarList,
  MultiSegmentBar,
  VerticalBarChart,
} from '../../../src/components/charts/ReportChartComponents';
import { useMessReport } from '../../../src/features/reporting/hooks/useReporting';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function MessReportScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: messReport, isLoading, isError, error, refetch, isRefetching } = useMessReport();

  const summary = messReport?.summary || {
    activeSubscriptions: 0,
    cancelledSubscriptions: 0,
    monthlySubscriptionValue: 0,
    totalMealConsumptions: 0,
  };

  const rows = messReport?.rows || [];

  const subscriptionSegments = useMemo(() => [
    {
      label: 'Active Plans',
      value: summary.activeSubscriptions || 0,
      color: colors.success,
      icon: 'checkmark-circle' as const,
    },
    {
      label: 'Cancelled Plans',
      value: summary.cancelledSubscriptions || 0,
      color: colors.secondary,
      icon: 'close-circle' as const,
    },
  ], [summary]);

  const messMetricsColumns = useMemo(() => [
    {
      label: 'Subscribers',
      value: summary.activeSubscriptions || 0,
      color: colors.primary,
      subLabel: 'Active',
    },
    {
      label: 'Monthly Value',
      value: summary.monthlySubscriptionValue || 0,
      color: colors.success,
      subLabel: `₹${((summary.monthlySubscriptionValue || 0) / 1000).toFixed(0)}k`,
    },
    {
      label: 'Meals Served',
      value: summary.totalMealConsumptions || 0,
      color: colors.warning,
      subLabel: 'Total',
    },
    {
      label: 'Cancelled',
      value: summary.cancelledSubscriptions || 0,
      color: colors.secondary,
      subLabel: 'Inactive',
    },
  ], [summary]);

  const topMealPlans = useMemo(() => {
    return rows.slice(0, 5).map((r) => ({
      label: `${r.residentName}`,
      subText: `${r.mealPlanName} • ${r.messName || 'Main Mess'}`,
      value: r.consumptionCount || 0,
      color: r.subscriptionStatus === 'ACTIVE' ? colors.success : colors.secondary,
      badgeText: `₹${r.monthlyPrice}/mo`,
      icon: 'restaurant-outline' as const,
    }));
  }, [rows]);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Mess & Inventory Report" />
      <FlatList
        data={rows}
        keyExtractor={(item, index) => `${item.residentId}-${index}`}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryHeader}>MESS SUBSCRIPTION OVERVIEW</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={[styles.num, { color: colors.primary }]}>{summary.activeSubscriptions ?? 0}</Text>
                  <Text style={styles.lbl}>Active Plans</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.num, { color: colors.success }]}>
                    ₹{((summary.monthlySubscriptionValue ?? 0) / 1000).toFixed(1)}k
                  </Text>
                  <Text style={styles.lbl}>Monthly Value</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.num, { color: colors.warning }]}>{summary.totalMealConsumptions ?? 0}</Text>
                  <Text style={styles.lbl}>Meals Served</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.num, { color: colors.textSecondary }]}>{summary.cancelledSubscriptions ?? 0}</Text>
                  <Text style={styles.lbl}>Cancelled</Text>
                </View>
              </View>
            </Card>

            {/* REAL-TIME CHARTS */}
            <MultiSegmentBar
              title="Subscription Health Split"
              totalLabel="Total Plans"
              segments={subscriptionSegments}
            />

            <VerticalBarChart
              title="Mess Operations Overview"
              data={messMetricsColumns}
              height={120}
              formatValue={(v) => (v > 1000 ? `₹${(v / 1000).toFixed(0)}k` : `${v}`)}
            />

            {topMealPlans.length > 0 && (
              <HorizontalBarList
                title="Resident Meal Consumptions"
                items={topMealPlans}
                formatValue={(v) => `${v} meals`}
              />
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                ACTIVE MEAL SUBSCRIBERS ({rows.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/(owner)/mess')}>
                <Text style={styles.manageLink}>Mess Ops →</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ margin: spacing.xl }} />
            ) : isError ? (
              <Card style={styles.errorCard}>
                <Text style={{ color: colors.danger }}>
                  {error instanceof Error ? error.message : 'Failed to load mess report'}
                </Text>
                <Button
                  title="Retry"
                  onPress={() => void refetch()}
                  style={{ marginTop: spacing.sm }}
                />
              </Card>
            ) : rows.length === 0 ? (
              <EmptyState
                icon="restaurant-outline"
                title="No Mess Subscriptions"
                description="No active mess subscription or consumption records found."
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.residentName}>{item.residentName}</Text>
                <Text style={styles.codeText}>
                  {item.residentCode} • {item.mealPlanName}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  item.subscriptionStatus === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    item.subscriptionStatus === 'ACTIVE' ? styles.badgeTextActive : styles.badgeTextInactive,
                  ]}
                >
                  {item.subscriptionStatus}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="restaurant-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.detailText}>{item.messName || 'Main Kitchen'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} />
                <Text style={styles.detailText}>{item.consumptionCount} meals</Text>
              </View>
              <Text style={styles.priceText}>₹{item.monthlyPrice.toLocaleString('en-IN')}/mo</Text>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 64 },
  summaryCard: { padding: spacing.md, marginBottom: spacing.md },
  summaryHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', justifyContent: 'space-around' },
  gridItem: { alignItems: 'center' },
  num: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  lbl: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  manageLink: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  rowCard: {
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  residentName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  codeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeActive: { backgroundColor: colors.successLight },
  badgeInactive: { backgroundColor: colors.secondaryLight },
  badgeText: { fontSize: 10, fontWeight: '700' },
  badgeTextActive: { color: colors.success },
  badgeTextInactive: { color: colors.textSecondary },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  priceText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  errorCard: {
    padding: spacing.md,
    marginVertical: spacing.md,
  },
});
