import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getPropertyByIdApi } from '@/features/properties/api/properties.api';
import { getBuildingsApi } from '@/features/buildings/api/buildings.api';
import { BuildingCard } from '@/features/buildings/components/BuildingCard';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { colors, spacing, typography } from '@/theme';

export default function PropertyDetailScreen(): React.JSX.Element {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const router = useRouter();

  const propertyQuery = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => getPropertyByIdApi(propertyId ?? ''),
    enabled: !!propertyId,
  });

  const buildingsQuery = useQuery({
    queryKey: ['buildings', propertyId, { page: 1 }],
    queryFn: () => getBuildingsApi(propertyId ?? '', { page: 1, pageSize: 10 }),
    enabled: !!propertyId,
  });

  if (propertyQuery.isLoading || buildingsQuery.isLoading) {
    return (
      <Screen>
        <Header title="Property Details" />
        <Loading message="Loading property & buildings..." />
      </Screen>
    );
  }

  if (propertyQuery.isError || !propertyQuery.data) {
    return (
      <Screen>
        <Header title="Property Details" />
        <ErrorState
          message="Property not found or access denied."
          onRetry={() => propertyQuery.refetch()}
        />
      </Screen>
    );
  }

  const property = propertyQuery.data;
  const buildings = buildingsQuery.data;

  return (
    <Screen>
      <Header
        title={property.name}
        subtitle={`Code: ${property.code} | Status: ${property.status}`}
      />
      <View style={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.address}>
            {property.address.addressLine1}, {property.address.locality}, {property.address.city},{' '}
            {property.address.state} - {property.address.postalCode}
          </Text>
          <View style={styles.actionRow}>
            <Button
              title="Edit Property"
              variant="outline"
              onPress={() =>
                router.push(`/(owner)/properties/${property.id}/edit` as `/properties/${string}`)
              }
              style={styles.actionBtn}
            />
            <Button
              title="Manage Facilities"
              variant="outline"
              onPress={() =>
                router.push(
                  `/(owner)/properties/${property.id}/facilities` as `/properties/${string}`
                )
              }
              style={styles.actionBtn}
            />
          </View>
        </Card>

        <View style={styles.buildingsHeader}>
          <Text style={styles.sectionTitle}>Buildings / Blocks</Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Button
              title="🧙‍♂️ Wizard Setup"
              variant="outline"
              onPress={() =>
                router.push(
                  `/(owner)/properties/${property.id}/buildings/setup` as `/properties/${string}`
                )
              }
            />
            <Button
              title="+ Add Single"
              variant="primary"
              onPress={() =>
                router.push(
                  `/(owner)/properties/${property.id}/buildings/create` as `/properties/${string}`
                )
              }
            />
          </View>
        </View>

        {buildingsQuery.isError ? (
          <ErrorState message="Failed to load buildings" onRetry={() => buildingsQuery.refetch()} />
        ) : !buildings || buildings.items.length === 0 ? (
          <EmptyState
            title="No Buildings Found"
            description="Add your first building to this property."
            actionLabel="+ Add Building"
            onAction={() =>
              router.push(
                `/(owner)/properties/${property.id}/buildings/create` as `/properties/${string}`
              )
            }
          />
        ) : (
          <FlatList
            data={buildings.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BuildingCard
                building={item}
                onPress={() =>
                  router.push(
                    `/(owner)/properties/${property.id}/buildings/${item.id}` as `/properties/${string}`
                  )
                }
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={buildingsQuery.isRefetching}
                onRefresh={() => {
                  propertyQuery.refetch();
                  buildingsQuery.refetch();
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
  summaryCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  address: {
    fontSize: typography.fontSize.sm,
    color: colors.muted,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  actionBtn: {
    width: '48%',
  },
  buildingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
});
