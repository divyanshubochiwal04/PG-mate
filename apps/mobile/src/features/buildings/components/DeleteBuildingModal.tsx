import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Modal } from 'react-native';
import type { BuildingDto } from '@m-square/contracts';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getErrorMessage } from '@/api/error';
import { colors, spacing, typography } from '@/theme';

interface DeleteBuildingModalProps {
  visible: boolean;
  building: BuildingDto | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
}

export function DeleteBuildingModal({
  visible,
  building,
  onClose,
  onConfirmDelete,
}: DeleteBuildingModalProps): React.JSX.Element {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!building) return;
    setIsDeleting(true);
    try {
      await onConfirmDelete(building.id);
      onClose();
    } catch (err: unknown) {
      Alert.alert('Delete Failed', getErrorMessage(err, 'Failed to delete building'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!building) return <></>;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.modal}>
          <Text style={styles.title}>Delete Building</Text>
          <Text style={styles.message}>
            Are you sure you want to delete <Text style={styles.bold}>{building.name}</Text>?
          </Text>
          <Text style={styles.warning}>
            This action cannot be undone. If this building has floors, the deletion will be rejected
            by the server.
          </Text>
          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.btn}
              disabled={isDeleting}
            />
            <Button
              title="Delete"
              variant="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
              style={styles.btn}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    width: '100%',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  warning: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  bold: {
    fontWeight: typography.fontWeight.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
  },
});
