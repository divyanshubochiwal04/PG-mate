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
import { useExpenseReport } from '../../../src/features/reporting/hooks/useReporting';
import { colors, radius, spacing, typography } from '../../../src/design-system';

const CATEGORY_COLORS: Record<string, string> = {
  ELECTRICITY: '#F59E0B',
  WATER: '#0EA5E9',
  GROCERY: '#10B981',
  MESS: '#8B5CF6',
  SALARY: '#6366F1',
  MAINTENANCE: '#EC4899',
  GAS: '#F97316',
  CLEANING: '#14B8A6',
  RENT: '#3B82F6',
  OTHER: '#64748B',
};

export default function ExpenseReportScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: expReport, isLoading, isError, error, refetch, isRefetching } = useExpenseReport();

  const summary = expReport?.summary || {
    expenseCount: 0,
    totalExpenses: 0,
  };

  const categories = expReport?.categories || [];
  const rows = expReport?.rows || [];

  const categorySegments = useMemo(() => {
    return categories.map((cat) => ({
      label: cat.category,
      value: cat.totalAmount || 0,
      color: CATEGORY_COLORS[cat.category.toUpperCase()] || colors.primary,
    }));
  }, [categories]);

  const categoryColumns = useMemo(() => {
    return categories.slice(0, 4).map((cat) => ({
      label: cat.category,
      value: cat.totalAmount || 0,
      color: CATEGORY_COLORS[cat.category.toUpperCase()] || colors.danger,
      subLabel: `₹${((cat.totalAmount || 0) / 1000).toFixed(0)}k`,
    }));
  }, [categories]);

  const topCategoryBars = useMemo(() => {
    return categories.map((cat) => ({
      label: cat.category,
      subText: `${cat.count} payments`,
      value: cat.totalAmount || 0,
      maxValue: summary.totalExpenses || 1,
      color: CATEGORY_COLORS[cat.category.toUpperCase()] || colors.danger,
      badgeText: `₹${(cat.totalAmount || 0).toLocaleString('en-IN')}`,
      icon: 'receipt-outline' as const,
    }));
  }, [categories, summary.totalExpenses]);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Operational Expenses Report" />
      <FlatList
        data={rows}
        keyExtractor={(item) => item.expenseId}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryHeader}>EXPENSES AUDIT OVERVIEW</Text>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Expenses Recorded</Text>
                <Text style={styles.totalVal}>₹{(summary.totalExpenses ?? 0).toLocaleString('en-IN')}</Text>
              </View>
              <Text style={styles.countSubtitle}>{summary.expenseCount ?? 0} expense transactions tracked</Text>
            </Card>

            {/* REAL-TIME CHARTS */}
            {categorySegments.length > 0 && (
              <MultiSegmentBar
                title="Expense Category Distribution"
                totalLabel="Total Spend"
                segments={categorySegments}
                formatValue={(v) => `₹${(v / 1000).toFixed(1)}k`}
              />
            )}

            {categoryColumns.length > 0 && (
              <VerticalBarChart
                title="Category Spend Comparison"
                data={categoryColumns}
                height={120}
                formatValue={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
            )}

            {topCategoryBars.length > 0 && (
              <HorizontalBarList
                title="Category Breakdown Ledger"
                items={topCategoryBars}
                formatValue={(v) => `₹${v.toLocaleString('en-IN')}`}
              />
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                EXPENSE TRANSACTIONS ({rows.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/(owner)/mess')}>
                <Text style={styles.manageLink}>Mess Expenses →</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ margin: spacing.xl }} />
            ) : isError ? (
              <Card style={styles.errorCard}>
                <Text style={{ color: colors.danger }}>
                  {error instanceof Error ? error.message : 'Failed to load expense report'}
                </Text>
                <Button
                  title="Retry"
                  onPress={() => void refetch()}
                  style={{ marginTop: spacing.sm }}
                />
              </Card>
            ) : rows.length === 0 ? (
              <EmptyState
                icon="wallet-outline"
                title="No Expenses Recorded"
                description="No operational expense line items recorded for this period."
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.catBadgeText}>{item.category}</Text>
                <Text style={styles.descText}>{item.description || 'Operational Expense'}</Text>
              </View>
              <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.detailText}>
                  {item.expenseDate ? item.expenseDate.split('T')[0] : 'N/A'}
                </Text>
              </View>
              {item.vendorName ? (
                <View style={styles.detailItem}>
                  <Ionicons name="business-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{item.vendorName}</Text>
                </View>
              ) : null}
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
    marginBottom: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  totalVal: {
    ...typography.h2,
    color: colors.danger,
  },
  countSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  categoryWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  catHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  catName: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  catAmt: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
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
  catBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  descText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger,
  },
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
  errorCard: {
    padding: spacing.md,
    marginVertical: spacing.md,
  },
});
