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
import { useBillingReport } from '../../../src/features/reporting/hooks/useReporting';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function BillingReportScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: billReport, isLoading, isError, error, refetch, isRefetching } = useBillingReport();

  const summary = billReport?.summary || {
    totalInvoiced: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    paidInvoices: 0,
    partialInvoices: 0,
    unpaidInvoices: 0,
    cancelledInvoices: 0,
  };

  const rows = billReport?.rows || [];
  const collectionPercentage =
    summary.totalInvoiced > 0
      ? Math.round((summary.totalCollected / summary.totalInvoiced) * 100)
      : 0;

  const billingDistribution = useMemo(() => [
    {
      label: 'Collected',
      value: summary.totalCollected || 0,
      color: colors.success,
      icon: 'cash' as const,
    },
    {
      label: 'Outstanding',
      value: Math.max(0, (summary.totalOutstanding || 0) - (summary.overdueAmount || 0)),
      color: colors.warning,
      icon: 'time' as const,
    },
    {
      label: 'Overdue',
      value: summary.overdueAmount || 0,
      color: colors.danger,
      icon: 'alert-circle' as const,
    },
  ], [summary]);

  const financialColumns = useMemo(() => [
    {
      label: 'Invoiced',
      value: summary.totalInvoiced || 0,
      color: colors.primary,
      subLabel: `₹${((summary.totalInvoiced || 0) / 1000).toFixed(0)}k`,
    },
    {
      label: 'Collected',
      value: summary.totalCollected || 0,
      color: colors.success,
      subLabel: `${collectionPercentage}%`,
    },
    {
      label: 'Pending',
      value: summary.totalOutstanding || 0,
      color: colors.warning,
      subLabel: `₹${((summary.totalOutstanding || 0) / 1000).toFixed(0)}k`,
    },
    {
      label: 'Overdue',
      value: summary.overdueAmount || 0,
      color: colors.danger,
      subLabel: `₹${((summary.overdueAmount || 0) / 1000).toFixed(0)}k`,
    },
  ], [summary, collectionPercentage]);

  const invoiceStatusBars = useMemo(() => {
    const totalInvoices =
      (summary.paidInvoices || 0) +
      (summary.partialInvoices || 0) +
      (summary.unpaidInvoices || 0) +
      (summary.cancelledInvoices || 0) || 1;

    return [
      {
        label: 'Paid In Full',
        value: summary.paidInvoices || 0,
        maxValue: totalInvoices,
        color: colors.success,
        icon: 'checkmark-circle-outline' as const,
        badgeText: `${summary.paidInvoices || 0} bills`,
      },
      {
        label: 'Partially Paid',
        value: summary.partialInvoices || 0,
        maxValue: totalInvoices,
        color: colors.warning,
        icon: 'hourglass-outline' as const,
        badgeText: `${summary.partialInvoices || 0} bills`,
      },
      {
        label: 'Unpaid / Pending',
        value: summary.unpaidInvoices || 0,
        maxValue: totalInvoices,
        color: colors.danger,
        icon: 'alert-circle-outline' as const,
        badgeText: `${summary.unpaidInvoices || 0} bills`,
      },
    ];
  }, [summary]);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Billing & Collections Report" />
      <FlatList
        data={rows}
        keyExtractor={(item) => item.invoiceId || item.invoiceNumber}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Card style={styles.summaryCard}>
              <Text style={styles.rateText}>{collectionPercentage}% Collected</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, collectionPercentage)}%` },
                  ]}
                />
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Invoiced</Text>
                  <Text style={styles.val}>₹{(summary.totalInvoiced ?? 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Collected</Text>
                  <Text style={[styles.val, { color: colors.success }]}>
                    ₹{(summary.totalCollected ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Outstanding</Text>
                  <Text style={[styles.val, { color: colors.warning }]}>
                    ₹{(summary.totalOutstanding ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Overdue</Text>
                  <Text style={[styles.val, { color: colors.danger }]}>
                    ₹{(summary.overdueAmount ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </Card>

            {/* REAL-TIME CHARTS */}
            <MultiSegmentBar
              title="Revenue Realization Split"
              totalLabel="Total Invoiced"
              segments={billingDistribution}
              formatValue={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />

            <VerticalBarChart
              title="Revenue Health Comparison"
              data={financialColumns}
              height={120}
              formatValue={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />

            <HorizontalBarList
              title="Invoice Status Volume"
              items={invoiceStatusBars}
              formatValue={(v) => `${v}`}
            />

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                INVOICE AUDIT LEDGER ({rows.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/(owner)/billing')}>
                <Text style={styles.manageLink}>Billing Hub →</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ margin: spacing.xl }} />
            ) : isError ? (
              <Card style={styles.errorCard}>
                <Text style={{ color: colors.danger }}>
                  {error instanceof Error ? error.message : 'Failed to load billing report'}
                </Text>
                <Button
                  title="Retry"
                  onPress={() => void refetch()}
                  style={{ marginTop: spacing.sm }}
                />
              </Card>
            ) : rows.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="No Invoices Found"
                description="No billing or invoice ledger records found for this period."
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.invNumber}>{item.invoiceNumber}</Text>
                <Text style={styles.residentName}>
                  {item.residentName} ({item.residentCode})
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  item.invoiceStatus === 'PAID'
                    ? styles.badgePaid
                    : item.invoiceStatus === 'PARTIAL'
                    ? styles.badgePartial
                    : styles.badgeUnpaid,
                ]}
              >
                <Text style={styles.badgeText}>{item.invoiceStatus}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.detailText}>Due: {item.dueDate ? item.dueDate.split('T')[0] : 'N/A'}</Text>
              </View>
              <View style={styles.amountGroup}>
                <Text style={styles.totalAmt}>₹{item.invoiceTotal.toLocaleString('en-IN')}</Text>
                {item.balanceDue > 0 && (
                  <Text style={styles.dueAmt}>Due: ₹{item.balanceDue.toLocaleString('en-IN')}</Text>
                )}
              </View>
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
  rateText: {
    ...typography.h2,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBarFill: { height: '100%', backgroundColor: colors.success, borderRadius: radius.pill },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  label: { ...typography.caption, color: colors.textSecondary },
  val: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
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
  invNumber: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  residentName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgePaid: { backgroundColor: colors.successLight },
  badgePartial: { backgroundColor: colors.warningLight },
  badgeUnpaid: { backgroundColor: colors.dangerLight },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.textPrimary },
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
  amountGroup: {
    alignItems: 'flex-end',
  },
  totalAmt: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dueAmt: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 1,
  },
  errorCard: {
    padding: spacing.md,
    marginVertical: spacing.md,
  },
});
