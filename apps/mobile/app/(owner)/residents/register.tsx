import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BillingCycle, EmergencyRelationship, Gender } from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
import { Card } from '../../../src/components/ui/Card';
import { usePropertyContext } from '../../../src/context/property-context';
import { RegistrationProgress } from '../../../src/features/residents/components/RegistrationProgress';
import { LocationBedSelector } from '../../../src/features/residents/components/LocationBedSelector';
import {
  createEmergencyContactApi,
  createResidentApi,
} from '../../../src/features/residents/api/residents.api';
import { getBuildingsApi } from '../../../src/features/buildings/api/buildings.api';
import { getFloorsApi } from '../../../src/features/floors/api/floors.api';
import { getRoomsApi } from '../../../src/features/rooms/api/rooms.api';
import { getBedsApi } from '../../../src/features/beds/api/beds.api';
import { getFacilitiesApi } from '../../../src/features/facilities/api/facilities.api';
import { getResidentsApi } from '../../../src/features/residents/api/residents.api';
import { checkInCommercialApi } from '../../../src/features/commercial/api/commercial.api';
import type { AddAdditionalChargeInput } from '../../../src/features/commercial/api/commercial.api';
import { colors, spacing, typography } from '../../../src/theme';

import { useMealPlans, useMesses } from '../../../src/features/mess/hooks/useMess';
import { getErrorMessage } from '../../../src/api/error';
import { getPropertiesApi } from '../../../src/features/properties/api/properties.api';

// Format phone number to E.164 (+91XXXXXXXXXX) automatically
function formatPhoneE164(raw: string): string {
  const cleaned = raw.trim().replace(/[\s\-()]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  return `+${cleaned}`;
}

// Validate 10-digit Indian phone or E.164 phone
function isValidPhone(raw: string): boolean {
  const cleaned = raw.trim().replace(/[\s\-()]/g, '');
  if (!cleaned) return false;
  return /^[6-9]\d{9}$/.test(cleaned) || /^\+[1-9]\d{9,14}$/.test(cleaned);
}

// Validate email format
function isValidEmail(raw: string): boolean {
  if (!raw.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

export default function RegisterResidentWizardScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedPropertyId } = usePropertyContext();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Property & Location state
  const [propertyId, setPropertyId] = useState<string | null>(selectedPropertyId ?? null);

  // Step 1 — Personal State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');

  // Step 2 — Emergency State
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] =
    useState<EmergencyRelationship>('PARENT');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Step 3 — Location State
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [bedId, setBedId] = useState<string | null>(null);

  // Step 4 — Stay State
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Step 5 — Resident Facilities State
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);

  // Step 6 — Pricing State
  const [baseRentStr, setBaseRentStr] = useState('8000');
  const [depositStr, setDepositStr] = useState('8000');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('JOINING_DATE');
  const [extraChargeDesc, setExtraChargeDesc] = useState('');
  const [extraChargeAmount, setExtraChargeAmount] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState<AddAdditionalChargeInput[]>([]);

  // Step 7 — Mess State
  const [messEnabled, setMessEnabled] = useState(false);
  const [selectedMessId, setSelectedMessId] = useState<string | null>(null);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<string | null>(null);

  const { data: messesList } = useMesses();
  const activeMessObj =
    (messesList || []).find((m) => m.id === selectedMessId) || (messesList || [])[0];
  const { data: mealPlansList } = useMealPlans(activeMessObj?.id);

  // Properties Query
  const { data: propertiesRes } = useQuery({
    queryKey: ['properties', 'wizard'],
    queryFn: () => getPropertiesApi({ page: 1, pageSize: 50 }),
  });

  const activePropertyId = propertyId || selectedPropertyId;

  // Queries for Location Selector & Catalog Facilities
  const { data: bRes } = useQuery({
    queryKey: ['buildings', 'wizard', activePropertyId],
    queryFn: () => (activePropertyId ? getBuildingsApi(activePropertyId) : null),
    enabled: !!activePropertyId,
  });

  const { data: fRes } = useQuery({
    queryKey: ['floors', 'wizard', buildingId],
    queryFn: () => (buildingId ? getFloorsApi(buildingId) : null),
    enabled: !!buildingId,
  });

  const { data: rRes } = useQuery({
    queryKey: ['rooms', 'wizard', floorId],
    queryFn: () => (floorId ? getRoomsApi(floorId) : null),
    enabled: !!floorId,
  });

  const { data: bedRes, isLoading: isLoadingBeds } = useQuery({
    queryKey: ['beds', 'wizard', roomId],
    queryFn: () => (roomId ? getBedsApi(roomId) : null),
    enabled: !!roomId,
  });

  const { data: catalogFacRes } = useQuery({
    queryKey: ['facilities', 'catalog'],
    queryFn: () => getFacilitiesApi(),
  });

  const { data: activeRes } = useQuery({
    queryKey: ['residents', 'occupants'],
    queryFn: () => getResidentsApi({ status: 'ACTIVE', page: 1, pageSize: 100 }),
  });

  const occupantMap: Record<string, string> = {};
  (activeRes?.items || []).forEach((r) => {
    if (r.currentLocation?.bedId) {
      occupantMap[r.currentLocation.bedId] = `${r.firstName} ${r.lastName}`;
    }
  });

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateCurrentStep = (currentStep: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!firstName.trim()) {
        stepErrors['firstName'] = 'First name is required.';
      }
      if (!lastName.trim()) {
        stepErrors['lastName'] = 'Last name is required.';
      }
      if (!phone.trim()) {
        stepErrors['phone'] = 'Mobile number is required.';
      } else if (!isValidPhone(phone)) {
        stepErrors['phone'] = 'Enter valid 10-digit mobile (e.g. 9876543210).';
      }
      if (email.trim() && !isValidEmail(email)) {
        stepErrors['email'] = 'Enter a valid email address (e.g. name@example.com).';
      }
    }

    if (currentStep === 2) {
      if (emergencyPhone.trim() && !isValidPhone(emergencyPhone)) {
        stepErrors['emergencyPhone'] = 'Enter valid 10-digit emergency phone number.';
      }
      if (emergencyPhone.trim() && !emergencyName.trim()) {
        stepErrors['emergencyName'] = 'Contact name is required if phone is provided.';
      }
    }

    if (currentStep === 3) {
      if (!bedId) {
        stepErrors['bedId'] = 'Please select an available physical bed to proceed.';
      }
    }

    if (currentStep === 4) {
      if (!admissionDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(admissionDate.trim())) {
        stepErrors['admissionDate'] = 'Admission date must be YYYY-MM-DD format.';
      }
    }

    if (currentStep === 6) {
      const baseRent = parseFloat(baseRentStr);
      if (!baseRentStr.trim() || isNaN(baseRent) || baseRent <= 0) {
        stepErrors['baseRent'] = 'Base rent must be greater than 0.';
      }
      const deposit = parseFloat(depositStr);
      if (depositStr.trim() && (isNaN(deposit) || deposit < 0)) {
        stepErrors['deposit'] = 'Deposit cannot be negative.';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      // 1. Create resident with normalized E.164 phone
      const normalizedPhone = formatPhoneE164(phone);
      const resident = await createResidentApi({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: normalizedPhone,
        email: email.trim() || undefined,
        gender,
      });

      // 2. Add emergency contact if provided
      if (emergencyName.trim() && emergencyPhone.trim()) {
        const normalizedEmergencyPhone = formatPhoneE164(emergencyPhone);
        await createEmergencyContactApi(resident.id, {
          name: emergencyName.trim(),
          relationship: emergencyRelationship,
          phone: normalizedEmergencyPhone,
          isPrimary: true,
        });
      }

      // 3. Perform atomic check-in + commercial terms registration if bed selected
      if (bedId) {
        const baseRentAmount = parseFloat(baseRentStr) || 0;
        const securityDepositAmount = parseFloat(depositStr) || 0;

        await checkInCommercialApi({
          residentId: resident.id,
          bedId,
          admissionDate: admissionDate.trim(),
          notes: notes.trim() || undefined,
          baseRentAmount,
          securityDepositAmount,
          billingCycle,
          facilityIds: selectedFacilityIds,
          additionalCharges,
          messSubscription:
            messEnabled && (selectedMessId || activeMessObj?.id) && selectedMealPlanId
              ? {
                  messId: selectedMessId || activeMessObj?.id || '',
                  mealPlanId: selectedMealPlanId,
                }
              : undefined,
        });
      }

      return resident;
    },
    onSuccess: (resident) => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['resident', resident.id] });
      queryClient.invalidateQueries({ queryKey: ['stays'] });
      queryClient.invalidateQueries({ queryKey: ['resident-commercial'] });
      queryClient.invalidateQueries({ queryKey: ['mess'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['building-tree'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-tree'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      Alert.alert('Registration Successful', `${firstName} ${lastName} has been registered.`);
      router.replace(`/(owner)/residents/${resident.id}`);
    },
    onError: (err: unknown) => {
      Alert.alert(
        'Registration Failed',
        getErrorMessage(err, 'Failed to complete resident registration & check-in.')
      );
    },
  });

  const toggleFacilitySelect = (id: string) => {
    if (selectedFacilityIds.includes(id)) {
      setSelectedFacilityIds(selectedFacilityIds.filter((fId) => fId !== id));
    } else {
      setSelectedFacilityIds([...selectedFacilityIds, id]);
    }
  };

  const handleAddCharge = () => {
    const amt = parseFloat(extraChargeAmount);
    if (!extraChargeDesc.trim() || isNaN(amt) || amt <= 0) return;
    setAdditionalCharges([
      ...additionalCharges,
      { chargeType: 'CUSTOM', description: extraChargeDesc.trim(), amount: amt, isRecurring: true },
    ]);
    setExtraChargeDesc('');
    setExtraChargeAmount('');
  };

  const handleNext = () => {
    const isValid = validateCurrentStep(step);
    if (!isValid) return;

    if (step < 8) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      Alert.alert('Discard Registration?', 'Entered data will be lost.', [
        { text: 'Continue Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    }
  };

  const catalogFacilities = catalogFacRes?.items || [];
  const totalChargeAmount = additionalCharges.reduce((acc, c) => acc + c.amount, 0);
  const calculatedTotal = (parseFloat(baseRentStr) || 0) + totalChargeAmount;

  return (
    <Screen style={styles.screen}>
      <RegistrationProgress currentStep={step} onSelectStep={(s) => setStep(s)} />

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <Card style={styles.card}>
            <Text style={styles.stepTitle}>1. Personal Information</Text>
            <TextInput
              label="First Name *"
              value={firstName}
              onChangeText={(v) => {
                setFirstName(v);
                clearFieldError('firstName');
              }}
              error={errors['firstName']}
              placeholder="e.g. Rahul"
            />
            <TextInput
              label="Last Name *"
              value={lastName}
              onChangeText={(v) => {
                setLastName(v);
                clearFieldError('lastName');
              }}
              error={errors['lastName']}
              placeholder="e.g. Sharma"
            />
            <TextInput
              label="Phone Number *"
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                clearFieldError('phone');
              }}
              error={errors['phone']}
              helperText="Enter 10-digit mobile number (e.g. 9876543210)"
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
            />
            <TextInput
              label="Email Address (Optional)"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearFieldError('email');
              }}
              error={errors['email']}
              placeholder="e.g. rahul@example.com"
              keyboardType="email-address"
            />
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, gender === g && styles.genderChipSelected]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {step === 2 && (
          <Card style={styles.card}>
            <Text style={styles.stepTitle}>2. Primary Emergency Contact</Text>
            <TextInput
              label="Contact Name"
              value={emergencyName}
              onChangeText={(v) => {
                setEmergencyName(v);
                clearFieldError('emergencyName');
              }}
              error={errors['emergencyName']}
              placeholder="e.g. Ramesh Sharma"
            />
            <TextInput
              label="Contact Phone"
              value={emergencyPhone}
              onChangeText={(v) => {
                setEmergencyPhone(v);
                clearFieldError('emergencyPhone');
              }}
              error={errors['emergencyPhone']}
              helperText="10-digit mobile number (e.g. 9876543210)"
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Relationship</Text>
            <View style={styles.genderRow}>
              {(
                ['PARENT', 'GUARDIAN', 'SIBLING', 'SPOUSE', 'FRIEND'] as EmergencyRelationship[]
              ).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.genderChip,
                    emergencyRelationship === r && styles.genderChipSelected,
                  ]}
                  onPress={() => setEmergencyRelationship(r)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      emergencyRelationship === r && styles.genderTextSelected,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {step === 3 && (
          <Card style={styles.card}>
            <Text style={styles.stepTitle}>3. Location & Visual Bed Selection</Text>
            {Boolean(errors['bedId']) && (
              <View style={styles.errorAlertBox}>
                <Text style={styles.errorAlertText}>⚠️ {errors['bedId']}</Text>
              </View>
            )}
            <LocationBedSelector
              properties={propertiesRes?.items || []}
              selectedPropertyId={activePropertyId}
              onSelectProperty={setPropertyId}
              buildings={bRes?.items || []}
              floors={fRes?.items || []}
              rooms={rRes?.items || []}
              beds={bedRes?.items || []}
              selectedBuildingId={buildingId}
              selectedFloorId={floorId}
              selectedRoomId={roomId}
              selectedBedId={bedId}
              occupantMap={occupantMap}
              isLoading={isLoadingBeds}
              onSelectBuilding={setBuildingId}
              onSelectFloor={setFloorId}
              onSelectRoom={setRoomId}
              onSelectBed={(id) => {
                setBedId(id);
                clearFieldError('bedId');
              }}
            />
          </Card>
        )}

        {step === 4 && (
          <Card style={styles.card}>
            <Text style={styles.stepTitle}>4. Stay & Admission Details</Text>
            <TextInput
              label="Admission Date (YYYY-MM-DD) *"
              value={admissionDate}
              onChangeText={(v) => {
                setAdmissionDate(v);
                clearFieldError('admissionDate');
              }}
              error={errors['admissionDate']}
              placeholder="e.g. 2026-08-18"
            />
            <TextInput label="Admission Notes / Remarks" value={notes} onChangeText={setNotes} />
          </Card>
        )}

        {step === 5 && (
          <Card style={styles.card}>
            <Text style={styles.stepTitle}>5. Resident Facilities Selection</Text>
            <Text style={styles.label}>Select amenities included for this resident:</Text>
            <View style={styles.chipGrid}>
              {catalogFacilities.map((f) => {
                const isSel = selectedFacilityIds.includes(f.id);
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.facChip, isSel && styles.facChipSelected]}
                    onPress={() => toggleFacilitySelect(f.id)}
                  >
                    <Text style={[styles.facText, isSel && styles.facTextSelected]}>
                      {isSel ? '✓ ' : '+ '}
                      {f.name} ({f.code})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {step === 6 && (
          <Card style={styles.card}>
            <Text style={styles.stepTitle}>6. Rent & Pricing Configuration</Text>
            <TextInput
              label="Monthly Base Rent (₹) *"
              value={baseRentStr}
              onChangeText={(v) => {
                setBaseRentStr(v);
                clearFieldError('baseRent');
              }}
              error={errors['baseRent']}
              keyboardType="numeric"
            />
            <TextInput
              label="Security Deposit (₹)"
              value={depositStr}
              onChangeText={(v) => {
                setDepositStr(v);
                clearFieldError('deposit');
              }}
              error={errors['deposit']}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Billing Cycle</Text>
            <View style={styles.genderRow}>
              {(['JOINING_DATE', 'FIRST_OF_MONTH'] as BillingCycle[]).map((bc) => (
                <TouchableOpacity
                  key={bc}
                  style={[styles.genderChip, billingCycle === bc && styles.genderChipSelected]}
                  onPress={() => setBillingCycle(bc)}
                >
                  <Text
                    style={[styles.genderText, billingCycle === bc && styles.genderTextSelected]}
                  >
                    {bc === 'JOINING_DATE' ? 'Joining Date' : '1st of Month'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: spacing.sm }]}>
              Add Recurring Charge (Optional)
            </Text>
            <View style={styles.addChargeRow}>
              <TextInput
                style={{ flex: 2 }}
                placeholder="Charge Name (e.g. Parking)"
                value={extraChargeDesc}
                onChangeText={setExtraChargeDesc}
              />
              <TextInput
                style={{ flex: 1 }}
                placeholder="Amount"
                value={extraChargeAmount}
                onChangeText={setExtraChargeAmount}
                keyboardType="numeric"
              />
              <Button title="Add" onPress={handleAddCharge} style={{ height: 44 }} />
            </View>

            {additionalCharges.map((c, idx) => (
              <Text key={idx} style={styles.chargeSummaryText}>
                • {c.description}: ₹{c.amount}/mo
              </Text>
            ))}
          </Card>
        )}

        {step === 7 && (
          <Card style={styles.card}>
            <Text style={styles.stepTitle}>7. Mess Meal Subscription</Text>
            <Text style={styles.label}>Subscribe this resident to Mess facilities?</Text>

            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderChip, messEnabled && styles.genderChipSelected]}
                onPress={() => {
                  setMessEnabled(true);
                  if (messesList?.[0] && !selectedMessId) setSelectedMessId(messesList[0].id);
                }}
              >
                <Text style={[styles.genderText, messEnabled && styles.genderTextSelected]}>
                  YES — Subscribe
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderChip, !messEnabled && styles.genderChipSelected]}
                onPress={() => setMessEnabled(false)}
              >
                <Text style={[styles.genderText, !messEnabled && styles.genderTextSelected]}>
                  NO — Opt Out
                </Text>
              </TouchableOpacity>
            </View>

            {messEnabled && (
              <>
                <Text style={[styles.label, { marginTop: spacing.sm }]}>Select Mess Facility:</Text>
                <View style={styles.chipGrid}>
                  {(messesList || []).map((m) => {
                    const isSel = (selectedMessId || activeMessObj?.id) === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.facChip, isSel && styles.facChipSelected]}
                        onPress={() => {
                          setSelectedMessId(m.id);
                          setSelectedMealPlanId(null);
                        }}
                      >
                        <Text style={[styles.facText, isSel && styles.facTextSelected]}>
                          {m.name} ({m.code})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.label, { marginTop: spacing.sm }]}>
                  Select Configured Meal Plan:
                </Text>
                <View style={styles.chipGrid}>
                  {(mealPlansList || []).map((p) => {
                    const isSel = selectedMealPlanId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.facChip, isSel && styles.facChipSelected]}
                        onPress={() => setSelectedMealPlanId(p.id)}
                      >
                        <Text style={[styles.facText, isSel && styles.facTextSelected]}>
                          {p.name} — ₹{p.price} ({p.billingMode})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </Card>
        )}

        {step === 8 && (
          <Card style={styles.card}>
            <Text style={styles.stepTitle}>8. Review & Confirm Registration</Text>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Resident Name:</Text>
              <Text style={styles.reviewValue}>
                {firstName} {lastName}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Phone:</Text>
              <Text style={styles.reviewValue}>{phone}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Mess Subscription:</Text>
              <Text style={styles.reviewValue}>
                {messEnabled && selectedMealPlanId
                  ? `${mealPlansList?.find((p) => p.id === selectedMealPlanId)?.name || 'Subscribed'}`
                  : 'Not Subscribed'}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Monthly Base Rent:</Text>
              <Text style={styles.reviewValue}>
                ₹{(parseFloat(baseRentStr) || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Total Monthly Payable:</Text>
              <Text style={[styles.reviewValue, { color: colors.primary }]}>
                ₹{calculatedTotal.toLocaleString('en-IN')}
              </Text>
            </View>
          </Card>
        )}

        <View style={styles.navRow}>
          <Button title="← Back" variant="outline" onPress={handleBack} style={{ flex: 1 }} />
          {step < 8 ? (
            <Button title="Next →" onPress={handleNext} style={{ flex: 1 }} />
          ) : (
            <Button
              title={registerMutation.isPending ? 'Registering...' : 'REGISTER RESIDENT'}
              disabled={registerMutation.isPending}
              onPress={() => registerMutation.mutate()}
              style={{ flex: 1.5 }}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 72 },
  card: { padding: spacing.md, marginBottom: spacing.md },
  stepTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  label: { fontSize: typography.fontSize.xs, color: colors.muted, marginVertical: 4 },
  genderRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  genderChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  genderChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderText: { fontSize: typography.fontSize.xs, color: colors.text },
  genderTextSelected: { color: colors.primaryForeground, fontWeight: typography.fontWeight.bold },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: spacing.xs },
  facChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  facChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  facText: { fontSize: typography.fontSize.xs, color: colors.text },
  facTextSelected: { color: colors.primaryForeground, fontWeight: typography.fontWeight.bold },
  addChargeRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  chargeSummaryText: { fontSize: typography.fontSize.xs, color: colors.text, marginVertical: 2 },
  errorAlertBox: {
    backgroundColor: colors.danger + '15',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorAlertText: {
    fontSize: typography.fontSize.xs,
    color: colors.danger,
    fontWeight: typography.fontWeight.bold,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewLabel: { fontSize: typography.fontSize.xs, color: colors.muted },
  reviewValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
