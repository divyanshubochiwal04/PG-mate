import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignFacilityToPropertyApi,
  getFacilitiesApi,
  unassignFacilityFromPropertyApi,
} from '@/features/facilities/api/facilities.api';
import { FacilityPicker } from '@/features/facilities/components/FacilityPicker';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { ErrorState } from '@/components/ui/ErrorState';
import { spacing } from '@/theme';

export default function PropertyFacilitiesScreen(): React.JSX.Element {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const queryClient = useQueryClient();

  const facilitiesQuery = useQuery({
    queryKey: ['facilities'],
    queryFn: () => getFacilitiesApi({ page: 1, pageSize: 50 }),
  });

  const assignMutation = useMutation({
    mutationFn: (facilityId: string) => assignFacilityToPropertyApi(propertyId ?? '', facilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (facilityId: string) =>
      unassignFacilityFromPropertyApi(propertyId ?? '', facilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    },
  });

  if (facilitiesQuery.isError) {
    return (
      <Screen>
        <Header title="Property Facilities" />
        <ErrorState
          message="Failed to load catalog facilities."
          onRetry={() => facilitiesQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Property Facilities" subtitle="Assign catalog amenities to this property" />
      <View style={{ flex: 1, padding: spacing.md }}>
        <FacilityPicker
          facilities={facilitiesQuery.data?.items || []}
          assignedFacilityIds={[]}
          isLoading={facilitiesQuery.isLoading}
          onAssign={(id: string) => assignMutation.mutate(id)}
          onUnassign={(id: string) => unassignMutation.mutate(id)}
        />
      </View>
    </Screen>
  );
}
