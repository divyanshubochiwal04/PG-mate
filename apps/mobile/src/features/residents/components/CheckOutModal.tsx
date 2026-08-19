import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { colors, spacing, typography } from '../../../theme';

interface CheckOutModalProps {
  visible: boolean;
  onClose: () => void;
  residentName: string;
  residentCode?: string;
  locationText?: string;
  admissionDate?: string;
  outstandingBalance?: number;
  onConfirm: (dto: { actualCheckoutDate?: string; notes?: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function CheckOutModal({
  visible,
  onClose,
  residentName,
  residentCode,
  locationText,
  admissionDate,
  outstandingBalance = 0,
  onConfirm,
  isSubmitting = false,
}: CheckOutModalProps): React.JSX.Element {
  const todayStr = new Date().toISOString().split('T')[0];
  const [checkoutDate, setCheckoutDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  const handleConfirm = async () => {
    await onConfirm({
      actualCheckoutDate: checkoutDate || todayStr,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.modalCard}>
          <Text style={styles.title}>🚪 CHECK OUT RESIDENT</Text>
          <Text style={styles.subtitle}>
            Close active stay and release bed allocation.
          </Text>

          <View style={styles.detailCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Resident:</Text>
              <Text style={styles.infoValue}>
                {residentName} {residentCode ? `(${residentCode})` : ''}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{locationText || 'Active Allocation'}</Text>
            </View>

            {admissionDate ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Admission Date:</Text>
                <Text style={styles.infoValue}>{admissionDate}</Text>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Outstanding Dues:</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: outstandingBalance > 0 ? colors.danger : colors.success, fontWeight: 'bold' },
                ]}
              >
                ₹{outstandingBalance.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {outstandingBalance > 0 ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Outstanding balance remains ₹{outstandingBalance.toLocaleString('en-IN')}. Checkout does not automatically waive or settle outstanding dues.
              </Text>
            </View>
          ) : null}

          <View style={styles.warningBoxAmber}>
            <Text style={styles.warningTextAmber}>
              ⚠️ This will release the current bed and complete the resident's active stay.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Actual Checkout Date (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.input}
              value={checkoutDate}
              onChangeText={setCheckoutDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notes / Reason (Optional):</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Course completed / Personal move"
              placeholderTextColor={colors.muted}
              multiline
            />
          </View>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="outline"
              style={{ flex: 1, marginRight: spacing.xs }}
              onPress={onClose}
              disabled={isSubmitting}
            />
            <Button
              title={isSubmitting ? 'Checking Out...' : 'Confirm Check Out'}
              variant="danger"
              style={{ flex: 1 }}
              onPress={handleConfirm}
              disabled={isSubmitting}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    maxHeight: '90%',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  detailCard: {
    backgroundColor: colors.mutedBackground,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
  },
  infoValue: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: typography.fontSize.xs,
    color: '#991B1B',
  },
  warningBoxAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  warningTextAmber: {
    fontSize: typography.fontSize.xs,
    color: '#92400E',
  },
  fieldGroup: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
});
