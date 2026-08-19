import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBuildingApi } from '@/features/buildings/api/buildings.api';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { normalizeApiError } from '@/api/error';
import { spacing } from '@/theme';

export default function CreateBuildingScreen(): React.JSX.Element {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createBuildingApi>[1]) =>
      createBuildingApi(propertyId ?? '', data),
    onSuccess: () => {
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
    });
  };

  return (
    <Screen>
      <Header title="Add New Building" subtitle="Create a block or tower in this property" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <TextInput
            label="Building Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Tower A"
          />
          <TextInput
            label="Building Code *"
            value={code}
            onChangeText={setCode}
            placeholder="e.g. TWR-A"
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
              title="Save Building"
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
