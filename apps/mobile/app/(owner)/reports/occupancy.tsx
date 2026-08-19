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
import { useOccupancyReport } from '../../../src/features/reporting/hooks/useReporting';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function OccupancyReportScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    data: occupancy,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useOccupancyReport();

  const summary = occupancy?.summary || {
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    occupancyPercentage: 0,
    totalRooms: 0,
    totalFloors: 0,
  };

  const rows = occupancy?.rows || [];

  const bedDistribution = useMemo(() => [
    {
      label: 'Occupied Beds',
      value: summary.occupiedBeds || 0,
      color: colors.success,
      icon: 'bed' as const,
    },
    {
      label: 'Available Beds',
      value: summary.availableBeds || 0,
      color: colors.primary,
      icon: 'checkmark-circle' as const,
    },
  ], [summary]);

  const occupancyColumns = useMemo(() => [
    {
      label: 'Total',
      value: summary.totalBeds || 0,
      color: colors.primaryDark,
      subLabel: 'All Beds',
    },
    {
      label: 'Occupied',
      value: summary.occupiedBeds || 0,
      color: colors.success,
      subLabel: `${summary.occupancyPercentage}%`,
    },
    {
      label: 'Available',
      value: summary.availableBeds || 0,
      color: colors.primary,
      subLabel: 'Vacant',
    },
    {
      label: 'Rooms',
      value: summary.totalRooms || 0,
      color: colors.warning,
      subLabel: `${summary.totalFloors} Flrs`,
    },
  ], [summary]);

  const topRoomBars = useMemo(() => {
    return rows.slice(0, 5).map((r) => ({
      label: `Room ${r.roomNumber}`,
      subText: `${r.buildingName ? r.buildingName + ' • ' : ''}Flr ${r.floorNumber}`,
      value: r.occupiedBeds,
      maxValue: r.totalBeds || 1,
      color: r.occupancyPercentage === 100 ? colors.danger : r.occupancyPercentage > 0 ? colors.warning : colors.success,
      badgeText: `${r.occupancyPercentage}%`,
      icon: 'bed-outline' as const,
    }));
  }, [rows]);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Occupancy Report" />
      <FlatList
        data={rows}
        keyExtractor={(item, index) => `${item.roomId || item.roomNumber}-${index}`}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Card style={styles.summaryCard}>
              <Text style={styles.rateText}>{summary.occupancyPercentage ?? 0}% Occupied</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, summary.occupancyPercentage ?? 0)}%` },
                  ]}
                />
              </View>

              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.num}>{summary.totalRooms ?? 0}</Text>
                  <Text style={styles.lbl}>Rooms</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.num}>{summary.totalFloors ?? 0}</Text>
                  <Text style={styles.lbl}>Floors</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.num}>{summary.totalBeds ?? 0}</Text>
                  <Text style={styles.lbl}>Total Beds</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.num, { color: colors.success }]}>
                    {summary.occupiedBeds ?? 0}
                  </Text>
                  <Text style={styles.lbl}>Occupied</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={[styles.num, { color: colors.primary }]}>
                    {summary.availableBeds ?? 0}
                  </Text>
                  <Text style={styles.lbl}>Available</Text>
                </View>
              </View>
            </Card>

            {/* REAL-TIME CHARTS */}
            <MultiSegmentBar
              title="Bed Allocation Split"
              totalLabel="Capacity"
              segments={bedDistribution}
            />

            <VerticalBarChart
              title="Property Capacity Distribution"
              data={occupancyColumns}
              height={120}
            />

            {topRoomBars.length > 0 && (
              <HorizontalBarList
                title="Top Room Capacity Utilization"
                items={topRoomBars}
                formatValue={(v) => `${v} beds`}
              />
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                ROOM OCCUPANCY BREAKDOWN ({rows.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/(owner)/inventory')}>
                <Text style={styles.manageLink}>Visual Map →</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ margin: spacing.xl }} />
            ) : isError ? (
              <Card style={styles.errorCard}>
                <Text style={{ color: colors.danger }}>
                  {error instanceof Error ? error.message : 'Failed to load occupancy report'}
                </Text>
                <Button
                  title="Retry"
                  onPress={() => void refetch()}
                  style={{ marginTop: spacing.sm }}
                />
              </Card>
            ) : rows.length === 0 ? (
              <EmptyState
                icon="cube-outline"
                title="No Occupancy Data"
                description="No room occupancy breakdown records found for the selected property."
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <View>
                <Text style={styles.roomName}>
                  {item.buildingName ? `${item.buildingName} • ` : ''}Room {item.roomNumber}
                </Text>
                <Text style={styles.subInfo}>
                  Floor {item.floorNumber} • Capacity: {item.capacity}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  item.occupancyPercentage === 100
                    ? styles.badgeFull
                    : item.occupancyPercentage > 0
                    ? styles.badgePartial
                    : styles.badgeEmpty,
                ]}
              >
                <Text style={styles.badgeText}>{item.occupancyPercentage}%</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.statLabel}>
                🟢 Available: <Text style={styles.statVal}>{item.availableBeds}</Text>
              </Text>
              <Text style={styles.statLabel}>
                🔴 Occupied: <Text style={styles.statVal}>{item.occupiedBeds} / {item.totalBeds}</Text>
              </Text>
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
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { alignItems: 'center' },
  num: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  lbl: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
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
  roomName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  subInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeFull: { backgroundColor: colors.dangerLight },
  badgePartial: { backgroundColor: colors.warningLight },
  badgeEmpty: { backgroundColor: colors.successLight },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.textPrimary },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statVal: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorCard: {
    padding: spacing.md,
    marginVertical: spacing.md,
  },
});
