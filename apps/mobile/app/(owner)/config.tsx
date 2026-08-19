import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { MetricCard } from '../../src/components/ui/MetricCard';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { useOperationalConfigurationSummary } from '../../src/features/inventory/hooks/useConfiguration';
import { colors, radius, spacing, typography } from '../../src/design-system';

export default function OwnerConfigurationScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: config, isLoading, isError, error, refetch, isRefetching } = useOperationalConfigurationSummary();

  const handleRefresh = () => {
    void refetch();
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h2}>Operational Configuration</Text>
            <Text style={styles.subtitle}>
              Global property hierarchy, pricing plans and system defaults.
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={120} style={{ marginBottom: spacing.md }} />
            <SkeletonLoader height={140} style={{ marginBottom: spacing.md }} />
            <SkeletonLoader height={120} style={{ marginBottom: spacing.md }} />
          </View>
        ) : isError || !config ? (
          <ErrorState
            title="Failed to load configuration defaults"
            error={error}
            onRetry={handleRefresh}
          />
        ) : (
          <View>
            {/* 1. PHYSICAL INVENTORY TOTALS */}
            <Text style={styles.sectionTitle}>PHYSICAL SPACES CAPACITY</Text>
            <View style={styles.metricsGrid}>
              <MetricCard
                label="Buildings"
                value={config.buildingsCount || 0}
                color={colors.primary}
              />
              <MetricCard
                label="Floors"
                value={config.floorsCount || 0}
                color={colors.info}
              />
              <MetricCard
                label="Rooms"
                value={config.roomsCount || 0}
                color={colors.warning}
              />
              <MetricCard
                label="Beds"
                value={config.bedsCount || 0}
                color={colors.success}
              />
            </View>

            {/* 2. PROPERTY CONFIGURATION */}
            <Text style={styles.sectionTitle}>PROPERTY CONFIGURATION</Text>
            {config.properties.length === 0 ? (
              <Card style={styles.card}>
                <Text style={styles.emptyText}>No property configured for this organization.</Text>
              </Card>
            ) : (
              config.properties.map((prop) => (
                <Card key={prop.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.h3}>{prop.name}</Text>
                      <Text style={styles.propCode}>CODE: {prop.code}</Text>
                    </View>
                    <StatusBadge status={prop.status} label={prop.status} />
                  </View>

                  <View style={styles.detailBox}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Locality</Text>
                      <Text style={styles.detailValue}>{prop.address?.locality || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>City / State</Text>
                      <Text style={styles.detailValue}>
                        {prop.address?.city || ''}, {prop.address?.state || ''} - {prop.address?.postalCode || ''}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Address</Text>
                      <Text style={styles.detailValue}>{prop.address?.addressLine1 || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <Button
                      title="Inspect Spaces"
                      size="small"
                      variant="outline"
                      icon={<Ionicons name="eye-outline" size={14} color={colors.primary} />}
                      onPress={() => router.push('/(owner)/inventory')}
                      style={{ flex: 1 }}
                    />
                  </View>
                </Card>
              ))
            )}

            {/* 3. DEFAULT PRICING STRUCTURE */}
            <Text style={styles.sectionTitle}>DEFAULT PRICING STRUCTURE</Text>
            <Card style={styles.card}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Single Occupancy (Private)</Text>
                <Text style={styles.priceVal}>₹14,000 / mo</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Double Sharing</Text>
                <Text style={styles.priceVal}>₹9,500 / mo</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Triple Sharing</Text>
                <Text style={styles.priceVal}>₹7,500 / mo</Text>
              </View>
              <View style={[styles.priceRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.xs }]}>
                <Text style={styles.priceLabel}>Security Deposit Standard</Text>
                <Text style={[styles.priceVal, { color: colors.primaryDark }]}>1 Month Rent</Text>
              </View>
            </Card>
          </View>
        )}

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
  scrollContent: {
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
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginVertical: spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  propCode: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  detailBox: {
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  priceLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  priceVal: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
