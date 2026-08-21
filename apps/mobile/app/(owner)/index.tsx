import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  Share,
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
import { useOrganization } from '../../src/features/organization/hooks/useOrganization';
import { useDashboardOverview } from '../../src/features/reporting/hooks/useReporting';
import { useTaskSummary } from '../../src/features/tasks/hooks/useTasks';
import { colors, radius, spacing, typography } from '../../src/design-system';

const brandLogo = require('../../assets/images/logo.png');
const heroBanner = require('../../assets/images/hero-banner.jpg');

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
          <View style={[styles.miniIconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="clipboard-outline" size={16} color={colors.primary} />
          </View>
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
          activeOpacity={0.8}
        >
          <Ionicons name="warning-outline" size={16} color={colors.danger} />
          <Text style={styles.overdueText}>
            {overdue} overdue task(s) require immediate follow-up
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.danger} />
        </TouchableOpacity>
      )}
    </Card>
  );
}

export default function OwnerHomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { selectedProperty } = usePropertyContext();
  const { data: org } = useOrganization();
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

  const handleShareVacancies = async () => {
    if (!overview) return;
    const propName = selectedProperty?.name || org?.name || 'PG.mate Accommodation';
    const available = Math.max(
      0,
      overview.occupancy.totalBeds - overview.occupancy.occupiedBeds
    );
    const text =
      `🏢 *${propName} — Bed Vacancy Update*\n\n` +
      `🟢 *Available Vacancies*: ${available} Beds\n` +
      `🛏️ *Total Capacity*: ${overview.occupancy.totalBeds} Beds\n` +
      `📊 *Current Occupancy*: ${overview.occupancy.occupancyPercentage}%\n\n` +
      `✨ Furnished rooms with High-Speed Wi-Fi, Food & Housekeeping.\n` +
      `📞 Contact management for room bookings & check-in!`;

    try {
      await Share.share({ message: text });
    } catch {
      // Ignored
    }
  };

  const formattedPreset = preset.replace('_', ' ');

  const totalBeds = overview?.occupancy?.totalBeds || 0;
  const occupiedBeds = overview?.occupancy?.occupiedBeds || 0;
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyPercent = overview?.occupancy?.occupancyPercentage || 0;

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. TOP BRAND & ACTION BAR ── */}
        <View style={styles.topBrandBar}>
          <View style={styles.brandLeft}>
            <Image source={brandLogo} style={styles.brandLogoImg} resizeMode="contain" />
            <View>
              <Text style={styles.brandName}>PG.MATE</Text>
              <Text style={styles.brandTagline}>SMART CO-LIVING OS</Text>
            </View>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/(owner)/search' as never)}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/(owner)/notifications' as never)}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              <View style={styles.badgeDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. REALISTIC CO-LIVING HERO SHOWCASE ── */}
        <View style={styles.heroCardContainer}>
          <ImageBackground
            source={heroBanner}
            style={styles.heroImageBg}
            imageStyle={styles.heroImageStyle}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.heroTopBadgeRow}>
                <View style={styles.liveStatusPill}>
                  <View style={styles.greenLiveDot} />
                  <Text style={styles.liveStatusText}>LIVE OPERATIONS</Text>
                </View>
                <TouchableOpacity
                  style={styles.shareVacancyBtn}
                  onPress={handleShareVacancies}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-social" size={13} color="#FFFFFF" />
                  <Text style={styles.shareVacancyText}>Share Vacancies</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>
                  {selectedProperty ? selectedProperty.name : (org?.name || 'Main Campus & Hostels')}
                </Text>
                <Text style={styles.heroSub}>
                  {availableBeds} beds vacant • {occupancyPercent}% occupancy rate
                </Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* ── 3. DATE RANGE PRESET SELECTOR ── */}
        <View style={styles.presetBar}>
          <Text style={styles.presetBarLabel}>Period View:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetChipsScroll}
          >
            {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.presetChip, preset === p && styles.presetChipActive]}
                onPress={() => setPreset(p)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    preset === p && styles.presetChipTextActive,
                  ]}
                >
                  {p.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
            {/* ── 4. OCCUPANCY METRIC CARD ── */}
            <Card style={styles.occupancyCard}>
              <View style={styles.occupancyHeader}>
                <View>
                  <Text style={styles.occupancyTitle}>Hostel Bed Capacity</Text>
                  <Text style={styles.occupancySub}>
                    {occupiedBeds} occupied of {totalBeds} total beds
                  </Text>
                </View>
                <View style={styles.occupancyBadge}>
                  <Text style={styles.occupancyPercent}>{occupancyPercent}%</Text>
                </View>
              </View>

              {/* Multi-tier progress bar */}
              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, occupancyPercent)}%` },
                  ]}
                />
              </View>

              <View style={styles.occupancyBreakdownRow}>
                <View style={styles.statPill}>
                  <View style={[styles.statDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.statText}>Occupied: {occupiedBeds}</Text>
                </View>
                <View style={styles.statPill}>
                  <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.statText}>Available: {availableBeds}</Text>
                </View>
                <View style={styles.statPill}>
                  <View style={[styles.statDot, { backgroundColor: colors.textSecondary }]} />
                  <Text style={styles.statText}>Total: {totalBeds}</Text>
                </View>
              </View>
            </Card>

            {/* ── 5. CORE BUSINESS METRICS ── */}
            <View style={styles.metricsGrid}>
              <MetricCard
                label="Active Residents"
                value={overview.residents.totalActiveResidents}
                subValue={`${overview.residents.totalInactiveResidents} inactive`}
                color={colors.primary}
                style={styles.metricCardBox}
              />
              <MetricCard
                label="Collected"
                value={`₹${(overview.billing.totalCollected / 1000).toFixed(1)}k`}
                subValue={formattedPreset}
                color={colors.success}
                style={styles.metricCardBox}
              />
              <MetricCard
                label="Outstanding"
                value={`₹${(overview.billing.totalOutstanding / 1000).toFixed(1)}k`}
                subValue="Dues pending"
                color={colors.danger}
                style={styles.metricCardBox}
              />
            </View>

            {/* ── 6. 6-ACTION OPERATIONAL LAUNCHPAD ── */}
            <Text style={styles.sectionHeaderTitle}>OPERATIONAL LAUNCHPAD</Text>
            <View style={styles.actionLaunchpadGrid}>
              <TouchableOpacity
                style={styles.launchBtn}
                onPress={() => router.push('/(owner)/residents/register' as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.launchIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="person-add" size={22} color="#2563EB" />
                </View>
                <Text style={styles.launchTitle}>+ Check-In</Text>
                <Text style={styles.launchSub}>New Resident</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchBtn}
                onPress={() => router.push('/(owner)/billing' as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.launchIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="cash" size={22} color="#059669" />
                </View>
                <Text style={styles.launchTitle}>Collect Rent</Text>
                <Text style={styles.launchSub}>Dues & Invoices</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchBtn}
                onPress={() => router.push('/(owner)/mess' as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.launchIconCircle, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="restaurant" size={22} color="#D97706" />
                </View>
                <Text style={styles.launchTitle}>Mess & Menu</Text>
                <Text style={styles.launchSub}>Meal Timetable</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchBtn}
                onPress={() => router.push('/(owner)/inventory' as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.launchIconCircle, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="business" size={22} color="#7C3AED" />
                </View>
                <Text style={styles.launchTitle}>Bed Matrix</Text>
                <Text style={styles.launchSub}>Rooms & Blocks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchBtn}
                onPress={() => router.push('/(owner)/billing' as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.launchIconCircle, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="flash" size={22} color="#DC2626" />
                </View>
                <Text style={styles.launchTitle}>Power Split</Text>
                <Text style={styles.launchSub}>Sub-meter Units</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchBtn}
                onPress={() => router.push('/(owner)/reports' as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.launchIconCircle, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="bar-chart" size={22} color="#16A34A" />
                </View>
                <Text style={styles.launchTitle}>Audit Reports</Text>
                <Text style={styles.launchSub}>P&L & Analytics</Text>
              </TouchableOpacity>
            </View>

            {/* ── 7. OWNER TASK & FOLLOW-UP WIDGET ── */}
            <OwnerTaskWidget />

            {/* ── 8. ACTIONABLE ALERTS FEED ── */}
            {overview.alerts && overview.alerts.length > 0 && (
              <Card style={styles.sectionCard}>
                <View style={styles.titleWithIcon}>
                  <View style={[styles.miniIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  </View>
                  <Text style={typography.h3}>Attention Needed ({overview.alerts.length})</Text>
                </View>

                {overview.alerts.map((alert) => (
                  <TouchableOpacity
                    key={alert.id}
                    style={styles.alertRow}
                    onPress={() => alert.targetScreen && router.push(alert.targetScreen as never)}
                    activeOpacity={0.7}
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
                    <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
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
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  topBrandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  brandLogoImg: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  heroCardContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  heroImageBg: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderRadius: radius.lg,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  heroTopBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  greenLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  shareVacancyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  shareVacancyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroContent: {
    gap: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  presetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  presetBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  presetChipsScroll: {
    gap: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  loadingWrap: {
    gap: spacing.md,
  },
  occupancyCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occupancyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  occupancySub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  occupancyBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  occupancyPercent: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },
  progressBg: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.pill,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: radius.pill,
  },
  occupancyBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  metricCardBox: {
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  actionLaunchpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  launchBtn: {
    width: '31.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 3,
  },
  launchIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  launchTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  launchSub: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  miniIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  overdueText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '700',
    flex: 1,
    marginLeft: 4,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  alertMessage: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
});

