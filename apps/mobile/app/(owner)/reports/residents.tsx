import React, { useMemo, useState } from 'react';
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
import { TextInput } from '../../../src/components/ui/TextInput';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { GlobalHeader } from '../../../src/components/common/GlobalHeader';
import {
  MultiSegmentBar,
  VerticalBarChart,
} from '../../../src/components/charts/ReportChartComponents';
import { useResidentReport } from '../../../src/features/reporting/hooks/useReporting';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function ResidentReportScreen(): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: resReport, isLoading, isError, error, refetch, isRefetching } = useResidentReport({
    search: search.trim() || undefined,
  });

  const summary = resReport?.summary || {
    totalResidents: 0,
    activeResidents: 0,
    checkedOutResidents: 0,
    residentsWithoutStay: 0,
    occupiedBeds: 0,
    outstandingAmount: 0,
  };

  const rows = resReport?.rows || [];

  // Computed Chart Data from Real Database Records
  const residentDistributionSegments = useMemo(() => [
    {
      label: 'In Beds',
      value: summary.occupiedBeds || 0,
      color: colors.success,
      icon: 'bed' as const,
    },
    {
      label: 'No Stay Bed',
      value: summary.residentsWithoutStay || 0,
      color: colors.warning,
      icon: 'person' as const,
    },
    {
      label: 'Checked Out',
      value: summary.checkedOutResidents || 0,
      color: colors.secondary,
      icon: 'exit' as const,
    },
  ], [summary]);

  const columnChartData = useMemo(() => [
    {
      label: 'Active',
      value: summary.activeResidents || 0,
      color: colors.primary,
      subLabel: 'Residents',
    },
    {
      label: 'Occupied',
      value: summary.occupiedBeds || 0,
      color: colors.success,
      subLabel: 'Beds',
    },
    {
      label: 'Pending Stay',
      value: summary.residentsWithoutStay || 0,
      color: colors.warning,
      subLabel: 'Unassigned',
    },
    {
      label: 'Checked Out',
      value: summary.checkedOutResidents || 0,
      color: colors.secondary,
      subLabel: 'Past',
    },
  ], [summary]);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Resident Analytics Report" />
      <FlatList
        data={rows}
        keyExtractor={(item) => item.residentId}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {/* KPI SUMMARY CARDS */}
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryHeader}>RESIDENT AUDIT OVERVIEW</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={[styles.num, { color: colors.primary }]}>{summary.activeResidents ?? 0}</Text>
                  <Text style={styles.lbl}>Active</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.num, { color: colors.success }]}>{summary.occupiedBeds ?? 0}</Text>
                  <Text style={styles.lbl}>In Beds</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.num, { color: colors.textSecondary }]}>{summary.checkedOutResidents ?? 0}</Text>
                  <Text style={styles.lbl}>Checked Out</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.num, { color: (summary.outstandingAmount ?? 0) > 0 ? colors.danger : colors.textPrimary }]}>
                    ₹{((summary.outstandingAmount ?? 0) / 1000).toFixed(1)}k
                  </Text>
                  <Text style={styles.lbl}>Total Dues</Text>
                </View>
              </View>
            </Card>

            {/* REAL-TIME CHARTS */}
            <MultiSegmentBar
              title="Resident Lifecycle Status"
              totalLabel="Total"
              segments={residentDistributionSegments}
            />

            <VerticalBarChart
              title="Capacity & Status Allocation"
              subtitle="Live breakdown of resident occupancy"
              data={columnChartData}
              height={120}
            />

            {/* SEARCH INPUT */}
            <View style={styles.searchSection}>
              <TextInput
                placeholder="Search resident name, code, room..."
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                AUDIT DIRECTORY ({rows.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/(owner)/residents')}>
                <Text style={styles.manageLink}>Resident Ops →</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ margin: spacing.xl }} />
            ) : isError ? (
              <Card style={styles.errorCard}>
                <Text style={{ color: colors.danger }}>
                  {error instanceof Error ? error.message : 'Failed to load resident analytics'}
                </Text>
                <Button
                  title="Retry"
                  onPress={() => void refetch()}
                  style={{ marginTop: spacing.sm }}
                />
              </Card>
            ) : rows.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No Resident Records"
                description={
                  search ? `No resident found matching "${search}".` : 'No resident records found in the audit report.'
                }
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.residentName}>{item.fullName}</Text>
                <Text style={styles.codeText}>
                  {item.residentCode} • {item.phone || 'No phone'}
                </Text>
              </View>
              <View style={[styles.badge, item.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive]}>
                <Text
                  style={[
                    styles.badgeText,
                    item.status === 'ACTIVE' ? styles.badgeTextActive : styles.badgeTextInactive,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>
                  {item.propertyName || 'Property'} {item.roomNumber ? `• Rm ${item.roomNumber}` : ''}{' '}
                  {item.bedNumber ? `(${item.bedNumber})` : ''}
                </Text>
              </View>
              {item.outstandingAmount > 0 && (
                <Text style={styles.dueText}>
                  Due: ₹{item.outstandingAmount.toLocaleString('en-IN')}
                </Text>
              )}
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
  searchSection: { marginBottom: spacing.sm },
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
    flex: 1,
  },
  detailText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dueText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.danger,
  },
  errorCard: {
    padding: spacing.md,
    marginVertical: spacing.md,
  },
});
