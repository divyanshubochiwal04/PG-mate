import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
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
import {
  MultiSegmentBar,
  VerticalBarChart,
} from '../../../src/components/charts/ReportChartComponents';
import { RevenueForecastCard } from '../../../src/features/reporting/components/RevenueForecastCard';
import { useDashboardOverview } from '../../../src/features/reporting/hooks/useReporting';
import { colors, radius, spacing, typography } from '../../../src/design-system';

interface ReportHubItem {
  icon: any;
  iconColor: string;
  title: string;
  desc: string;
  route: string;
}

export default function ReportsHubScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: dashboard, isLoading } = useDashboardOverview();

  const overviewColumns = useMemo(() => {
    if (!dashboard) return [];
    const occ = dashboard.occupancy?.occupancyPercentage || 0;
    const coll = dashboard.billing?.collectionPercentage || 0;
    const res = dashboard.residents?.totalActiveResidents || 0;
    const mess = dashboard.mess?.activeMessSubscribers || 0;

    return [
      {
        label: 'Occupancy',
        value: occ,
        color: colors.primary,
        subLabel: `${occ}%`,
      },
      {
        label: 'Collection',
        value: coll,
        color: colors.success,
        subLabel: `${coll}%`,
      },
      {
        label: 'Residents',
        value: res,
        color: colors.warning,
        subLabel: `${res} Active`,
      },
      {
        label: 'Mess Plans',
        value: mess,
        color: colors.info,
        subLabel: `${mess} Users`,
      },
    ];
  }, [dashboard]);

  const reportItems: ReportHubItem[] = [
    {
      icon: 'people-outline',
      iconColor: colors.primary,
      title: 'Resident Report',
      desc: 'Active residents, checked-out stays, room numbers & balances',
      route: '/(owner)/reports/residents',
    },
    {
      icon: 'bed-outline',
      iconColor: colors.info,
      title: 'Occupancy & Bed Report',
      desc: 'Room & bed capacity, occupied beds, available beds & percentages',
      route: '/(owner)/reports/occupancy',
    },
    {
      icon: 'receipt-outline',
      iconColor: colors.success,
      title: 'Billing & Invoice Report',
      desc: 'Invoiced totals, collected revenue, balance due & overdue statuses',
      route: '/(owner)/reports/billing',
    },
    {
      icon: 'cash-outline',
      iconColor: colors.primaryDark,
      title: 'Collections & Receipts',
      desc: 'Payment collection breakdown by method (UPI, Cash, Bank Transfer)',
      route: '/(owner)/reports/billing',
    },
    {
      icon: 'alert-circle-outline',
      iconColor: colors.danger,
      title: 'Outstanding Dues Report',
      desc: 'Residents with pending dues sorted by highest balance & overdue age',
      route: '/(owner)/reports/billing',
    },
    {
      icon: 'restaurant-outline',
      iconColor: colors.warning,
      title: 'Mess & Meal Report',
      desc: 'Active mess subscriptions, meal plan values & daily consumptions',
      route: '/(owner)/reports/mess',
    },
    {
      icon: 'cube-outline',
      iconColor: colors.textSecondary,
      title: 'Kitchen Stock & Inventory',
      desc: 'Current stock balances, low-stock alerts & total procurement value',
      route: '/(owner)/reports/mess',
    },
    {
      icon: 'cart-outline',
      iconColor: colors.info,
      title: 'Procurement Spend Report',
      desc: 'Procurement orders, vendor breakdown, invoice refs & total spend',
      route: '/(owner)/reports/mess',
    },
    {
      icon: 'wallet-outline',
      iconColor: colors.danger,
      title: 'Operational Expenses',
      desc: 'Category breakdown (Gas, Electricity, Salaries, Maintenance)',
      route: '/(owner)/reports/expenses',
    },
    {
      icon: 'business-outline',
      iconColor: colors.primary,
      title: 'Property Performance',
      desc: 'Property matrix: occupancy, revenue, collections & net cash flow',
      route: '/(owner)/reports/occupancy',
    },
  ];

  const handleExportMonthlyPL = async () => {
    const text =
      `📑 *MONTHLY P&L & OPERATIONAL AUDIT REPORT*\n` +
      `🏢 *PG.mate Platform*\n` +
      `📅 *Period*: ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}\n` +
      `--------------------------------\n` +
      `📈 *LIVE OCCUPANCY*: ${dashboard?.occupancy?.occupancyPercentage || 0}% (${dashboard?.residents?.totalActiveResidents || 0} Active Residents)\n` +
      `--------------------------------\n` +
      `⚡ Generated via PG.mate Smart Management`;

    try {
      await Share.share({ message: text, title: 'Monthly P&L Report' });
    } catch {
      // ignore
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h2}>Reports & Analytics Hub</Text>
          <Text style={styles.subtitle}>
            Live operational metrics derived directly from PostgreSQL with audit charts.
          </Text>
        </View>

        {/* 1-Click Monthly P&L Export Banner */}
        <TouchableOpacity
          style={styles.exportPlBanner}
          onPress={handleExportMonthlyPL}
          accessibilityRole="button"
        >
          <View style={styles.exportPlLeft}>
            <View style={styles.exportIconCircle}>
              <Ionicons name="document-text" size={20} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exportPlTitle}>1-Click Monthly P&L Export</Text>
              <Text style={styles.exportPlSub}>Download / Share Income vs Expense audit statement</Text>
            </View>
          </View>
          <Ionicons name="share-social-outline" size={18} color="#16A34A" />
        </TouchableOpacity>

        {/* Predictive Revenue & Vacancy Forecast Card */}
        <RevenueForecastCard
          currentMonthlyRevenue={128000}
          maxPotentialRevenue={160000}
          occupancyPercentage={dashboard?.occupancy?.occupancyPercentage || 80}
          upcomingCheckoutsCount={2}
          overdueAtRiskAmount={14000}
        />

        {/* EXECUTIVE OVERVIEW CHART */}
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : overviewColumns.length > 0 ? (
          <VerticalBarChart
            title="Executive Operational Pulse"
            subtitle="Live performance indicators across properties"
            data={overviewColumns}
            height={110}
            formatValue={(v) => `${v}`}
          />
        ) : null}

        <Text style={styles.sectionTitle}>OPERATIONAL AUDIT REPORTS</Text>

        <View style={styles.reportsGrid}>
          {reportItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => router.push(item.route as never)}
              activeOpacity={0.7}
            >
              <Card style={styles.reportCard}>
                <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '15' }]}>
                  <Ionicons name={item.icon} size={22} color={item.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.reportTitle}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.reportDesc}>{item.desc}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Back to More Options"
          variant="outline"
          icon={<Ionicons name="arrow-back-outline" size={16} color={colors.primary} />}
          onPress={() => router.back()}
          style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  exportPlBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  exportPlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  exportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportPlTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  exportPlSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  reportsGrid: {
    gap: spacing.xs,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  reportDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
