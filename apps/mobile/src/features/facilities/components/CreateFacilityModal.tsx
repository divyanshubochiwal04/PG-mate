import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { UnsavedChangesModal } from '../../../components/ui/UnsavedChangesModal';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../api/error';
import type { CreateFacilityInput } from '../api/facilities.api';

interface CreateFacilityModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFacilityInput) => Promise<void>;
}

type FacilityCategory = 'GENERAL' | 'UTILITY' | 'SAFETY' | 'COMFORT';

const CATEGORIES: FacilityCategory[] = ['GENERAL', 'UTILITY', 'SAFETY', 'COMFORT'];

export function CreateFacilityModal({
  visible,
  onClose,
  onSubmit,
}: CreateFacilityModalProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<FacilityCategory>('GENERAL');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  const isDirty = name !== '' || code !== '' || description !== '';

  const handleAttemptClose = () => {
    if (isDirty && !isSubmitting) {
      setShowUnsavedPrompt(true);
    } else {
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setName('');
    setCode('');
    setCategory('GENERAL');
    setDescription('');
    setError(null);
    setShowUnsavedPrompt(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Facility name is required');
    if (!code.trim()) return setError('Facility code is required');

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        description: description.trim() || undefined,
      });
      resetAndClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create facility'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleAttemptClose}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Create Catalog Facility</Text>
            <Text style={styles.subtitle}>
              Define an amenity or facility in your organization catalog.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <ScrollView style={styles.form}>
              <TextInput
                label="Facility Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g. High-Speed Wi-Fi"
              />
              <TextInput
                label="Facility Code *"
                value={code}
                onChangeText={setCode}
                placeholder="e.g. WIFI"
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, category === cat && styles.activeChip]}
                    onPress={() => setCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select category ${cat}`}
                  >
                    <Text style={[styles.chipText, category === cat && styles.activeChipText]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="Details about this facility"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.actions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleAttemptClose}
                style={styles.btn}
              />
              <Button
                title="Create Facility"
                isLoading={isSubmitting}
                onPress={handleSubmit}
                style={styles.btn}
              />
            </View>
          </View>
        </View>
      </Modal>

      <UnsavedChangesModal
        visible={showUnsavedPrompt}
        onContinueEditing={() => setShowUnsavedPrompt(false)}
        onDiscard={resetAndClose}
      />
    </>
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
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  form: {
    maxHeight: 340,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.mutedBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontWeight: '600',
  },
  activeChipText: {
    color: colors.primaryForeground,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: {
    flex: 1,
  },
});
