import React, { useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import type { AdditionalChargeType, ResidentFacilityType } from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import {
  checkOutApi,
  getEmergencyContactsApi,
  getResidentByIdApi,
  getResidentHistoryApi,
} from '../../../src/features/residents/api/residents.api';
import { getFacilitiesApi } from '../../../src/features/facilities/api/facilities.api';
import { ResidentLocationCard } from '../../../src/features/residents/components/ResidentLocationCard';
import { ResidentBillingSummaryCard } from '../../../src/features/billing/components/ResidentBillingSummaryCard';
import { useResidentCommercial } from '../../../src/features/commercial/hooks/useResidentCommercial';
import { CommercialSummaryCard } from '../../../src/features/commercial/components/CommercialSummaryCard';
import { CommercialHistoryModal } from '../../../src/features/commercial/components/CommercialHistoryModal';
import { AssignResidentFacilityModal } from '../../../src/features/commercial/components/AssignResidentFacilityModal';
import { AddChargeModal } from '../../../src/features/commercial/components/AddChargeModal';
import {
  addAdditionalChargeApi,
  assignResidentFacilityApi,
  cancelAdditionalChargeApi,
  createAgreementRevisionApi,
  revokeResidentFacilityApi,
} from '../../../src/features/commercial/api/commercial.api';
import {
  useCancelMessSubscription,
  useChangeMessSubscription,
  useCreateMessSubscription,
} from '../../../src/features/mess/hooks/useMess';
import { MessSubscriptionWizardModal } from '../../../src/features/mess/components/MessSubscriptionWizardModal';
import { useUpdateResident } from '../../../src/features/residents/hooks/useUpdateResident';
import { useTransferBed } from '../../../src/features/residents/hooks/useTransferBed';
import { EditResidentModal, type EditResidentFormValues } from '../../../src/features/residents/components/EditResidentModal';
import { TransferBedModal } from '../../../src/features/residents/components/TransferBedModal';
import { CheckOutModal } from '../../../src/features/residents/components/CheckOutModal';
import { ResidentTasksCard } from '../../../src/features/residents/components/ResidentTasksCard';
import { ResidentMessSubscriptionCard } from '../../../src/features/residents/components/ResidentMessSubscriptionCard';
import { ResidentLifecycleTimeline } from '../../../src/features/residents/components/ResidentLifecycleTimeline';
import { WhatsAppReminderModal, type WhatsAppReminderData } from '../../../src/features/billing/components/WhatsAppReminderModal';
import { InvoiceReceiptModal, type ReceiptData } from '../../../src/features/billing/components/InvoiceReceiptModal';
import { useResidentFinancialSummary } from '../../../src/features/billing/hooks/useBilling';
import { getErrorMessage } from '../../../src/api/error';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function ResidentProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [historyVisible, setHistoryVisible] = useState(false);
  const [assignFacVisible, setAssignFacVisible] = useState(false);
  const [addChargeVisible, setAddChargeVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [transferVisible, setTransferVisible] = useState(false);
  const [messWizardVisible, setMessWizardVisible] = useState(false);
  const [messWizardMode, setMessWizardMode] = useState<'CREATE' | 'CHANGE'>('CREATE');
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);

  // New Remind & Receipt Modals
  const [reminderVisible, setReminderVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const updateResidentMutation = useUpdateResident(id || '');
  const transferBedMutation = useTransferBed(id || '');
  const createMessSubMutation = useCreateMessSubscription(id || '');
  const changeMessSubMutation = useChangeMessSubscription(id || '');
  const cancelMessSubMutation = useCancelMessSubscription(id || '');

  const handleSaveProfile = async (values: EditResidentFormValues) => {
    if (!id) return;
    await updateResidentMutation.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      email: values.email || undefined,
      gender: values.gender,
      emergencyContact: values.emergencyName
        ? {
            name: values.emergencyName,
            relationship: values.emergencyRelationship,
            phone: values.emergencyPhone,
          }
        : undefined,
    });
    refetch();
    refetchContacts();
  };

  const isValidId = Boolean(id && id !== 'index' && id !== 'undefined' && id.trim().length > 0);

  const {
    data: resident,
    isLoading: isLoadingResident,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['resident', id],
    queryFn: () => (isValidId ? getResidentByIdApi(id) : null),
    enabled: isValidId,
  });

  const { data: historyData } = useQuery({
    queryKey: ['resident-history', id],
    queryFn: () => (isValidId ? getResidentHistoryApi(id) : null),
    enabled: isValidId,
  });

  const { data: emergencyContacts = [], refetch: refetchContacts } = useQuery({
    queryKey: ['resident-emergency-contacts', id],
    queryFn: () => (isValidId ? getEmergencyContactsApi(id) : []),
    enabled: isValidId,
  });

  const { data: catalogFacRes } = useQuery({
    queryKey: ['facilities', 'catalog'],
    queryFn: () => getFacilitiesApi(),
  });

  const {
    summary,
    isLoadingSummary,
    history: commercialHistory,
    refetchSummary,
  } = useResidentCommercial(isValidId ? id : undefined);

  const checkoutMutation = useMutation({
    mutationFn: async (input?: { actualCheckoutDate?: string; notes?: string }) => {
      const activeStay = resident?.currentLocation?.stayId;
      if (!activeStay) throw new Error('Resident has no active stay to check out.');
      return checkOutApi(activeStay, {
        actualCheckoutDate: input?.actualCheckoutDate,
        notes: input?.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resident', id] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['stays'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['building-tree'] });
      queryClient.invalidateQueries({ queryKey: ['building-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['resident-commercial', id] });
      queryClient.invalidateQueries({ queryKey: ['mess-subscription', id] });
      queryClient.invalidateQueries({ queryKey: ['billing', id] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'resident-summary', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setCheckoutModalVisible(false);
      Alert.alert('Checkout Complete', 'Resident has been checked out successfully.');
    },
    onError: (err: unknown) => {
      Alert.alert('Checkout Failed', getErrorMessage(err, 'Failed to checkout resident'));
    },
  });

  const handleRevisePricingPrompt = () => {
    Alert.prompt(
      'Revise Monthly Base Rent',
      'Enter new agreed monthly base rent amount (₹):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Revision',
          onPress: async (val?: string) => {
            const num = parseFloat(val || '');
            if (isNaN(num) || num < 0 || !id) {
              Alert.alert('Invalid Amount', 'Please enter a valid base rent number.');
              return;
            }
            try {
              await createAgreementRevisionApi(id, { baseRentAmount: num });
              refetchSummary();
              queryClient.invalidateQueries({ queryKey: ['resident-commercial-history', id] });
              Alert.alert('Pricing Revised', `New rent ₹${num.toLocaleString('en-IN')} is now active.`);
            } catch (e: unknown) {
              Alert.alert('Revision Failed', getErrorMessage(e, 'Failed to revise pricing'));
            }
          },
        },
      ],
      'plain-text',
      summary?.agreement?.baseRentAmount ? String(summary.agreement.baseRentAmount) : '8000'
    );
  };

  const handleAssignFacility = async (
    facilityId: string,
    facilityType: ResidentFacilityType,
    monthlyCharge: number
  ) => {
    if (!id) return;
    try {
      await assignResidentFacilityApi(id, { facilityId, facilityType, monthlyCharge });
      refetchSummary();
      Alert.alert('Facility Assigned', 'Catalog facility assigned to resident.');
    } catch (e: unknown) {
      Alert.alert('Assignment Failed', getErrorMessage(e, 'Failed to assign facility'));
    }
  };

  const handleRevokeFacility = (facilityId: string) => {
    if (!id) return;
    Alert.alert('Revoke Facility?', 'Are you sure you want to revoke this resident facility?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await revokeResidentFacilityApi(id, facilityId);
            refetchSummary();
          } catch (e: unknown) {
            Alert.alert('Revoke Failed', getErrorMessage(e, 'Failed to revoke facility'));
          }
        },
      },
    ]);
  };

  const handleAddCharge = async (
    chargeType: AdditionalChargeType,
    description: string,
    amount: number,
    isRecurring: boolean
  ) => {
    if (!id) return;
    try {
      await addAdditionalChargeApi(id, { chargeType, description, amount, isRecurring });
      refetchSummary();
      Alert.alert('Charge Added', `Charge ${description} (₹${amount}) added.`);
    } catch (e: unknown) {
      Alert.alert('Add Charge Failed', getErrorMessage(e, 'Failed to add charge'));
    }
  };

  const handleCancelCharge = (chargeId: string) => {
    if (!id) return;
    Alert.alert('Cancel Charge?', 'Are you sure you want to cancel this charge?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Charge',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelAdditionalChargeApi(id, chargeId);
            refetchSummary();
          } catch (e: unknown) {
            Alert.alert('Cancel Failed', getErrorMessage(e, 'Failed to cancel charge'));
          }
        },
      },
    ]);
  };

  const handleConfirmMessWizard = async (dto: { messId: string; mealPlanId: string; startDate?: string }) => {
    try {
      if (messWizardMode === 'CREATE') {
        await createMessSubMutation.mutateAsync(dto);
        Alert.alert('Subscription Success', 'Resident subscribed to mess successfully.');
      } else {
        await changeMessSubMutation.mutateAsync(dto);
        Alert.alert('Plan Changed', 'Resident mess subscription plan changed successfully.');
      }
      refetch();
    } catch (e: unknown) {
      Alert.alert('Subscription Failed', getErrorMessage(e, 'Failed to update mess subscription'));
    }
  };

  const handleCancelMessSubscriptionPrompt = () => {
    Alert.alert(
      'Cancel Mess Subscription',
      'Are you sure you want to cancel the active mess subscription for this resident?',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMessSubMutation.mutateAsync({});
              refetch();
              Alert.alert('Subscription Cancelled', 'Mess subscription has been cancelled.');
            } catch (e: unknown) {
              Alert.alert('Cancellation Failed', getErrorMessage(e, 'Failed to cancel subscription'));
            }
          },
        },
      ]
    );
  };

  const loc = resident?.currentLocation;
  const stays = historyData?.stays || [];

  const handleTransferBed = async (targetBedId: string, notes?: string) => {
    if (!loc?.allocationId) return;
    await transferBedMutation.mutateAsync({
      allocationId: loc.allocationId,
      data: { targetBedId, notes },
    });
    refetch();
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              refetchSummary();
              refetchContacts();
            }}
          />
        }
      >
        {isLoadingResident ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={80} style={{ marginBottom: spacing.md }} />
            <SkeletonLoader height={140} style={{ marginBottom: spacing.md }} />
            <SkeletonLoader height={180} style={{ marginBottom: spacing.md }} />
          </View>
        ) : isError || !resident ? (
          <ErrorState
            title="Failed to load resident profile"
            error={error}
            onRetry={refetch}
          />
        ) : (
          <View>
            {/* Resident Identity Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={typography.h2}>
                  {resident.firstName} {resident.lastName}
                </Text>
                <Text style={styles.codeText}>Code: {resident.residentCode}</Text>
              </View>
              <StatusBadge status={resident.status} label={resident.status} />
            </View>

            {/* Current Location Card */}
            <ResidentLocationCard location={loc} />

            {/* Commercial Summary Card */}
            <CommercialSummaryCard
              summary={summary || null}
              isLoading={isLoadingSummary}
              onRevisePricing={handleRevisePricingPrompt}
              onAssignFacility={() => setAssignFacVisible(true)}
              onAddCharge={() => setAddChargeVisible(true)}
              onViewHistory={() => setHistoryVisible(true)}
              onRevokeFacility={handleRevokeFacility}
              onCancelCharge={handleCancelCharge}
            />

            {/* Mess Subscription Card */}
            {id ? (
              <ResidentMessSubscriptionCard
                residentId={id}
                onOpenAdd={() => {
                  setMessWizardMode('CREATE');
                  setMessWizardVisible(true);
                }}
                onOpenChange={() => {
                  setMessWizardMode('CHANGE');
                  setMessWizardVisible(true);
                }}
                onCancel={handleCancelMessSubscriptionPrompt}
                isCancelling={cancelMessSubMutation.isPending}
              />
            ) : null}

            {/* Billing & Financial Ledger Summary Card */}
            {resident.id ? (
              <ResidentBillingSummaryCard
                residentId={resident.id}
                stayId={loc?.stayId}
                onOpenBillingTab={() => router.push('/(owner)/billing')}
              />
            ) : null}

            {/* Resident Tasks & Follow-ups Card */}
            {resident.id ? (
              <ResidentTasksCard
                residentId={resident.id}
                residentName={`${resident.firstName} ${resident.lastName}`}
              />
            ) : null}

            {/* Operational & Communication Actions */}
            <View style={styles.actionsRow}>
              {loc?.allocationId ? (
                <Button
                  title="Transfer Bed"
                  icon={<Ionicons name="swap-horizontal-outline" size={16} color={colors.surface} />}
                  style={{ flex: 1 }}
                  onPress={() => setTransferVisible(true)}
                />
              ) : null}
              {loc?.stayId ? (
                <Button
                  title="Check Out"
                  variant="danger"
                  icon={<Ionicons name="log-out-outline" size={16} color={colors.surface} />}
                  style={{ flex: 1 }}
                  onPress={() => setCheckoutModalVisible(true)}
                />
              ) : null}
            </View>

            {/* Quick 1-Click Reminder & Receipt Action Bar */}
            <View style={styles.remindBarRow}>
              <TouchableOpacity
                style={styles.quickRemindBtn}
                onPress={() => setReminderVisible(true)}
                accessibilityRole="button"
              >
                <Ionicons name="logo-whatsapp" size={16} color="#16A34A" />
                <Text style={styles.quickRemindBtnText}>Send Rent Reminder</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickReceiptBtn}
                onPress={() => setReceiptVisible(true)}
                accessibilityRole="button"
              >
                <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                <Text style={styles.quickReceiptBtnText}>View Receipt</Text>
              </TouchableOpacity>
            </View>

            {/* Resident Lifecycle Timeline */}
            <ResidentLifecycleTimeline />

            {/* Personal Details */}
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.cardTitle}>PERSONAL INFORMATION</Text>
                <TouchableOpacity
                  onPress={() => setEditProfileVisible(true)}
                  style={styles.editBtn}
                  accessibilityRole="button"
                >
                  <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{resident.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{resident.email || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender:</Text>
                <Text style={styles.infoValue}>{resident.gender}</Text>
              </View>
            </Card>

            {/* Emergency Contact */}
            {resident.primaryEmergencyContact ? (
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>PRIMARY EMERGENCY CONTACT</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{resident.primaryEmergencyContact.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Relationship:</Text>
                  <Text style={styles.infoValue}>{resident.primaryEmergencyContact.relationship}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{resident.primaryEmergencyContact.phone}</Text>
                </View>
              </Card>
            ) : null}

            {/* Resident History */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>STAY & ALLOCATION HISTORY</Text>
              {stays.length === 0 ? (
                <Text style={styles.emptyText}>No historical stays recorded.</Text>
              ) : (
                stays.map((s) => (
                  <View key={s.id} style={styles.historyBox}>
                    <Text style={styles.historyTitle}>
                      Stay ID: {s.id.slice(0, 8)} • Status: {s.status}
                    </Text>
                    <Text style={styles.historyText}>
                      Admission: {s.admissionDate} | Checkout: {s.actualCheckoutDate || 'Ongoing'}
                    </Text>
                  </View>
                ))
              )}
            </Card>
          </View>
        )}

        <Button
          title="Back to Residents"
          variant="outline"
          icon={<Ionicons name="arrow-back-outline" size={16} color={colors.primary} />}
          onPress={() => router.back()}
          style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
        />

        {/* Modals */}
        <CommercialHistoryModal
          visible={historyVisible}
          onClose={() => setHistoryVisible(false)}
          history={commercialHistory}
        />

        {catalogFacRes && (
          <AssignResidentFacilityModal
            visible={assignFacVisible}
            onClose={() => setAssignFacVisible(false)}
            catalogFacilities={catalogFacRes.items || []}
            onAssign={handleAssignFacility}
          />
        )}

        <AddChargeModal
          visible={addChargeVisible}
          onClose={() => setAddChargeVisible(false)}
          onAdd={handleAddCharge}
        />

        {resident && (
          <EditResidentModal
            visible={editProfileVisible}
            onClose={() => setEditProfileVisible(false)}
            resident={resident}
            onSave={handleSaveProfile}
            isSaving={updateResidentMutation.isPending}
          />
        )}

        {loc?.allocationId && (
          <TransferBedModal
            visible={transferVisible}
            onClose={() => setTransferVisible(false)}
            residentName={`${resident?.firstName || ''} ${resident?.lastName || ''}`}
            allocationId={loc.allocationId}
            currentLocation={{
              propertyName: loc.propertyName,
              buildingName: loc.buildingName,
              floorName: loc.floorName,
              roomNumber: loc.roomNumber,
              bedNumber: loc.bedNumber,
            }}
            onTransfer={handleTransferBed}
            isTransferring={transferBedMutation.isPending}
          />
        )}

        <CheckOutModal
          visible={checkoutModalVisible}
          onClose={() => setCheckoutModalVisible(false)}
          residentName={`${resident?.firstName || ''} ${resident?.lastName || ''}`}
          residentCode={resident?.residentCode || ''}
          onConfirm={async (dto) => {
            await checkoutMutation.mutateAsync(dto);
          }}
          isSubmitting={checkoutMutation.isPending}
        />

        <MessSubscriptionWizardModal
          visible={messWizardVisible}
          mode={messWizardMode}
          onClose={() => setMessWizardVisible(false)}
          onConfirm={handleConfirmMessWizard}
          isLoading={createMessSubMutation.isPending || changeMessSubMutation.isPending}
        />

        {/* WhatsApp & In-App Reminder Modal */}
        <WhatsAppReminderModal
          visible={reminderVisible}
          data={
            resident
              ? {
                  residentName: `${resident.firstName} ${resident.lastName}`,
                  residentPhone: resident.phone,
                  roomNumber: loc?.roomNumber || 'Assigned Room',
                  bedNumber: loc?.bedNumber,
                  amountDue: (summary as any)?.baseRent || (summary as any)?.monthlyRent || 8500,
                  propertyName: loc?.propertyName || 'PG.mate',
                }
              : null
          }
          onClose={() => setReminderVisible(false)}
        />

        {/* Printable Receipt Modal */}
        <InvoiceReceiptModal
          visible={receiptVisible}
          data={
            resident
              ? {
                  invoiceId: loc?.stayId || 'inv-1',
                  residentName: `${resident.firstName} ${resident.lastName}`,
                  residentPhone: resident.phone,
                  roomNumber: loc?.roomNumber || '101',
                  bedNumber: loc?.bedNumber,
                  propertyName: loc?.propertyName || 'PG.mate',
                  lineItems: [
                    { description: 'Monthly Room Rent', amount: (summary as any)?.baseRent || (summary as any)?.monthlyRent || 8500 },
                    { description: 'Maintenance & Wi-Fi', amount: 500 },
                  ],
                  totalAmount: ((summary as any)?.baseRent || (summary as any)?.monthlyRent || 8500) + 500,
                  paidAmount: ((summary as any)?.baseRent || (summary as any)?.monthlyRent || 8500) + 500,
                  balanceAmount: 0,
                  status: 'PAID',
                }
              : null
          }
          onClose={() => setReceiptVisible(false)}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  loadingWrap: {
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  codeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  remindBarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickRemindBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  quickRemindBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  quickReceiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  quickReceiptBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  historyBox: {
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  historyTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
