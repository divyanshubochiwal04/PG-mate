import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AdditionalChargeType } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { colors, spacing, typography } from '../../../theme';

interface AddChargeModalProps {
  visible: boolean;
  onAdd: (
    chargeType: AdditionalChargeType,
    description: string,
    amount: number,
    isRecurring: boolean
  ) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function AddChargeModal({
  visible,
  onAdd,
  onClose,
  isLoading,
}: AddChargeModalProps): React.JSX.Element {
  const [chargeType, setChargeType] = useState<AdditionalChargeType>('MAINTENANCE');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);

  const handleSubmit = () => {
    const amount = parseFloat(amountStr);
    if (!description.trim() || isNaN(amount) || amount <= 0) return;
    onAdd(chargeType, description.trim(), amount, isRecurring);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Add Additional Charge</Text>

          <Text style={styles.label}>Charge Type</Text>
          <View style={styles.typeRow}>
            {(['MAINTENANCE', 'PARKING', 'EXTRA_FACILITY', 'CUSTOM'] as AdditionalChargeType[]).map(
              (t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, chargeType === t && styles.typeChipSelected]}
                  onPress={() => setChargeType(t)}
                >
                  <Text style={[styles.typeText, chargeType === t && styles.typeTextSelected]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <TextInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Covered Car Parking"
          />
          <TextInput
            label="Amount (₹) *"
            value={amountStr}
            onChangeText={setAmountStr}
            keyboardType="numeric"
            placeholder="500"
          />

          <Text style={styles.label}>Charge Frequency</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeChip, isRecurring && styles.typeChipSelected]}
              onPress={() => setIsRecurring(true)}
            >
              <Text style={[styles.typeText, isRecurring && styles.typeTextSelected]}>
                Monthly Recurring
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeChip, !isRecurring && styles.typeChipSelected]}
              onPress={() => setIsRecurring(false)}
            >
              <Text style={[styles.typeText, !isRecurring && styles.typeTextSelected]}>
                One-Time Fee
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnRow}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button
              title={isLoading ? 'Adding...' : 'Add Charge'}
              disabled={!description.trim() || !amountStr || isLoading}
              onPress={handleSubmit}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  container: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  label: { fontSize: typography.fontSize.xs, color: colors.muted, marginVertical: 4 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { fontSize: typography.fontSize.xs, color: colors.text },
  typeTextSelected: { color: colors.primaryForeground, fontWeight: typography.fontWeight.bold },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
