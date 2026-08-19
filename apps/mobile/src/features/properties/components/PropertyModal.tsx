import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PropertyDto } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { UnsavedChangesModal } from '../../../components/ui/UnsavedChangesModal';
import { getErrorMessage } from '../../../api/error';
import { colors, spacing, typography } from '../../../theme';
import type { CreatePropertyInput, UpdatePropertyInput } from '../api/properties.api';

interface PropertyModalProps {
  visible: boolean;
  property?: PropertyDto | null;
  onClose: () => void;
  onSubmitCreate: (data: CreatePropertyInput) => Promise<void>;
  onSubmitUpdate: (id: string, data: UpdatePropertyInput) => Promise<void>;
}

export function PropertyModal({
  visible,
  property,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: PropertyModalProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  const isEdit = !!property;

  useEffect(() => {
    if (visible) {
      if (property) {
        setName(property.name);
        setCode(property.code);
        setAddressLine1(property.address.addressLine1);
        setLocality(property.address.locality);
        setCity(property.address.city);
        setState(property.address.state);
        setPostalCode(property.address.postalCode);
      } else {
        setName('');
        setCode('');
        setAddressLine1('');
        setLocality('');
        setCity('');
        setState('');
        setPostalCode('');
      }
      setError(null);
      setShowUnsavedPrompt(false);
    }
  }, [visible, property]);

  const isDirty = property
    ? name !== property.name ||
      addressLine1 !== property.address.addressLine1 ||
      locality !== property.address.locality ||
      city !== property.address.city ||
      state !== property.address.state ||
      postalCode !== property.address.postalCode
    : name !== '' || code !== '' || addressLine1 !== '';

  const handleAttemptClose = () => {
    if (isDirty && !isSubmitting) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Property name is required');
    if (!isEdit && !code.trim()) return setError('Property code is required');
    if (!addressLine1.trim()) return setError('Address Line 1 is required');

    setError(null);
    setIsSubmitting(true);
    try {
      if (isEdit && property) {
        await onSubmitUpdate(property.id, {
          name: name.trim(),
          addressLine1: addressLine1.trim(),
          locality: locality.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
        });
      } else {
        await onSubmitCreate({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          addressLine1: addressLine1.trim(),
          locality: locality.trim() || 'Default Locality',
          city: city.trim() || 'Default City',
          state: state.trim() || 'Default State',
          postalCode: postalCode.trim() || '000000',
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Operation failed'));
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
            <Text style={styles.title}>{isEdit ? 'Edit Property' : 'Create New Property'}</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
              <TextInput
                label="Property Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Green Heights PG"
              />
              {!isEdit ? (
                <TextInput
                  label="Property Code *"
                  value={code}
                  onChangeText={setCode}
                  placeholder="e.g. GHPG"
                />
              ) : null}
              <TextInput
                label="Address Line 1 *"
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholder="Street address"
              />
              <TextInput
                label="Locality"
                value={locality}
                onChangeText={setLocality}
                placeholder="Area / Sector"
              />
              <TextInput label="City" value={city} onChangeText={setCity} placeholder="City" />
              <TextInput label="State" value={state} onChangeText={setState} placeholder="State" />
              <TextInput
                label="Postal Code"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="numeric"
                placeholder="6-digit PIN"
              />
            </ScrollView>

            <View style={styles.actions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleAttemptClose}
                style={styles.actionBtn}
              />
              <Button
                title={isEdit ? 'Save Changes' : 'Create Property'}
                isLoading={isSubmitting}
                onPress={handleSubmit}
                style={styles.actionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      <UnsavedChangesModal
        visible={showUnsavedPrompt}
        onContinueEditing={() => setShowUnsavedPrompt(false)}
        onDiscard={() => {
          setShowUnsavedPrompt(false);
          onClose();
        }}
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
    marginBottom: spacing.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  form: {
    maxHeight: 380,
  },
  formContent: {
    paddingVertical: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
