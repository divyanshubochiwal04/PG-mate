import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { MetricCard } from '../../../src/components/ui/MetricCard';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { useMesses, useTodayMetrics } from '../../../src/features/mess/hooks/useMess';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function MessHomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: messes, isLoading: isLoadingMesses } = useMesses();

  const activeMess = (messes || [])[0];
  const { data: todayMetrics, isLoading: isLoadingMetrics } = useTodayMetrics(activeMess?.id);

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={typography.h2}>Mess & Dining</Text>
          <Text style={styles.subtitle}>Daily meal plans, kitchen stock, procurement and expenses.</Text>
        </View>

        {isLoadingMesses || isLoadingMetrics ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={120} style={{ marginBottom: spacing.md }} />
          </View>
        ) : activeMess && (
          <Card style={styles.metricsCard}>
            <View style={styles.messHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3}>{activeMess.name}</Text>
                <Text style={styles.metricsSubtitle}>Today's Meal Consumption Overview</Text>
              </View>
              <View style={styles.diningBadge}>
                <Ionicons name="restaurant" size={14} color={colors.primary} />
                <Text style={styles.diningBadgeText}>Active Dining</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard
                label="Subscribed"
                value={todayMetrics?.expected ?? 0}
                color={colors.primary}
              />
              <MetricCard
                label="Consumed"
                value={todayMetrics?.consumed ?? 0}
                color={colors.success}
              />
              <MetricCard
                label="Skipped"
                value={todayMetrics?.skipped ?? 0}
                color={colors.warning}
              />
            </View>
          </Card>
        )}

        <Text style={styles.sectionTitle}>DAILY OPERATIONS</Text>

        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/(owner)/mess/menu')}
            accessibilityRole="button"
            accessibilityLabel="Daily Meal Menu"
          >
            <View style={styles.iconCircle}>
              <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Daily Menu</Text>
            <Text style={styles.cardSub}>Meals, timings & dishes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/(owner)/mess/inventory')}
            accessibilityRole="button"
            accessibilityLabel="Kitchen Stock Inventory"
          >
            <View style={styles.iconCircle}>
              <Ionicons name="cube-outline" size={22} color={colors.warning} />
            </View>
            <Text style={styles.cardTitle}>Kitchen Stock</Text>
            <Text style={styles.cardSub}>Inventory & low stock</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/(owner)/mess/procurement')}
            accessibilityRole="button"
            accessibilityLabel="Purchases and Vendors"
          >
            <View style={styles.iconCircle}>
              <Ionicons name="cart-outline" size={22} color={colors.info} />
            </View>
            <Text style={styles.cardTitle}>Procurement</Text>
            <Text style={styles.cardSub}>Purchases & vendor POs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/(owner)/mess/expenses')}
            accessibilityRole="button"
            accessibilityLabel="Mess Expenses"
          >
            <View style={styles.iconCircle}>
              <Ionicons name="cash-outline" size={22} color={colors.success} />
            </View>
            <Text style={styles.cardTitle}>Expenses</Text>
            <Text style={styles.cardSub}>Daily cash outflow</Text>
          </TouchableOpacity>
        </View>
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
  loadingWrap: {
    marginBottom: spacing.md,
  },
  metricsCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  messHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  metricsSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  diningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  diningBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  menuGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  menuCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
