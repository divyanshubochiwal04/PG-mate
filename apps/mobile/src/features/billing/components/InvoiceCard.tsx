import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { InvoiceDto } from '@m-square/contracts';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors, radius, spacing, typography } from '../../../design-system';

interface InvoiceCardProps {
  invoice: InvoiceDto;
  onCollectPayment?: (invoice: InvoiceDto) => void;
  onRemind?: (invoice: InvoiceDto) => void;
  onViewReceipt?: (invoice: InvoiceDto) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onCollectPayment,
  onRemind,
  onViewReceipt,
}) => {
  const router = useRouter();

  const total = invoice.totalAmount || 0;
  const paid = invoice.paidAmount || 0;
  const balance = invoice.balanceDueAmount ?? Math.max(0, total - paid);
  const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const isUnpaid = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && balance > 0;

  return (
    <Card style={styles.card}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.invoiceMeta}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.periodText}>
            {invoice.billingPeriodStart} to {invoice.billingPeriodEnd}
          </Text>
        </View>
        <StatusBadge status={invoice.status} label={invoice.status.replace('_', ' ')} />
      </View>

      {/* Financial Numbers Grid */}
      <View style={styles.amountGrid}>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Paid</Text>
          <Text style={[styles.amountValue, styles.paidValue]}>₹{paid.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Balance Due</Text>
          <Text style={[styles.amountValue, balance > 0 ? styles.dueValue : styles.paidValue]}>
            ₹{balance.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${percentPaid}%` }]} />
      </View>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        {onViewReceipt && (
          <TouchableOpacity
            style={styles.receiptBtn}
            onPress={() => onViewReceipt(invoice)}
            accessibilityRole="button"
          >
            <Ionicons name="receipt-outline" size={13} color={colors.primary} />
            <Text style={styles.receiptBtnText}>Receipt</Text>
          </TouchableOpacity>
        )}

        {isUnpaid && onRemind && (
          <TouchableOpacity
            style={styles.remindBtn}
            onPress={() => onRemind(invoice)}
            accessibilityRole="button"
          >
            <Ionicons name="logo-whatsapp" size={13} color="#16A34A" />
            <Text style={styles.remindBtnText}>Remind</Text>
          </TouchableOpacity>
        )}

        {isUnpaid && onCollectPayment && (
          <TouchableOpacity
            style={styles.collectBtn}
            onPress={() => onCollectPayment(invoice)}
            accessibilityRole="button"
          >
            <Ionicons name="cash-outline" size={13} color={colors.surface} />
            <Text style={styles.collectBtnText}>Collect</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  invoiceMeta: {
    flex: 1,
  },
  invoiceNumber: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  periodText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  amountValue: {
    ...typography.smallBold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  paidValue: {
    color: colors.success,
  },
  dueValue: {
    color: colors.danger,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.borderDark,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  receiptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  remindBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  collectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  collectBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
