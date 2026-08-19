import React, { useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteFloorApi, getFloorByIdApi } from '@/features/floors/api/floors.api';
import { getRoomsApi } from '@/features/rooms/api/rooms.api';
import { RoomCard } from '@/features/rooms/components/RoomCard';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { getErrorMessage } from '@/api/error';
import { colors, spacing, typography } from '@/theme';

export default function FloorDetailScreen(): React.JSX.Element {
  const { propertyId, buildingId, floorId } = useLocalSearchParams<{
    propertyId: string;
    buildingId: string;
    floorId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const floorQuery = useQuery({
    queryKey: ['floor', floorId],
    queryFn: () => getFloorByIdApi(floorId ?? ''),
    enabled: !!floorId,
  });

  const roomsQuery = useQuery({
    queryKey: ['rooms', floorId, { page: 1 }],
    queryFn: () => getRoomsApi(floorId ?? '', { page: 1, pageSize: 20 }),
    enabled: !!floorId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFloorApi(floorId ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors', buildingId] });
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
      Alert.alert('Delete Failed', getErrorMessage(err, 'Failed to delete floor'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (floorQuery.isLoading || roomsQuery.isLoading) {
    return (
      <Screen>
        <Header title="Floor Details" />
        <Loading message="Loading floor & rooms..." />
      </Screen>
    );
  }

  if (floorQuery.isError || !floorQuery.data) {
    return (
      <Screen>
        <Header title="Floor Details" />
        <ErrorState
          message="Floor not found or access denied."
          onRetry={() => floorQuery.refetch()}
        />
      </Screen>
    );
  }

  const floor = floorQuery.data;
  const rooms = roomsQuery.data;

  return (
    <Screen>
      <Header
        title={floor.name}
        subtitle={`Floor #${floor.floorNumber} | Order: ${floor.displayOrder} | ${floor.status}`}
      />
      <View style={styles.container}>
        <Card style={styles.actionsCard}>
          <View style={styles.actionRow}>
            <Button
              title="Edit Floor"
              variant="outline"
              onPress={() =>
                router.push(
                  `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${floorId}/edit` as any
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rooms</Text>
          <Button
            title="+ Add Room"
            variant="primary"
            onPress={() =>
              router.push(
                `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${floorId}/rooms/create` as any
              )
            }
          />
        </View>

        {roomsQuery.isError ? (
          <ErrorState message="Failed to load rooms" onRetry={() => roomsQuery.refetch()} />
        ) : !rooms || rooms.items.length === 0 ? (
          <EmptyState
            title="No Rooms Found"
            description="Add your first room to this floor."
            actionLabel="+ Add Room"
            onAction={() =>
              router.push(
                `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${floorId}/rooms/create` as any
              )
            }
          />
        ) : (
          <FlatList
            data={rooms.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RoomCard
                room={item}
                onPress={() =>
                  router.push(
                    `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${floorId}/rooms/${item.id}` as any
                  )
                }
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={roomsQuery.isRefetching}
                onRefresh={() => {
                  floorQuery.refetch();
                  roomsQuery.refetch();
                }}
              />
            }
          />
        )}
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.overlay}>
          <Card style={styles.modal}>
            <Text style={styles.modalTitle}>Delete Floor</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete <Text style={styles.bold}>{floor.name}</Text>?
            </Text>
            <Text style={styles.modalWarning}>
              This action cannot be undone. Floors with rooms cannot be deleted.
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
  sectionHeader: {
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
