import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography } from '../../theme';

interface UnsavedChangesModalProps {
  visible: boolean;
  onContinueEditing: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesModal({
  visible,
  onContinueEditing,
  onDiscard,
}: UnsavedChangesModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinueEditing}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Unsaved Changes</Text>
          <Text style={styles.message}>
            You have unsaved changes in this form. Leaving will discard your entries.
          </Text>
          <View style={styles.actions}>
            <Button
              title="Discard Changes"
              variant="outline"
              onPress={onDiscard}
              style={styles.discardButton}
            />
            <Button
              title="Continue Editing"
              onPress={onContinueEditing}
              style={styles.continueButton}
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
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  discardButton: {
    flex: 1,
    borderColor: colors.danger,
  },
  continueButton: {
    flex: 1,
  },
});
