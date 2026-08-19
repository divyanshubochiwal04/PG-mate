import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TaskPriority } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { getErrorMessage } from '../../../api/error';
import { colors, radius, spacing, typography } from '../../../design-system';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (dto: {
    title: string;
    description?: string | null;
    priority: TaskPriority;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateTaskModal({
  visible,
  onClose,
  onCreate,
  isSubmitting = false,
}: CreateTaskModalProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a task title.');
      return;
    }
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || null,
        priority,
      });
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      onClose();
      Alert.alert('Success', 'Task created successfully.');
    } catch (err: unknown) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to create task'));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={typography.h2}>Create Follow-up Task</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            label="Task Title *"
            placeholder="e.g. Inspect Room 204 AC"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            label="Description (Optional)"
            placeholder="Details of the operational follow-up..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.priorityLabel}>Priority</Text>
          <View style={styles.priorityGrid}>
            {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.pChip, priority === p && styles.pChipActive]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.pChipText, priority === p && styles.pChipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button
              title="Create Task"
              loading={isSubmitting}
              onPress={handleCreateTask}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    gap: spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  priorityLabel: {
    ...typography.smallBold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  pChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surface,
  },
  pChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pChipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pChipTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
