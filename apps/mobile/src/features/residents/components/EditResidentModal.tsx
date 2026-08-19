import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { EmergencyRelationship, Gender, ResidentDto } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../api/error';

export interface EditResidentFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: Gender;
  emergencyName: string;
  emergencyRelationship: EmergencyRelationship;
  emergencyPhone: string;
}

interface EditResidentModalProps {
  visible: boolean;
  resident: ResidentDto | null;
  isSaving: boolean;
  onSave: (values: EditResidentFormValues) => Promise<void>;
  onClose: () => void;
}

export function EditResidentModal({
  visible,
  resident,
  isSaving,
  onSave,
  onClose,
}: EditResidentModalProps): React.JSX.Element | null {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');

  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState<EmergencyRelationship>('PARENT');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (resident) {
      setFirstName(resident.firstName || '');
      setLastName(resident.lastName || '');
      setPhone(resident.phone || '');
      setEmail(resident.email || '');
      setGender(resident.gender || 'MALE');

      const contact = resident.primaryEmergencyContact;
      setEmergencyName(contact?.name || '');
      setEmergencyRelationship(contact?.relationship || 'PARENT');
      setEmergencyPhone(contact?.phone || '');
      setErrorMsg(null);
    }
  }, [resident, visible]);

  if (!visible || !resident) return null;

  const handleSubmit = async () => {
    setErrorMsg(null);

    if (!firstName.trim()) {
      setErrorMsg('First Name is required');
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg('Last Name is required');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone Number is required');
      return;
    }

    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gender,
        emergencyName: emergencyName.trim(),
        emergencyRelationship,
        emergencyPhone: emergencyPhone.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'Failed to update resident profile'));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>✏️ Edit Resident Profile</Text>
            <TouchableOpacity onPress={onClose} disabled={isSaving}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Personal Details */}
            <Text style={styles.sectionHeader}>PERSONAL DETAILS</Text>

            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="e.g. Rahul"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="e.g. Sharma"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. +919876543210"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. rahul@example.com"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, gender === g && styles.chipSelected]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextSelected]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Emergency Contact */}
            <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              PRIMARY EMERGENCY CONTACT
            </Text>

            <Text style={styles.label}>Contact Name</Text>
            <TextInput
              style={styles.input}
              value={emergencyName}
              onChangeText={setEmergencyName}
              placeholder="e.g. Rajesh Sharma"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Relationship</Text>
            <View style={styles.chipRow}>
              {(['PARENT', 'GUARDIAN', 'SIBLING', 'SPOUSE', 'FRIEND', 'OTHER'] as EmergencyRelationship[]).map(
                (r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, emergencyRelationship === r && styles.chipSelected]}
                    onPress={() => setEmergencyRelationship(r)}
                  >
                    <Text style={[styles.chipText, emergencyRelationship === r && styles.chipTextSelected]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              keyboardType="phone-pad"
              placeholder="e.g. +919876543211"
              placeholderTextColor={colors.muted}
            />
          </ScrollView>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              disabled={isSaving}
              style={{ flex: 1 }}
            />
            <Button
              title={isSaving ? 'Saving...' : 'Save Changes'}
              onPress={handleSubmit}
              disabled={isSaving}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.md,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.muted,
    padding: spacing.xs,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.mutedBackground,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.primaryForeground,
    fontWeight: typography.fontWeight.bold,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: spacing.xs,
    marginVertical: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: '#991B1B',
    fontWeight: typography.fontWeight.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
