import React, { useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteRoomApi,
  getRoomByIdApi,
  updateRoomCapacityApi,
} from '@/features/rooms/api/rooms.api';
import {
  createBedApi,
  deleteBedApi,
  getBedsApi,
  updateBedStatusApi,
} from '@/features/beds/api/beds.api';
import {
  assignFacilityToRoomApi,
  getFacilitiesApi,
  getRoomFacilitiesApi,
  unassignFacilityFromRoomApi,
} from '@/features/facilities/api/facilities.api';
import { FacilityPicker } from '@/features/facilities/components/FacilityPicker';
import { UnassignFacilityModal } from '@/features/facilities/components/UnassignFacilityModal';
import { BedCard } from '@/features/beds/components/BedCard';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { getErrorMessage, normalizeApiError } from '@/api/error';
import { colors, spacing, typography } from '@/theme';
import type { FacilityDto } from '@m-square/contracts';

export default function RoomDetailScreen(): React.JSX.Element {
  const { propertyId, buildingId, floorId, roomId } = useLocalSearchParams<{
    propertyId: string;
    buildingId: string;
    floorId: string;
    roomId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [newBedNumber, setNewBedNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [isEditCapacityOpen, setIsEditCapacityOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [unassigningFacility, setUnassigningFacility] = useState<FacilityDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roomQuery = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoomByIdApi(roomId ?? ''),
    enabled: !!roomId,
  });

  const bedsQuery = useQuery({
    queryKey: ['beds', roomId],
    queryFn: () => getBedsApi(roomId ?? '', { page: 1, pageSize: 20 }),
    enabled: !!roomId,
  });

  const roomFacilitiesQuery = useQuery({
    queryKey: ['room-facilities', roomId],
    queryFn: () => getRoomFacilitiesApi(roomId ?? ''),
    enabled: !!roomId,
  });

  const catalogFacilitiesQuery = useQuery({
    queryKey: ['catalog-facilities'],
    queryFn: () => getFacilitiesApi({ page: 1, pageSize: 50 }),
    enabled: showFacilityModal,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    queryClient.invalidateQueries({ queryKey: ['rooms', floorId] });
    queryClient.invalidateQueries({ queryKey: ['beds', roomId] });
    queryClient.invalidateQueries({ queryKey: ['room-facilities', roomId] });
    queryClient.invalidateQueries({ queryKey: ['building-tree', buildingId] });
    queryClient.invalidateQueries({ queryKey: ['inventory-tree'] });
  };

  const assignFacilityMutation = useMutation({
    mutationFn: (facilityId: string) => assignFacilityToRoomApi(roomId ?? '', facilityId),
    onSuccess: () => {
      invalidateAll();
    },
    onError: (err: unknown) => {
      Alert.alert('Assign Failed', getErrorMessage(err, 'Failed to assign facility'));
    },
  });

  const unassignFacilityMutation = useMutation({
    mutationFn: (facilityId: string) => unassignFacilityFromRoomApi(roomId ?? '', facilityId),
    onSuccess: () => {
      invalidateAll();
    },
    onError: (err: unknown) => {
      Alert.alert('Unassign Failed', getErrorMessage(err, 'Failed to unassign facility'));
    },
  });

  const createBedMutation = useMutation({
    mutationFn: (bedNumber: string) => createBedApi(roomId ?? '', { bedNumber }),
    onSuccess: () => {
      invalidateAll();
      setNewBedNumber('');
      setIsAddBedOpen(false);
      setErrorMsg(null);
    },
    onError: (err: unknown) => {
      setErrorMsg(normalizeApiError(err).message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE';
    }) => updateBedStatusApi(id, status),
    onSuccess: () => {
      invalidateAll();
    },
    onError: (err: unknown) => {
      Alert.alert('Status Update Failed', getErrorMessage(err, 'Failed to update bed status'));
    },
  });

  const deleteBedMutation = useMutation({
    mutationFn: (bedId: string) => deleteBedApi(bedId),
    onSuccess: () => {
      invalidateAll();
      setErrorMsg(null);
    },
    onError: (err: unknown) => {
      Alert.alert('Delete Bed Failed', getErrorMessage(err, 'Failed to delete bed'));
    },
  });

  const capacityMutation = useMutation({
    mutationFn: (capacity: number) => updateRoomCapacityApi(roomId ?? '', capacity),
    onSuccess: () => {
      invalidateAll();
      setIsEditCapacityOpen(false);
      setErrorMsg(null);
    },
    onError: (err: unknown) => {
      setErrorMsg(normalizeApiError(err).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoomApi(roomId ?? ''),
    onSuccess: () => {
      invalidateAll();
      router.back();
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync();
      setShowDeleteModal(false);
    } catch (err: unknown) {
      setShowDeleteModal(false);
      Alert.alert('Delete Failed', getErrorMessage(err, 'Failed to delete room'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (roomQuery.isLoading || bedsQuery.isLoading) {
    return (
      <Screen>
        <Header title="Room Details" />
        <Loading message="Loading room details & beds..." />
      </Screen>
    );
  }

  if (roomQuery.isError || !roomQuery.data) {
    return (
      <Screen>
        <Header title="Room Details" />
        <ErrorState
          message="Room not found or access denied."
          onRetry={() => roomQuery.refetch()}
        />
      </Screen>
    );
  }

  const room = roomQuery.data;
  const beds = bedsQuery.data;

  const totalBeds = beds?.items.length ?? 0;
  const availableBeds = beds?.items.filter((b) => b.status === 'AVAILABLE').length ?? 0;
  const maintenanceBeds = beds?.items.filter((b) => b.status === 'MAINTENANCE').length ?? 0;

  return (
    <Screen>
      <Header
        title={`Room ${room.roomNumber}`}
        subtitle={`Type: ${room.roomType} | Status: ${room.status}`}
      />
      <View style={styles.container}>
        {/* Edit / Delete actions */}
        <Card style={styles.actionsCard}>
          <View style={styles.actionRow}>
            <Button
              title="Edit Room"
              variant="outline"
              onPress={() =>
                router.push(
                  `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${floorId}/rooms/${roomId}/edit` as any
                )
              }
              style={styles.actionBtn}
            />
            <Button
              title="Delete"
              variant="danger"
              onPress={() => setShowDeleteModal(true)}
              style={styles.actionBtn}
            />
          </View>
        </Card>

        {/* Capacity card with live metrics */}
        <Card style={styles.capacityCard}>
          <View style={styles.capacityHeader}>
            <View>
              <Text style={styles.capacityTitle}>
                Capacity: {totalBeds} / {room.capacity} Beds
              </Text>
              <Text style={styles.capacitySubtitle}>
                Available: {availableBeds} | Maintenance: {maintenanceBeds}
              </Text>
            </View>
            <Button
              title={isEditCapacityOpen ? 'Close' : 'Change Capacity'}
              variant="outline"
              onPress={() => {
                setIsEditCapacityOpen(!isEditCapacityOpen);
                setNewCapacity(String(room.capacity));
              }}
            />
          </View>

          {isEditCapacityOpen && (
            <View style={styles.formContainer}>
              <TextInput
                label="New Room Capacity *"
                value={newCapacity}
                onChangeText={setNewCapacity}
                keyboardType="numeric"
              />
              <Button
                title="Update Capacity"
                onPress={() => capacityMutation.mutate(Number(newCapacity))}
                isLoading={capacityMutation.isPending}
              />
            </View>
          )}
        </Card>

        {/* Room Facilities Section */}
        <Card style={styles.facilitiesCard}>
          <View style={styles.facilitiesHeader}>
            <Text style={styles.sectionTitle}>Room Facilities</Text>
            <Button
              title="+ Assign Facility"
              variant="outline"
              onPress={() => setShowFacilityModal(true)}
            />
          </View>

          {roomFacilitiesQuery.isLoading ? (
            <Loading message="Loading room facilities..." />
          ) : roomFacilitiesQuery.isError ? (
            <ErrorState
              message="Failed to load room facilities"
              onRetry={() => roomFacilitiesQuery.refetch()}
            />
          ) : !roomFacilitiesQuery.data || roomFacilitiesQuery.data.length === 0 ? (
            <EmptyState
              title="No Facilities Assigned"
              description="Assign facilities like WiFi, AC, TV to this room."
            />
          ) : (
            <View style={styles.facilitiesList}>
              {roomFacilitiesQuery.data.map((fac) => (
                <View key={fac.id} style={styles.facilityRow}>
                  <View style={styles.facilityInfo}>
                    <Text style={styles.facilityName}>{fac.name}</Text>
                    <Text style={styles.facilityCategory}>
                      {fac.category || 'GENERAL'} • {fac.code}
                    </Text>
                  </View>
                  <Button
                    title="Unassign"
                    variant="danger"
                    onPress={() => setUnassigningFacility(fac)}
                    style={styles.unassignBtn}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Beds section */}
        <View style={styles.bedsHeader}>
          <Text style={styles.sectionTitle}>Beds in Room</Text>
          <Button
            title={isAddBedOpen ? 'Close' : '+ Add Bed'}
            variant="primary"
            onPress={() => setIsAddBedOpen(!isAddBedOpen)}
          />
        </View>

        {isAddBedOpen && (
          <Card style={styles.formCard}>
            <TextInput
              label="Bed Label *"
              placeholder="e.g. Bed A"
              value={newBedNumber}
              onChangeText={setNewBedNumber}
            />
            <Button
              title="Save Bed"
              onPress={() => createBedMutation.mutate(newBedNumber.trim())}
              isLoading={createBedMutation.isPending}
            />
          </Card>
        )}

        {errorMsg ? (
          <Button title={errorMsg} onPress={() => undefined} variant="danger" disabled />
        ) : null}

        {bedsQuery.isError ? (
          <ErrorState message="Failed to load beds" onRetry={() => bedsQuery.refetch()} />
        ) : !beds || beds.items.length === 0 ? (
          <EmptyState
            title="No Beds Found"
            description="Add beds up to room capacity."
            actionLabel="+ Add Bed"
            onAction={() => setIsAddBedOpen(true)}
          />
        ) : (
          <FlatList
            data={beds.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BedCard
                bed={item}
                onToggleStatus={(status) => statusMutation.mutate({ id: item.id, status })}
                onDelete={() => deleteBedMutation.mutate(item.id)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={bedsQuery.isRefetching}
                onRefresh={() => {
                  roomQuery.refetch();
                  bedsQuery.refetch();
                  roomFacilitiesQuery.refetch();
                }}
              />
            }
          />
        )}
      </View>

      {/* Assign Facility Modal */}
      <Modal
        visible={showFacilityModal}
        animationType="slide"
        onRequestClose={() => setShowFacilityModal(false)}
      >
        <Screen>
          <Header title="Assign Facility to Room" subtitle={`Room ${room.roomNumber}`} />
          <View style={{ flex: 1, padding: spacing.md }}>
            <FacilityPicker
              facilities={catalogFacilitiesQuery.data?.items ?? []}
              assignedFacilityIds={(roomFacilitiesQuery.data ?? []).map((f) => f.id)}
              isLoading={catalogFacilitiesQuery.isLoading}
              onAssign={(facId) => assignFacilityMutation.mutate(facId)}
              onUnassign={(facId) => unassignFacilityMutation.mutate(facId)}
            />
            <Button
              title="Done"
              onPress={() => setShowFacilityModal(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </Screen>
      </Modal>

      {/* Unassign Facility Confirmation Modal */}
      <UnassignFacilityModal
        visible={!!unassigningFacility}
        facility={unassigningFacility}
        propertyName={`Room ${room.roomNumber}`}
        onClose={() => setUnassigningFacility(null)}
        onConfirmUnassign={async (facId) => {
          await unassignFacilityMutation.mutateAsync(facId);
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.overlay}>
          <Card style={styles.modal}>
            <Text style={styles.modalTitle}>Delete Room</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete{' '}
              <Text style={styles.bold}>Room {room.roomNumber}</Text>?
            </Text>
            <Text style={styles.modalWarning}>
              Rooms with active beds cannot be deleted. This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowDeleteModal(false)}
                style={styles.modalBtn}
                disabled={isDeleting}
              />
              <Button
                title="Delete"
                variant="danger"
                onPress={handleDelete}
                isLoading={isDeleting}
                style={styles.modalBtn}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  actionsCard: {
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  capacityCard: {
    marginBottom: spacing.md,
  },
  facilitiesCard: {
    marginBottom: spacing.md,
  },
  facilitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  facilitiesList: {
    marginTop: spacing.xs,
  },
  facilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  facilityInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  facilityName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  facilityCategory: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  unassignBtn: {
    paddingHorizontal: spacing.sm,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  capacitySubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  formContainer: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  bedsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  formCard: {
    marginBottom: spacing.md,
  },
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
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalWarning: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  bold: {
    fontWeight: typography.fontWeight.bold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalBtn: {
    flex: 1,
  },
});
