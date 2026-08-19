import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { FacilityDto, ResidentFacilityType } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { colors, spacing, typography } from '../../../theme';

interface AssignResidentFacilityModalProps {
  visible: boolean;
  catalogFacilities: FacilityDto[];
  onAssign: (facilityId: string, facilityType: ResidentFacilityType, monthlyCharge: number) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function AssignResidentFacilityModal({
  visible,
  catalogFacilities,
  onAssign,
  onClose,
  isLoading,
}: AssignResidentFacilityModalProps): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [facilityType, setFacilityType] = useState<ResidentFacilityType>('INCLUDED');
  const [chargeStr, setChargeStr] = useState('0');

  const handleSubmit = () => {
    if (!selectedId) return;
    const charge = parseFloat(chargeStr) || 0;
    onAssign(selectedId, facilityType, charge);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Assign Catalog Facility</Text>

          <Text style={styles.label}>Select Catalog Facility</Text>
          <ScrollView style={styles.catalogList}>
            {catalogFacilities.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.itemChip, selectedId === f.id && styles.itemChipSelected]}
                onPress={() => setSelectedId(f.id)}
              >
                <Text style={[styles.itemText, selectedId === f.id && styles.itemTextSelected]}>
                  {f.name} ({f.code})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Facility Type</Text>
          <View style={styles.typeRow}>
            {(['INCLUDED', 'PAID', 'OPTIONAL'] as ResidentFacilityType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, facilityType === t && styles.typeChipSelected]}
                onPress={() => setFacilityType(t)}
              >
                <Text style={[styles.typeText, facilityType === t && styles.typeTextSelected]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {facilityType !== 'INCLUDED' && (
            <TextInput
              label="Extra Monthly Charge (₹)"
              value={chargeStr}
              onChangeText={setChargeStr}
              keyboardType="numeric"
            />
          )}

          <View style={styles.btnRow}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button
              title={isLoading ? 'Assigning...' : 'Assign Facility'}
              disabled={!selectedId || isLoading}
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
  catalogList: { maxHeight: 150, marginBottom: spacing.sm },
  itemChip: {
    padding: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  itemChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  itemText: { fontSize: typography.fontSize.xs, color: colors.text },
  itemTextSelected: { color: colors.primaryForeground, fontWeight: typography.fontWeight.bold },
  typeRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
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
