import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { InvoiceDto } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing, typography } from '../../../design-system';

interface PaymentCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  invoice: InvoiceDto | null;
  onRecordPayment: (dto: {
    residentId: string;
    stayId: string;
    invoiceId?: string;
    amount: number;
    paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
    referenceNumber?: string;
    notes?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function PaymentCollectionModal({
  visible,
  onClose,
  invoice,
  onRecordPayment,
  isSubmitting = false,
}: PaymentCollectionModalProps): React.JSX.Element {
  const balance = invoice?.balanceDueAmount ?? Math.max(0, (invoice?.totalAmount || 0) - (invoice?.paidAmount || 0));

  const [amountStr, setAmountStr] = useState('');
  const [method, setMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER'>('UPI');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (invoice && balance > 0) {
      setAmountStr(String(balance));
    } else {
      setAmountStr('');
    }
  }, [invoice, balance]);

  const parsedAmount = parseFloat(amountStr) || 0;
  const projectedRemaining = Math.max(0, balance - parsedAmount);

  const handleSubmit = async () => {
    if (!invoice || parsedAmount <= 0) return;
    await onRecordPayment({
      residentId: invoice.residentId,
      stayId: invoice.stayId,
      invoiceId: invoice.id,
      amount: parsedAmount,
      paymentMethod: method,
      referenceNumber: refNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={typography.h2}>Collect Payment</Text>
              <Text style={styles.subtitle}>Record dues collection for invoice</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Invoice Context Card */}
            {invoice && (
              <Card style={styles.invoiceSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Invoice</Text>
                  <Text style={styles.summaryValue}>{invoice.invoiceNumber}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total / Paid</Text>
                  <Text style={styles.summaryValue}>
                    ₹{invoice.totalAmount.toLocaleString('en-IN')} / ₹{invoice.paidAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Outstanding Dues</Text>
                  <Text style={[styles.summaryValue, styles.dueText]}>
                    ₹{balance.toLocaleString('en-IN')}
                  </Text>
                </View>
              </Card>
            )}

            {/* Collection Amount Input */}
            <TextInput
              label="Collection Amount (₹)"
              placeholder="e.g. 5000"
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
            />

            {/* Quick Fill Chips */}
            {balance > 0 && (
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => setAmountStr(String(balance))}
                >
                  <Text style={styles.chipText}>Full Balance (₹{balance.toLocaleString('en-IN')})</Text>
                </TouchableOpacity>
                {balance > 1000 && (
                  <TouchableOpacity
                    style={styles.chip}
                    onPress={() => setAmountStr(String(Math.floor(balance / 2)))}
                  >
                    <Text style={styles.chipText}>50% (₹{Math.floor(balance / 2).toLocaleString('en-IN')})</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Payment Method Selector */}
            <Text style={styles.inputLabel}>Payment Method</Text>
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

            {/* Reference Number */}
            <TextInput
              label="Transaction / Reference # (Optional)"
              placeholder="e.g. UPI Ref / Bank UTR"
              value={refNumber}
              onChangeText={setRefNumber}
            />

            {/* Notes */}
            <TextInput
              label="Operational Notes (Optional)"
              placeholder="e.g. Collected via GPay"
              value={notes}
              onChangeText={setNotes}
            />

            {/* Projected Remaining Balance Preview */}
            <View style={styles.projectionBox}>
              <Text style={styles.projectionLabel}>Projected Balance After Payment:</Text>
              <Text style={[styles.projectionValue, projectedRemaining === 0 ? styles.paidText : styles.dueText]}>
                ₹{projectedRemaining.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title="Record Payment"
                loading={isSubmitting}
                disabled={parsedAmount <= 0}
                onPress={handleSubmit}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingBottom: spacing.xxl,
  },
  invoiceSummaryCard: {
    backgroundColor: colors.secondaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dueText: {
    color: colors.danger,
  },
  paidText: {
    color: colors.success,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  inputLabel: {
    ...typography.smallBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  methodChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  methodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
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
    fontWeight: '600',
    color: colors.textPrimary,
  },
  methodChipTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  projectionBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginVertical: spacing.md,
  },
  projectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  projectionValue: {
    ...typography.h3,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
