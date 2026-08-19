import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MealPlanDto, MessDto } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { useMealPlans, useMesses } from '../hooks/useMess';
import { colors, spacing, typography } from '../../../theme';

interface MessSubscriptionWizardModalProps {
  visible: boolean;
  mode: 'CREATE' | 'CHANGE';
  onConfirm: (dto: { messId: string; mealPlanId: string; startDate?: string }) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function MessSubscriptionWizardModal({
  visible,
  mode,
  onConfirm,
  onClose,
  isLoading,
}: MessSubscriptionWizardModalProps): React.JSX.Element {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMess, setSelectedMess] = useState<MessDto | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<MealPlanDto | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: messes = [], isLoading: isLoadingMesses } = useMesses();
  const { data: mealPlans = [], isLoading: isLoadingPlans } = useMealPlans(selectedMess?.id);

  const resetState = () => {
    setStep(1);
    setSelectedMess(null);
    setSelectedPlan(null);
    setStartDate(new Date().toISOString().split('T')[0]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNextStep1 = (mess: MessDto) => {
    setSelectedMess(mess);
    setSelectedPlan(null);
    setStep(2);
  };

  const handleNextStep2 = (plan: MealPlanDto) => {
    setSelectedPlan(plan);
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!selectedMess || !selectedPlan) return;
    await onConfirm({
      messId: selectedMess.id,
      mealPlanId: selectedPlan.id,
      startDate: startDate || undefined,
    });
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {mode === 'CREATE' ? '🍲 Add Mess Subscription' : '🔄 Change Mess Subscription'}
            </Text>
            <Text style={styles.stepBadge}>Step {step} of 3</Text>
          </View>

          {/* STEP 1: SELECT MESS */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Step 1: Select Mess Facility</Text>
              {isLoadingMesses ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
              ) : messes.length === 0 ? (
                <Text style={styles.emptyText}>No active mess facilities found.</Text>
              ) : (
                <ScrollView style={styles.listContainer}>
                  {messes.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.itemCard, selectedMess?.id === m.id && styles.itemCardSelected]}
                      onPress={() => handleNextStep1(m)}
                    >
                      <Text style={styles.itemName}>{m.name}</Text>
                      <Text style={styles.itemMeta}>Code: {m.code} • Scope: {m.scopeType}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* STEP 2: SELECT MEAL PLAN */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Step 2: Select Meal Plan</Text>
              <Text style={styles.subMeta}>Selected Mess: {selectedMess?.name}</Text>
              {isLoadingPlans ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
              ) : mealPlans.length === 0 ? (
                <Text style={styles.emptyText}>No configured meal plans for this mess.</Text>
              ) : (
                <ScrollView style={styles.listContainer}>
                  {mealPlans.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.itemCard, selectedPlan?.id === p.id && styles.itemCardSelected]}
                      onPress={() => handleNextStep2(p)}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.itemName}>{p.name}</Text>
                        <Text style={styles.priceTag}>₹{p.price.toLocaleString('en-IN')}</Text>
                      </View>
                      <Text style={styles.itemMeta}>
                        Mode: {p.billingMode} • Included: {p.includedMealTypes}
                      </Text>
                      {p.description ? <Text style={styles.itemDesc}>{p.description}</Text> : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* STEP 3: REVIEW & CONFIRM */}
          {step === 3 && selectedMess && selectedPlan && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Step 3: Review Subscription</Text>
              <View style={styles.reviewBox}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Mess Facility:</Text>
                  <Text style={styles.reviewValue}>{selectedMess.name}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Meal Plan:</Text>
                  <Text style={styles.reviewValue}>{selectedPlan.name}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Billing Mode:</Text>
                  <Text style={styles.reviewValue}>{selectedPlan.billingMode}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Authoritative Price:</Text>
                  <Text style={styles.priceHighlight}>₹{selectedPlan.price.toLocaleString('en-IN')} / month</Text>
                </View>
              </View>

              <TextInput
                label="Effective Start Date (YYYY-MM-DD)"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          )}

          {/* BUTTON ACTIONS */}
          <View style={styles.btnRow}>
            {step > 1 ? (
              <Button
                title="Back"
                variant="outline"
                onPress={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                style={{ flex: 1 }}
              />
            ) : (
              <Button title="Cancel" variant="outline" onPress={handleClose} style={{ flex: 1 }} />
            )}

            {step === 3 && (
              <Button
                title={isLoading ? 'Submitting...' : mode === 'CREATE' ? 'Confirm Subscription' : 'Apply Plan Change'}
                disabled={isLoading || !startDate}
                onPress={handleConfirm}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  stepBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stepContent: {
    marginVertical: spacing.sm,
  },
  stepTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  subMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    fontStyle: 'italic',
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  listContainer: {
    maxHeight: 240,
    marginVertical: spacing.xs,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  priceTag: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  itemMeta: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 10,
    color: colors.text,
    marginTop: 4,
    fontStyle: 'italic',
  },
  reviewBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  reviewLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
  },
  reviewValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  priceHighlight: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});
