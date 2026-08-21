import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { useResidentMessSubscription } from '../../mess/hooks/useMess';
import { colors, radius, spacing, typography } from '../../../design-system';

interface ResidentMessSubscriptionCardProps {
  residentId: string;
  onOpenAdd: () => void;
  onOpenChange: () => void;
  onCancel: () => void;
  isCancelling?: boolean;
}

export function ResidentMessSubscriptionCard({
  residentId,
  onOpenAdd,
  onOpenChange,
  onCancel,
  isCancelling = false,
}: ResidentMessSubscriptionCardProps): React.JSX.Element {
  const { data: sub, isLoading } = useResidentMessSubscription(residentId);

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>MESS SUBSCRIPTION</Text>
          </View>
        </View>
        <SkeletonLoader height={40} style={{ marginTop: spacing.sm }} />
      </Card>
    );
  }

  if (!sub || sub.status !== 'ACTIVE') {
    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>MESS SUBSCRIPTION</Text>
          </View>
        </View>
        <Text style={styles.emptyText}>No active mess subscription</Text>
        <Button
          title="+ Add Mess Subscription"
          variant="outline"
          size="small"
          onPress={onOpenAdd}
          style={{ marginTop: spacing.sm }}
        />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>MESS SUBSCRIPTION</Text>
        </View>
        <StatusBadge status="ACTIVE" label="ACTIVE" />
      </View>

      <View style={styles.contentBody}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Current Plan</Text>
          <Text style={styles.value}>
            {sub.mealPlanName || (sub.billingMode === 'MONTHLY' ? 'Monthly Plan' : 'Per Meal Plan')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Dining Hall</Text>
          <Text style={styles.value}>{sub.messName || 'Mess Dining'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Monthly Price</Text>
          <Text style={[styles.value, styles.priceValue]}>
            ₹{sub.priceAtSubscription?.toLocaleString('en-IN') || 0}/mo
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Button
          title="Change Plan"
          variant="outline"
          size="small"
          onPress={onOpenChange}
          style={{ flex: 1 }}
        />
        <Button
          title="Cancel Plan"
          variant="danger"
          size="small"
          loading={isCancelling}
          onPress={onCancel}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginVertical: spacing.xs,
  },
  contentBody: {
    marginVertical: spacing.xs,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceValue: {
    color: colors.success,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
