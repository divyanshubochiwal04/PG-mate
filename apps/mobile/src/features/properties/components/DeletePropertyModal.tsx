import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import type { PropertyDto } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { getErrorMessage } from '../../../api/error';
import { colors, spacing, typography } from '../../../theme';

interface DeletePropertyModalProps {
  visible: boolean;
  property: PropertyDto | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
}

export function DeletePropertyModal({
  visible,
  property,
  onClose,
  onConfirmDelete,
}: DeletePropertyModalProps): React.JSX.Element {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!property) return <></>;

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirmDelete(property.id);
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete property'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Delete Property?</Text>
          <Text style={styles.message}>
            Are you sure you want to delete property &quot;{property.name}&quot; ({property.code})?
          </Text>
          <Text style={styles.subtext}>
            Note: A property cannot be deleted if it contains active buildings, floors, or rooms.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={styles.btn} />
            <Button
              title="Delete Property"
              variant="danger"
              isLoading={isDeleting}
              onPress={handleDelete}
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
