import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PaymentDto } from '@m-square/contracts';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors, radius, spacing, typography } from '../../../design-system';

interface PaymentCardProps {
  payment: PaymentDto;
}

export function PaymentCard({ payment }: PaymentCardProps): React.JSX.Element {
  return (
    <Card style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View>
          <Text style={styles.paymentReceipt}>
            {payment.paymentNumber || `PAY-${payment.id.slice(0, 8)}`}
          </Text>
          <Text style={styles.paymentDate}>{payment.paymentDate}</Text>
        </View>
        <Text style={styles.paymentAmount}>
          ₹{payment.amount.toLocaleString('en-IN')}
        </Text>
      </View>

      <View style={styles.paymentFooter}>
        <StatusBadge status="ACTIVE" label={payment.paymentMethod} />
        {Boolean(payment.referenceNumber) && (
          <Text style={styles.refText}>Ref: {payment.referenceNumber}</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  paymentCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  paymentReceipt: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
  paymentDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  paymentAmount: {
    ...typography.h3,
    color: colors.success,
    fontWeight: '800',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  refText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
