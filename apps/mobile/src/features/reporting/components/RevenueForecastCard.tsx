import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../../design-system';

interface RevenueForecastCardProps {
  currentMonthlyRevenue?: number;
  maxPotentialRevenue?: number;
  occupancyPercentage?: number;
  upcomingCheckoutsCount?: number;
  overdueAtRiskAmount?: number;
}

export function RevenueForecastCard({
  currentMonthlyRevenue = 142000,
  maxPotentialRevenue = 180000,
  occupancyPercentage = 82,
  upcomingCheckoutsCount = 3,
  overdueAtRiskAmount = 14500,
}: RevenueForecastCardProps): React.JSX.Element {
  const projectedLoss = maxPotentialRevenue - currentMonthlyRevenue;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="trending-up" size={18} color="#2563EB" />
          <Text style={styles.headerTitle}>Revenue & Vacancy Forecast</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>NEXT 30 DAYS</Text>
        </View>
      </View>

      {/* Primary Forecast Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>PROJECTED REVENUE</Text>
          <Text style={styles.metricValBlue}>₹{currentMonthlyRevenue.toLocaleString('en-IN')}</Text>
          <Text style={styles.metricSub}>At {occupancyPercentage}% Occupancy</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>MAX POTENTIAL (100%)</Text>
          <Text style={styles.metricValGreen}>₹{maxPotentialRevenue.toLocaleString('en-IN')}</Text>
          <Text style={styles.metricSub}>All Beds Occupied</Text>
        </View>
      </View>

      {/* Gap Analysis Bar */}
      <View style={styles.gapBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.gapTitle}>Unrealized Capacity Opportunity</Text>
          <Text style={styles.gapSub}>
            Vacant beds cost you ~₹{projectedLoss.toLocaleString('en-IN')}/month in unrealized rent.
          </Text>
        </View>
        <View style={styles.gapPill}>
          <Text style={styles.gapPillText}>- ₹{projectedLoss.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Forward Indicators */}
      <View style={styles.indicatorsRow}>
        <View style={styles.indItem}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="exit-outline" size={16} color="#D97706" />
            <Text style={styles.indTitle}>Upcoming Vacancies</Text>
          </View>
          <Text style={styles.indValAmber}>{upcomingCheckoutsCount} Beds (Notice Active)</Text>
        </View>

        <View style={styles.indItem}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.indTitle}>Revenue at Risk</Text>
          </View>
          <Text style={styles.indValRed}>₹{overdueAtRiskAmount.toLocaleString('en-IN')} (Overdue)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  pill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.mutedBackground,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValBlue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  metricValGreen: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  metricSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    gap: 8,
  },
  gapTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  gapSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  gapPill: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  gapPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  indicatorsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  indItem: {
    flex: 1,
    backgroundColor: colors.mutedBackground,
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  indTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  indValAmber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 2,
  },
  indValRed: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 2,
  },
});
