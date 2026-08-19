import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../../src/components/ui/Screen';
import { Card } from '../../../../src/components/ui/Card';
import { Button } from '../../../../src/components/ui/Button';
import { StatusBadge } from '../../../../src/components/ui/StatusBadge';
import { SkeletonLoader } from '../../../../src/components/ui/SkeletonLoader';
import { ErrorState } from '../../../../src/components/ui/ErrorState';
import { useInvoiceDetails } from '../../../../src/features/billing/hooks/useBilling';
import { colors, radius, spacing, typography } from '../../../../src/design-system';

export default function InvoiceDetailsScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: invoice, isLoading, error, refetch } = useInvoiceDetails(id);

  if (isLoading) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.loadingWrap}>
          <SkeletonLoader height={100} style={{ marginBottom: spacing.md }} />
          <SkeletonLoader height={140} style={{ marginBottom: spacing.md }} />
          <SkeletonLoader height={140} style={{ marginBottom: spacing.md }} />
        </View>
      </Screen>
    );
  }

  if (error || !invoice) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.content}>
          <ErrorState
            title="Failed to load invoice"
            error={error}
            onRetry={refetch}
          />
          <Button
            title="Back to Billing"
            variant="outline"
            onPress={() => router.back()}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={typography.h2}>{invoice.invoiceNumber}</Text>
              {Boolean(invoice.residentName) && (
                <Text style={styles.residentName}>
                  {invoice.residentName} {invoice.residentCode ? `(${invoice.residentCode})` : ''}
                </Text>
              )}
            </View>
            <StatusBadge status={invoice.status} label={invoice.status.replace('_', ' ')} />
          </View>

          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                Period: {invoice.billingPeriodStart} to {invoice.billingPeriodEnd}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>Due Date: {invoice.dueDate}</Text>
            </View>
          </View>
        </Card>

        {/* Line Items Breakdown */}
        <Text style={styles.sectionHeader}>LINE ITEMS BREAKDOWN</Text>
        {invoice.items?.map((item) => (
          <Card key={item.id || item.description} style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemTag}>{item.chargeType}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </Card>
        ))}

        {/* Payment History & Receipts */}
        <Text style={styles.sectionHeader}>PAYMENT HISTORY & RECEIPTS</Text>
        {!invoice.payments || invoice.payments.length === 0 ? (
          <Card style={styles.itemCard}>
            <Text style={styles.emptyText}>No payments allocated to this invoice yet.</Text>
          </Card>
        ) : (
          invoice.payments.map((p) => (
            <Card key={p.paymentId} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text style={styles.itemDesc}>{p.paymentNumber}</Text>
                <Text style={styles.payAllocText}>
                  Allocated: ₹{p.allocatedAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={styles.metaText}>
                Date: {p.paymentDate} • Method: {p.paymentMethod}
              </Text>
              {Boolean(p.receiptNumber) && (
                <Text style={styles.receiptText}>Receipt: {p.receiptNumber}</Text>
              )}
            </Card>
          ))
        )}

        {/* Financial Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>₹{invoice.subtotalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryVal}>-₹{invoice.discountAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Invoiced</Text>
            <Text style={styles.summaryBold}>₹{invoice.totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paid Amount</Text>
            <Text style={[styles.summaryVal, { color: colors.success }]}>
              ₹{invoice.paidAmount.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.balanceDueRow]}>
            <Text style={styles.balanceDueLabel}>Balance Due</Text>
            <Text style={styles.dueVal}>₹{invoice.balanceDueAmount.toLocaleString('en-IN')}</Text>
          </View>
        </Card>

        <Button
          title="Back to Invoices"
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
  loadingWrap: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  residentName: {
    ...typography.smallBold,
    color: colors.primary,
    marginTop: 2,
  },
  metaBox: {
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginVertical: spacing.xs,
  },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDesc: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  itemTag: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemPrice: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  payAllocText: {
    ...typography.smallBold,
    color: colors.success,
  },
  receiptText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  summaryVal: {
    ...typography.small,
    color: colors.textPrimary,
  },
  summaryBold: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
  balanceDueRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  balanceDueLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  dueVal: {
    ...typography.h3,
    color: colors.danger,
    fontWeight: '800',
  },
});
