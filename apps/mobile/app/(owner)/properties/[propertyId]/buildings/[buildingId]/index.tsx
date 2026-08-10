import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getBuildingByIdApi } from '@/features/buildings/api/buildings.api';
import { getFloorsApi } from '@/features/floors/api/floors.api';
import { FloorCard } from '@/features/floors/components/FloorCard';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { colors, spacing, typography } from '@/theme';

export default function BuildingDetailScreen(): React.JSX.Element {
  const { propertyId, buildingId } = useLocalSearchParams<{ propertyId: string; buildingId: string }>();
  const router = useRouter();

  const buildingQuery = useQuery({
    queryKey: ['building', buildingId],
    queryFn: () => getBuildingByIdApi(buildingId ?? ''),
    enabled: !!buildingId,
  });

  const floorsQuery = useQuery({
    queryKey: ['floors', buildingId, { page: 1 }],
    queryFn: () => getFloorsApi(buildingId ?? '', { page: 1, pageSize: 10 }),
    enabled: !!buildingId,
  });

  if (buildingQuery.isLoading || floorsQuery.isLoading) {
    return (
      <Screen>
        <Header title="Building Details" />
        <Loading message="Loading building & floors..." />
      </Screen>
    );
  }

  if (buildingQuery.isError || !buildingQuery.data) {
    return (
      <Screen>
        <Header title="Building Details" />
        <ErrorState message="Building not found or access denied." onRetry={() => buildingQuery.refetch()} />
      </Screen>
    );
  }

  const building = buildingQuery.data;
  const floors = floorsQuery.data;

  return (
    <Screen>
      <Header title={building.name} subtitle={`Code: ${building.code} | Display Order: #${building.displayOrder}`} />
      <View style={styles.container}>
        <View style={styles.floorsHeader}>
          <Text style={styles.sectionTitle}>Floors</Text>
          <Button
            title="+ Add Floor"
            variant="primary"
            onPress={() =>
              router.push(
                `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/create` as `/properties/${string}`
              )
            }
          />
        </View>

        {floorsQuery.isError ? (
          <ErrorState message="Failed to load floors" onRetry={() => floorsQuery.refetch()} />
        ) : !floors || floors.items.length === 0 ? (
          <EmptyState title="No Floors Found" description="Add your first floor to this building." />
        ) : (
          <FlatList
            data={floors.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FloorCard
                floor={item}
                onPress={() =>
                  router.push(
                    `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${item.id}/rooms` as `/properties/${string}`
                  )
                }
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={floorsQuery.isRefetching}
                onRefresh={() => {
                  buildingQuery.refetch();
                  floorsQuery.refetch();
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
  floorsHeader: {
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
