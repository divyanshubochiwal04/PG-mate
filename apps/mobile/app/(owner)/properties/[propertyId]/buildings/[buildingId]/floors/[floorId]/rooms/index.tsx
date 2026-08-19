import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getFloorByIdApi } from '@/features/floors/api/floors.api';
import { getRoomsApi } from '@/features/rooms/api/rooms.api';
import { RoomCard } from '@/features/rooms/components/RoomCard';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { colors, spacing, typography } from '@/theme';

export default function RoomsListScreen(): React.JSX.Element {
  const { propertyId, buildingId, floorId } = useLocalSearchParams<{
    propertyId: string;
    buildingId: string;
    floorId: string;
  }>();
  const router = useRouter();

  const floorQuery = useQuery({
    queryKey: ['floor', floorId],
    queryFn: () => getFloorByIdApi(floorId ?? ''),
    enabled: !!floorId,
  });

  const roomsQuery = useQuery({
    queryKey: ['rooms', floorId],
    queryFn: () => getRoomsApi(floorId ?? '', { page: 1, pageSize: 10 }),
    enabled: !!floorId,
  });

  if (floorQuery.isLoading || roomsQuery.isLoading) {
    return (
      <Screen>
        <Header title="Rooms" />
        <Loading message="Loading floor & rooms..." />
      </Screen>
    );
  }

  if (floorQuery.isError || !floorQuery.data) {
    return (
      <Screen>
        <Header title="Rooms" />
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
      <Header title={`${floor.name} Rooms`} subtitle={`Floor Number: ${floor.floorNumber}`} />
      <View style={styles.container}>
        <View style={styles.roomsHeader}>
          <Text style={styles.sectionTitle}>Rooms</Text>
          <Button
            title="+ Add Room"
            variant="primary"
            onPress={() =>
              router.push(
                `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${floorId}/rooms/create` as `/properties/${string}`
              )
            }
          />
        </View>

        {roomsQuery.isError ? (
          <ErrorState message="Failed to load rooms" onRetry={() => roomsQuery.refetch()} />
        ) : !rooms || rooms.items.length === 0 ? (
          <EmptyState title="No Rooms Found" description="Add your first room to this floor." />
        ) : (
          <FlatList
            data={rooms.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RoomCard
                room={item}
                onPress={() =>
                  router.push(
                    `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${floorId}/rooms/${item.id}` as `/properties/${string}`
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  roomsHeader: {
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
});
