import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFloorApi } from '@/features/floors/api/floors.api';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { normalizeApiError } from '@/api/error';
import { spacing } from '@/theme';

export default function CreateFloorScreen(): React.JSX.Element {
  const { buildingId } = useLocalSearchParams<{ propertyId: string; buildingId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [floorNumber, setFloorNumber] = useState('1');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createFloorApi>[1]) =>
      createFloorApi(buildingId ?? '', data),
    onSuccess: () => {
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
      displayOrder: Number(displayOrder) || 1,
    });
  };

  return (
    <Screen>
      <Header title="Add New Floor" subtitle="Create a floor level in this building" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <TextInput
            label="Floor Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. 1st Floor"
          />
          <TextInput
            label="Floor Number *"
            value={floorNumber}
            onChangeText={setFloorNumber}
            placeholder="0 for Ground, 1 for 1st"
            keyboardType="numeric"
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
              title="Save Floor"
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
