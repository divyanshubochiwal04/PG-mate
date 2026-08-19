import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { useRecordPayment, useResidentFinancialSummary } from '../hooks/useBilling';
import { getErrorMessage } from '../../../api/error';
import { colors, radius, spacing, typography } from '../../../design-system';

interface Props {
  residentId: string;
  stayId?: string;
  onOpenBillingTab?: () => void;
}

export function ResidentBillingSummaryCard({
  residentId,
  stayId,
  onOpenBillingTab,
}: Props): React.JSX.Element {
  const { data: summary, isLoading, refetch } = useResidentFinancialSummary(residentId);
  const recordPaymentMutation = useRecordPayment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER'>('UPI');
  const [reference, setReference] = useState('');

  const handleRecordPayment = async () => {
    if (!stayId) {
      Alert.alert(
        'No Active Stay',
        'Resident does not have an active stay to record payment against.'
      );
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive payment amount.');
      return;
    }

    try {
      const idempotencyKey = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await recordPaymentMutation.mutateAsync({
        residentId,
        stayId,
        amount: Number(amount),
        paymentMethod: method,
        referenceNumber: reference || undefined,
        idempotencyKey,
      });

      Alert.alert('Payment Recorded', 'Payment processed and receipt issued.');
      setIsModalOpen(false);
      setAmount('');
      setReference('');
      refetch();
    } catch (err: unknown) {
      Alert.alert('Payment Failed', getErrorMessage(err, 'Unable to record payment.'));
    }
  };

  if (isLoading || !summary) {
    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Ionicons name="card-outline" size={16} color={colors.primary} />
            <Text style={styles.title}>FINANCIAL LEDGER & BALANCE</Text>
          </View>
        </View>
        <SkeletonLoader height={60} style={{ marginTop: spacing.sm }} />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="card-outline" size={16} color={colors.primary} />
          <Text style={styles.title}>FINANCIAL LEDGER & BALANCE</Text>
        </View>
        <StatusBadge
          status={summary.netDue > 0 ? 'DANGER' : 'SUCCESS'}
          label={summary.netDue > 0 ? `₹${summary.netDue.toLocaleString('en-IN')} Due` : 'Settled'}
        />
      </View>

      <View style={styles.breakdownGrid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Base Rent</Text>
          <Text style={styles.gridVal}>₹{summary.baseRent.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Facilities</Text>
          <Text style={styles.gridVal}>₹{summary.facilitiesCharge.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Mess Plan</Text>
          <Text style={styles.gridVal}>₹{summary.messCharge.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Extra Charges</Text>
          <Text style={styles.gridVal}>₹{summary.extraCharges.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.totalsRow}>
        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>Monthly Billing</Text>
          <Text style={styles.totalVal}>₹{summary.totalMonthlyBilling.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={[styles.totalVal, { color: colors.success }]}>
            ₹{summary.totalPaid.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>Net Balance Due</Text>
          <Text style={[styles.totalVal, summary.netDue > 0 ? styles.dueVal : styles.paidVal]}>
            ₹{summary.netDue.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {stayId && (
          <Button
            title="Record Direct Payment"
            size="small"
            icon={<Ionicons name="cash-outline" size={14} color={colors.surface} />}
            onPress={() => setIsModalOpen(true)}
            style={{ flex: 1 }}
          />
        )}
        {onOpenBillingTab && (
          <Button
            title="Invoices Tab"
            variant="outline"
            size="small"
            icon={<Ionicons name="receipt-outline" size={14} color={colors.primary} />}
            onPress={onOpenBillingTab}
            style={{ flex: 1 }}
          />
        )}
      </View>

      {/* Record Payment Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={typography.h2}>Record Direct Payment</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              label="Payment Amount (₹)"
              placeholder="e.g. 5000"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.methodLabel}>Payment Method</Text>
            <View style={styles.methodChips}>
              {(['UPI', 'CASH', 'BANK_TRANSFER', 'CARD', 'OTHER'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodChip, method === m && styles.methodChipActive]}
                  onPress={() => setMethod(m)}
                >
                  <Text style={[styles.methodChipText, method === m && styles.methodChipTextActive]}>
                    {m.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              label="Reference / Transaction ID"
              placeholder="Optional reference"
              value={reference}
              onChangeText={setReference}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setIsModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Payment"
                loading={recordPaymentMutation.isPending}
                onPress={handleRecordPayment}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: spacing.sm,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  gridItem: {
    width: '50%',
    paddingVertical: 2,
  },
  gridLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  gridVal: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  totalCol: {
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  totalVal: {
    ...typography.smallBold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  dueVal: {
    color: colors.danger,
    fontWeight: '800',
  },
  paidVal: {
    color: colors.success,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  methodLabel: {
    ...typography.smallBold,
    color: colors.textPrimary,
    marginVertical: spacing.xs,
  },
  methodChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  methodChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surface,
  },
  methodChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  methodChipText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  methodChipTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
