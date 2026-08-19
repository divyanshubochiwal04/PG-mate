import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { getErrorMessage } from '../../../api/error';
import { colors, radius, spacing, typography } from '../../../design-system';

interface StockAdjustModalProps {
  item: any;
  messId: string;
  onClose: () => void;
  onAdjust: (dto: {
    messId: string;
    inventoryItemId: string;
    quantity: number;
    transactionType: 'CONSUMPTION' | 'WASTAGE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
    notes?: string;
  }) => Promise<void>;
}

export function StockAdjustModal({
  item,
  messId,
  onClose,
  onAdjust,
}: StockAdjustModalProps): React.JSX.Element {
  const [adjustQtyStr, setAdjustQtyStr] = useState('');
  const [adjustType, setAdjustType] = useState<'CONSUMPTION' | 'WASTAGE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT'>('CONSUMPTION');
  const [notesStr, setNotesStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const qty = parseFloat(adjustQtyStr);
  const current = Number(item.currentStock);
  const isIncrease = ['ADJUSTMENT_IN', 'OPENING_STOCK', 'PURCHASE'].includes(adjustType);
  const newStock = isIncrease ? current + (isNaN(qty) ? 0 : qty) : current - (isNaN(qty) ? 0 : qty);

  const handleSubmit = async () => {
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive quantity');
      return;
    }

    if (newStock < 0) {
      Alert.alert('Invalid Stock Movement', `Cannot reduce stock below 0. Available: ${current} ${item.unit}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdjust({
        messId,
        inventoryItemId: item.id,
        quantity: qty,
        transactionType: adjustType,
        notes: notesStr.trim() || undefined,
      });
      Alert.alert('Success', 'Stock adjusted successfully');
      onClose();
    } catch (err: unknown) {
      Alert.alert('Adjustment Failed', getErrorMessage(err, 'Failed to adjust stock'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={styles.formCard}>
      <Text style={typography.h3}>Adjust Stock — {item.name}</Text>
      <Text style={styles.previewText}>
        Current: {item.currentStock} {item.unit}
        {!isNaN(qty) && qty > 0 && (
          <Text style={{ fontWeight: 'bold', color: newStock < 0 ? colors.danger : colors.primary }}>
            {' → Projected: '}{newStock} {item.unit}
          </Text>
        )}
      </Text>

      <View style={styles.typeRow}>
        {(['CONSUMPTION', 'WASTAGE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeChip, adjustType === t && styles.typeChipSelected]}
            onPress={() => setAdjustType(t)}
          >
            <Text style={[styles.typeText, adjustType === t && styles.typeTextSelected]}>
              {t.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        label="Quantity *"
        value={adjustQtyStr}
        onChangeText={setAdjustQtyStr}
        keyboardType="numeric"
        placeholder={`Amount in ${item.unit}`}
      />
      <TextInput
        label="Notes / Reason"
        value={notesStr}
        onChangeText={setNotesStr}
        placeholder="e.g. Daily cooking usage / Spoilage"
      />

      <View style={styles.modalBtnRow}>
        <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <Button title="Save Movement" loading={isSubmitting} onPress={handleSubmit} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  previewText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: spacing.xs,
  },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  typeTextSelected: {
    color: colors.surface,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
