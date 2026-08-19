import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import type { FacilityDto } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { getErrorMessage } from '../../../api/error';
import { colors, spacing, typography } from '../../../theme';

interface UnassignFacilityModalProps {
  visible: boolean;
  facility: FacilityDto | null;
  propertyName: string;
  onClose: () => void;
  onConfirmUnassign: (facilityId: string) => Promise<void>;
}

export function UnassignFacilityModal({
  visible,
  facility,
  propertyName,
  onClose,
  onConfirmUnassign,
}: UnassignFacilityModalProps): React.JSX.Element {
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!facility) return <></>;

  const handleUnassign = async () => {
    setError(null);
    setIsUnassigning(true);
    try {
      await onConfirmUnassign(facility.id);
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to unassign facility'));
    } finally {
      setIsUnassigning(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Unassign Facility?</Text>
          <Text style={styles.message}>
            Unassign &quot;{facility.name}&quot; ({facility.code}) facility from {propertyName}?
          </Text>
          <Text style={styles.subtext}>
            This facility will remain in your organization catalog and can be assigned again at any
            time.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={styles.btn} />
            <Button
              title="Unassign Facility"
              variant="danger"
              isLoading={isUnassigning}
              onPress={handleUnassign}
              style={styles.btn}
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
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    marginBottom: 4,
  },
  subtext: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
  },
});
