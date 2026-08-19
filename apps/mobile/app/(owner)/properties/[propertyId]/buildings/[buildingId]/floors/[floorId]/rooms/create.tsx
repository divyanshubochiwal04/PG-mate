import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRoomApi } from '@/features/rooms/api/rooms.api';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { normalizeApiError } from '@/api/error';
import { spacing } from '@/theme';

export default function CreateRoomScreen(): React.JSX.Element {
  const { floorId } = useLocalSearchParams<{
    propertyId: string;
    buildingId: string;
    floorId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createRoomApi>[1]) => createRoomApi(floorId ?? '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', floorId] });
      queryClient.invalidateQueries({ queryKey: ['building-tree'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      router.back();
    },
    onError: (err: unknown) => {
      setErrorMsg(normalizeApiError(err).message);
    },
  });

  const handleSubmit = () => {
    setErrorMsg(null);
    if (!roomNumber.trim() || !capacity.trim()) {
      setErrorMsg('Room number and capacity are required.');
      return;
    }

    mutation.mutate({
      roomNumber: roomNumber.trim(),
      roomType: Number(capacity) === 1 ? 'SINGLE' : Number(capacity) === 2 ? 'DOUBLE' : 'TRIPLE',
      capacity: Number(capacity),
      displayOrder: Number(displayOrder) || 1,
    });
  };

  return (
    <Screen>
      <Header title="Add New Room" subtitle="Create a room on this floor" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <TextInput
            label="Room Number *"
            value={roomNumber}
            onChangeText={setRoomNumber}
            placeholder="e.g. 101"
          />
          <TextInput
            label="Bed Capacity *"
            value={capacity}
            onChangeText={setCapacity}
            placeholder="e.g. 2"
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
              title="Save Room"
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
