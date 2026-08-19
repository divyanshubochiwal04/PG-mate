import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FacilityDto } from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { GlobalHeader } from '../../../src/components/common/GlobalHeader';
import { BackendGapCard } from '../../../src/components/ui/BackendGapCard';
import { useOrganization } from '../../../src/features/organization/hooks/useOrganization';
import { usePropertyContext } from '../../../src/context/property-context';
import {
  assignFacilityToPropertyApi,
  createFacilityApi,
  getFacilitiesApi,
  unassignFacilityFromPropertyApi,
} from '../../../src/features/facilities/api/facilities.api';
import { CreateFacilityModal } from '../../../src/features/facilities/components/CreateFacilityModal';
import { UnassignFacilityModal } from '../../../src/features/facilities/components/UnassignFacilityModal';
import { colors, spacing, typography } from '../../../src/theme';

export default function FacilitiesCatalogScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: org } = useOrganization();
  const { selectedProperty } = usePropertyContext();

  const [activeTab, setActiveTab] = useState<'catalog' | 'mapping'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<FacilityDto | null>(null);
  const [assignedFacilityIds, setAssignedFacilityIds] = useState<Record<string, boolean>>({});

  const catalogQueryKey = ['facilities', org?.id];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: catalogQueryKey,
    queryFn: () => getFacilitiesApi({ page: 1, pageSize: 50 }),
    enabled: !!org?.id,
  });

  const createMutation = useMutation({
    mutationFn: createFacilityApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogQueryKey }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ propId, facId }: { propId: string; facId: string }) =>
      assignFacilityToPropertyApi(propId, facId),
    onSuccess: (_, { facId }) => {
      setAssignedFacilityIds((prev) => ({ ...prev, [facId]: true }));
    },
  });

  const unassignMutation = useMutation({
    mutationFn: ({ propId, facId }: { propId: string; facId: string }) =>
      unassignFacilityFromPropertyApi(propId, facId),
    onSuccess: (_, { facId }) => {
      setAssignedFacilityIds((prev) => ({ ...prev, [facId]: false }));
    },
  });

  const facilities = data?.items || [];
  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePropertyFacility = (fac: FacilityDto) => {
    if (!selectedProperty) return;
    const isAssigned = !!assignedFacilityIds[fac.id];
    if (isAssigned) {
      setUnassignTarget(fac);
    } else {
      assignMutation.mutate({ propId: selectedProperty.id, facId: fac.id });
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Facilities & Amenities" />

      <View style={styles.container}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'catalog' && styles.activeTab]}
            onPress={() => setActiveTab('catalog')}
            accessibilityRole="tab"
          >
            <Text style={[styles.tabText, activeTab === 'catalog' && styles.activeTabText]}>
              Catalog Facilities ({facilities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'mapping' && styles.activeTab]}
            onPress={() => setActiveTab('mapping')}
            accessibilityRole="tab"
          >
            <Text style={[styles.tabText, activeTab === 'mapping' && styles.activeTabText]}>
              Property Mapping
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'catalog' ? (
          <>
            <BackendGapCard
              title="Facility Catalog Management"
              description="Catalog edit and deactivation endpoints are restricted in M5 API. You can define new catalog items and map them to properties."
              nextAction="M5 Catalog Rules"
            />

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <TextInput
                  placeholder="Search catalog facilities..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <Button
                title="+ Create"
                onPress={() => setIsCreateOpen(true)}
                style={styles.createBtn}
              />
            </View>
          </>
        ) : (
          <>
            <BackendGapCard
              title="Resident Facility Assignment = BACKEND GAP"
              description="Per-resident facility assignments (e.g. resident gets specific Wi-Fi package) are not supported by M1-M6 backend. Facilities assigned at property level apply to all residents in that property."
              nextAction="Scheduled for M7"
            />
            <Text style={styles.propertyHeader}>
              Mapping for Property: {selectedProperty ? selectedProperty.name : 'All Properties'}
            </Text>
          </>
        )}

        {isLoading ? (
          <Loading message="Loading facilities..." />
        ) : error ? (
          <ErrorState message="Failed to load facility catalog" onRetry={refetch} />
        ) : filteredFacilities.length === 0 ? (
          <EmptyState
            title="No Facilities Found"
            description="No matching facilities in catalog."
          />
        ) : (
          <FlatList
            data={filteredFacilities}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isAssigned = !!assignedFacilityIds[item.id];

              return (
                <Card style={styles.facCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.facName}>🛋️ {item.name}</Text>
                    <Text style={styles.catBadge}>{item.category}</Text>
                  </View>
                  <Text style={styles.facCode}>Code: {item.code}</Text>
                  {item.description ? <Text style={styles.facDesc}>{item.description}</Text> : null}

                  {activeTab === 'mapping' ? (
                    <View style={styles.mappingRow}>
                      <Text style={styles.mappingStatus}>
                        Status: {isAssigned ? 'Assigned to Property' : 'Not Assigned'}
                      </Text>
                      <Button
                        title={isAssigned ? 'Unassign' : 'Assign to Property'}
                        variant={isAssigned ? 'danger' : 'primary'}
                        onPress={() => togglePropertyFacility(item)}
                        disabled={!selectedProperty}
                        style={styles.actionBtn}
                      />
                    </View>
                  ) : null}
                </Card>
              );
            }}
          />
        )}

        <Button
          title="← Back to Settings"
          variant="outline"
          onPress={() => router.back()}
          style={styles.backBtn}
        />
      </View>

      <CreateFacilityModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (input) => {
          await createMutation.mutateAsync(input);
        }}
      />

      <UnassignFacilityModal
        visible={!!unassignTarget}
        facility={unassignTarget}
        propertyName={selectedProperty?.name || 'Selected Property'}
        onClose={() => setUnassignTarget(null)}
        onConfirmUnassign={async (facId) => {
          if (selectedProperty) {
            await unassignMutation.mutateAsync({ propId: selectedProperty.id, facId });
          }
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.mutedBackground,
    borderRadius: 8,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.muted,
  },
  activeTabText: {
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
  },
  createBtn: {
    marginTop: -8,
  },
  propertyHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  facCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  facName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  catBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.mutedBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  facCode: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
  },
  facDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    marginTop: spacing.xs,
  },
  mappingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mappingStatus: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
  },
  actionBtn: {
    marginVertical: 0,
  },
  backBtn: {
    marginTop: spacing.xs,
  },
});
