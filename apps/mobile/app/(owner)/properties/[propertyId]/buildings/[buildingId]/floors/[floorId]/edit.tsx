import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFloorByIdApi, updateFloorApi } from '@/features/floors/api/floors.api';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { normalizeApiError } from '@/api/error';
import { spacing } from '@/theme';

export default function EditFloorScreen(): React.JSX.Element {
  const { propertyId, buildingId, floorId } = useLocalSearchParams<{
    propertyId: string;
    buildingId: string;
    floorId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: floor,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['floor', floorId],
    queryFn: () => getFloorByIdApi(floorId ?? ''),
    enabled: !!floorId,
  });

  const [name, setName] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (floor) {
      setName(floor.name);
      setFloorNumber(String(floor.floorNumber));
      setDisplayOrder(String(floor.displayOrder ?? 0));
    }
  }, [floor]);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateFloorApi>[1]) => updateFloorApi(floorId ?? '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor', floorId] });
      queryClient.invalidateQueries({ queryKey: ['floors', buildingId] });
      router.back();
    },
    onError: (err: unknown) => {
      setErrorMsg(normalizeApiError(err).message);
    },
  });

  const handleSubmit = () => {
    setErrorMsg(null);
    if (!name.trim() || floorNumber.trim() === '') {
      setErrorMsg('Floor name and floor number are required.');
      return;
    }
    mutation.mutate({
      name: name.trim(),
      floorNumber: Number(floorNumber),
      displayOrder: Number(displayOrder) || 0,
    });
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title="Edit Floor" />
        <Loading message="Loading floor details..." />
      </Screen>
    );
  }

  if (isError || !floor) {
    return (
      <Screen>
        <Header title="Edit Floor" />
        <ErrorState
          message={error instanceof Error ? error.message : 'Floor not found'}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={`Edit ${floor.name}`} subtitle={`Building ${buildingId}`} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <TextInput label="Floor Name *" value={name} onChangeText={setName} />
          <TextInput
            label="Floor Number *"
            value={floorNumber}
            onChangeText={setFloorNumber}
            keyboardType="numeric"
            placeholder="0 = Ground, 1 = 1st Floor"
          />
          <TextInput
            label="Display Order"
            value={displayOrder}
            onChangeText={setDisplayOrder}
            keyboardType="numeric"
          />

          {errorMsg ? (
            <Button title={errorMsg} onPress={() => undefined} variant="danger" disabled />
          ) : null}

          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.halfBtn}
            />
            <Button
              title="Save Changes"
              onPress={handleSubmit}
              isLoading={mutation.isPending}
              style={styles.halfBtn}
            />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.md },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  halfBtn: { width: '48%' },
});
