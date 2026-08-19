import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PropertyDto } from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { GlobalHeader } from '../../../src/components/common/GlobalHeader';
import { useOrganization } from '../../../src/features/organization/hooks/useOrganization';
import {
  createPropertyApi,
  deletePropertyApi,
  getPropertiesApi,
  updatePropertyApi,
} from '../../../src/features/properties/api/properties.api';
import { PropertyModal } from '../../../src/features/properties/components/PropertyModal';
import { DeletePropertyModal } from '../../../src/features/properties/components/DeletePropertyModal';
import { colors, spacing, typography } from '../../../src/theme';

export default function PropertiesScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: org } = useOrganization();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertyDto | null>(null);

  const queryKey = ['properties', org?.id];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getPropertiesApi({ page: 1, pageSize: 50 }),
    enabled: !!org?.id,
  });

  const createMutation = useMutation({
    mutationFn: createPropertyApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updatePropertyApi>[1];
    }) => updatePropertyApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePropertyApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });

  const properties = data?.items || [];

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Properties Management" />

      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Properties List</Text>
          <Button
            title="+ Add Property"
            onPress={() => {
              setSelectedProperty(null);
              setIsModalOpen(true);
            }}
          />
        </View>

        {isLoading ? (
          <Loading message="Loading properties..." />
        ) : error ? (
          <ErrorState message="Failed to load properties" onRetry={refetch} />
        ) : properties.length === 0 ? (
          <EmptyState
            title="No Properties Registered"
            description="Click '+ Add Property' to create your first PG property."
          />
        ) : (
          <FlatList
            data={properties}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/(owner)/properties/${item.id}` as `/properties/${string}`)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.propName}>🏠 {item.name}</Text>
                    <Text style={styles.codeBadge}>{item.code}</Text>
                  </View>
                  <Text style={styles.address}>
                    {item.address.addressLine1}, {item.address.locality}, {item.address.city}
                  </Text>
                </TouchableOpacity>

                <View style={styles.buttonContainer}>
                  <Button
                    title="🏢 Manage Blocks & Floors"
                    variant="primary"
                    onPress={() =>
                      router.push(`/(owner)/properties/${item.id}` as `/properties/${string}`)
                    }
                    style={styles.manageBtn}
                  />
                  <View style={styles.cardActions}>
                    <Button
                      title="Edit Details"
                      variant="outline"
                      onPress={() => {
                        setSelectedProperty(item);
                        setIsModalOpen(true);
                      }}
                      style={styles.cardBtn}
                    />
                    <Button
                      title="Delete"
                      variant="danger"
                      onPress={() => setDeleteTarget(item)}
                      style={styles.cardBtn}
                    />
                  </View>
                </View>
              </Card>
            )}
          />
        )}

        <Button
          title="← Back to Settings"
          variant="outline"
          onPress={() => router.back()}
          style={styles.backBtn}
        />
      </View>

      <PropertyModal
        visible={isModalOpen}
        property={selectedProperty}
        onClose={() => setIsModalOpen(false)}
        onSubmitCreate={async (input) => {
          await createMutation.mutateAsync(input);
        }}
        onSubmitUpdate={async (id, input) => {
          await updateMutation.mutateAsync({ id, payload: input });
        }}
      />

      <DeletePropertyModal
        visible={!!deleteTarget}
        property={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirmDelete={async (id) => {
          await deleteMutation.mutateAsync(id);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  propName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  codeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.mutedBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  address: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    marginTop: spacing.xs,
  },
  manageBtn: {
    marginBottom: spacing.xs,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cardBtn: {
    flex: 1,
  },
  backBtn: {
    marginTop: spacing.xs,
  },
});
