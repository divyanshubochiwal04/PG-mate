import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRoomByIdApi, updateRoomCapacityApi } from '@/features/rooms/api/rooms.api';
import { createBedApi, getBedsApi, updateBedStatusApi } from '@/features/beds/api/beds.api';
import { BedCard } from '@/features/beds/components/BedCard';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { normalizeApiError } from '@/api/error';
import { colors, spacing, typography } from '@/theme';

export default function RoomDetailScreen(): React.JSX.Element {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();

  const [newBedNumber, setNewBedNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [isEditCapacityOpen, setIsEditCapacityOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roomQuery = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoomByIdApi(roomId ?? ''),
    enabled: !!roomId,
  });

  const bedsQuery = useQuery({
    queryKey: ['beds', roomId, { page: 1 }],
    queryFn: () => getBedsApi(roomId ?? '', { page: 1, pageSize: 10 }),
    enabled: !!roomId,
  });

  const createBedMutation = useMutation({
    mutationFn: (bedNumber: string) => createBedApi(roomId ?? '', { bedNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      setNewBedNumber('');
      setIsAddBedOpen(false);
      setErrorMsg(null);
    },
    onError: (err: unknown) => {
      setErrorMsg(normalizeApiError(err).message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE' }) =>
      updateBedStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds', roomId] });
    },
  });

  const capacityMutation = useMutation({
    mutationFn: (capacity: number) => updateRoomCapacityApi(roomId ?? '', capacity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      setIsEditCapacityOpen(false);
      setErrorMsg(null);
    },
    onError: (err: unknown) => {
      setErrorMsg(normalizeApiError(err).message);
    },
  });

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
        <ErrorState message="Room not found or access denied." onRetry={() => roomQuery.refetch()} />
      </Screen>
    );
  }

  const room = roomQuery.data;
  const beds = bedsQuery.data;

  return (
    <Screen>
      <Header title={`Room ${room.roomNumber}`} subtitle={`Type: ${room.roomType} | Status: ${room.status}`} />
      <View style={styles.container}>
        <Card style={styles.capacityCard}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityTitle}>Bed Capacity: {room.capacity}</Text>
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

        {errorMsg ? <Button title={errorMsg} onPress={() => undefined} variant="danger" disabled /> : null}

        {bedsQuery.isError ? (
          <ErrorState message="Failed to load beds" onRetry={() => bedsQuery.refetch()} />
        ) : !beds || beds.items.length === 0 ? (
          <EmptyState title="No Beds Found" description="Add beds up to room capacity." />
        ) : (
          <FlatList
            data={beds.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BedCard
                bed={item}
                onToggleStatus={(status) => statusMutation.mutate({ id: item.id, status })}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={bedsQuery.isRefetching}
                onRefresh={() => {
                  roomQuery.refetch();
                  bedsQuery.refetch();
                }}
              />
            }
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  capacityCard: {
    marginBottom: spacing.md,
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
});
