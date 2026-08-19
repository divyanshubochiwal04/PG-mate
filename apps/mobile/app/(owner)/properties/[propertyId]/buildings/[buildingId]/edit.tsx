import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBuildingByIdApi, updateBuildingApi } from '@/features/buildings/api/buildings.api';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { normalizeApiError } from '@/api/error';
import { spacing } from '@/theme';

export default function EditBuildingScreen(): React.JSX.Element {
  const { propertyId, buildingId } = useLocalSearchParams<{
    propertyId: string;
    buildingId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: building,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: () => getBuildingByIdApi(buildingId ?? ''),
    enabled: !!buildingId,
  });

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (building) {
      setName(building.name);
      setCode(building.code);
      setDisplayOrder(String(building.displayOrder ?? 1));
      setStatus(building.status);
    }
  }, [building]);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateBuildingApi>[1]) =>
      updateBuildingApi(buildingId ?? '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
      queryClient.invalidateQueries({ queryKey: ['buildings', propertyId] });
      router.back();
    },
    onError: (err: unknown) => {
      setErrorMsg(normalizeApiError(err).message);
    },
  });

  const handleSubmit = () => {
    setErrorMsg(null);
    if (!name.trim() || !code.trim()) {
      setErrorMsg('Building name and code are required.');
      return;
    }
    mutation.mutate({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      displayOrder: Number(displayOrder) || 1,
      status,
    });
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title="Edit Building" />
        <Loading message="Loading building details..." />
      </Screen>
    );
  }

  if (isError || !building) {
    return (
      <Screen>
        <Header title="Edit Building" />
        <ErrorState
          message={error instanceof Error ? error.message : 'Building not found'}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={`Edit ${building.name}`} subtitle={`Code: ${building.code}`} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <TextInput label="Building Name *" value={name} onChangeText={setName} />
          <TextInput
            label="Building Code *"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  halfBtn: {
    width: '48%',
  },
});
