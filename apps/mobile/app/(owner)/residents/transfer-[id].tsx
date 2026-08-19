import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../../src/components/ui/Screen';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { TextInput } from '../../../src/components/ui/TextInput';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { usePropertyContext } from '../../../src/context/property-context';
import { LocationBedSelector } from '../../../src/features/residents/components/LocationBedSelector';
import {
  getResidentByIdApi,
  transferBedApi,
} from '../../../src/features/residents/api/residents.api';
import { getBuildingsApi } from '../../../src/features/buildings/api/buildings.api';
import { getFloorsApi } from '../../../src/features/floors/api/floors.api';
import { getRoomsApi } from '../../../src/features/rooms/api/rooms.api';
import { getBedsApi } from '../../../src/features/beds/api/beds.api';
import { getResidentsApi } from '../../../src/features/residents/api/residents.api';
import { colors, spacing, typography } from '../../../src/theme';

export default function TransferBedScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { selectedPropertyId } = usePropertyContext();

  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [targetBedId, setTargetBedId] = useState<string | null>(null);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const isValidId = Boolean(id && id !== 'index' && id !== 'undefined');

  const { data: resident, isLoading: isLoadingResident } = useQuery({
    queryKey: ['resident', id],
    queryFn: () => (isValidId ? getResidentByIdApi(id) : null),
    enabled: isValidId,
  });

  const { data: bRes } = useQuery({
    queryKey: ['buildings', 'transfer', selectedPropertyId],
    queryFn: () => (selectedPropertyId ? getBuildingsApi(selectedPropertyId) : null),
    enabled: !!selectedPropertyId,
  });

  const { data: fRes } = useQuery({
    queryKey: ['floors', 'transfer', buildingId],
    queryFn: () => (buildingId ? getFloorsApi(buildingId) : null),
    enabled: !!buildingId,
  });

  const { data: rRes } = useQuery({
    queryKey: ['rooms', 'transfer', floorId],
    queryFn: () => (floorId ? getRoomsApi(floorId) : null),
    enabled: !!floorId,
  });

  const {
    data: bedRes,
    isLoading: isLoadingBeds,
    refetch: refetchBeds,
  } = useQuery({
    queryKey: ['beds', 'transfer', roomId],
    queryFn: () => (roomId ? getBedsApi(roomId) : null),
    enabled: !!roomId,
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

  const transferMutation = useMutation({
    mutationFn: async () => {
      const allocationId = resident?.currentLocation?.allocationId;
      if (!allocationId) throw new Error('Resident has no active allocation to transfer.');
      if (!targetBedId) throw new Error('Please select a target bed for transfer.');
      return transferBedApi(allocationId, { targetBedId, transferDate, notes: notes || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resident', id] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      Alert.alert('Transfer Complete', 'Resident has been transferred to new bed.');
      router.back();
    },
    onError: (err: unknown) => {
      refetchBeds();
      Alert.alert(
        'Transfer Failed',
        err instanceof Error
          ? err.message
          : 'Selected bed is no longer available. Refreshed bed status.'
      );
    },
  });

  const loc = resident?.currentLocation;

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔄 Transfer Resident Bed</Text>

        {isLoadingResident ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ margin: spacing.lg }} />
        ) : !loc ? (
          <ErrorState
            message="Resident has no active bed allocation to transfer."
            onRetry={() => router.back()}
          />
        ) : (
          <View>
            <Card style={styles.currentCard}>
              <Text style={styles.cardTitle}>CURRENT LOCATION</Text>
              <Text style={styles.currentText}>
                📍 {loc.propertyName} • {loc.buildingName} • Room {loc.roomNumber} • Bed{' '}
                {loc.bedNumber}
              </Text>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>SELECT TARGET LOCATION & BED</Text>
              <LocationBedSelector
                buildings={bRes?.items || []}
                floors={fRes?.items || []}
                rooms={rRes?.items || []}
                beds={bedRes?.items || []}
                selectedBuildingId={buildingId}
                selectedFloorId={floorId}
                selectedRoomId={roomId}
                selectedBedId={targetBedId}
                occupantMap={occupantMap}
                isLoading={isLoadingBeds}
                onSelectBuilding={setBuildingId}
                onSelectFloor={setFloorId}
                onSelectRoom={setRoomId}
                onSelectBed={setTargetBedId}
              />
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>TRANSFER DETAILS</Text>
              <TextInput
                label="Transfer Date (YYYY-MM-DD)"
                value={transferDate}
                onChangeText={setTransferDate}
              />
              <TextInput
                label="Notes / Reason for Transfer"
                value={notes}
                onChangeText={setNotes}
              />
            </Card>

            <Button
              title={transferMutation.isPending ? 'Transferring...' : 'CONFIRM BED TRANSFER'}
              disabled={transferMutation.isPending || !targetBedId}
              onPress={() => transferMutation.mutate()}
              style={{ marginBottom: spacing.sm }}
            />
          </View>
        )}

        <Button title="Cancel" variant="outline" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  currentCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  cardTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  currentText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  card: { padding: spacing.md, marginBottom: spacing.md },
});
