import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRoomByIdApi, updateRoomApi } from '@/features/rooms/api/rooms.api';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { normalizeApiError } from '@/api/error';
import { spacing } from '@/theme';

const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'DORMITORY', 'CUSTOM'] as const;
type RoomType = (typeof ROOM_TYPES)[number];

export default function EditRoomScreen(): React.JSX.Element {
  const { floorId, roomId } = useLocalSearchParams<{
    propertyId: string;
    buildingId: string;
    floorId: string;
    roomId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: room,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoomByIdApi(roomId ?? ''),
    enabled: !!roomId,
  });

  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('DOUBLE');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (room) {
      setRoomNumber(room.roomNumber);
      setRoomType(room.roomType as RoomType);
      setDisplayOrder(String(room.displayOrder ?? 0));
    }
  }, [room]);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateRoomApi>[1]) => updateRoomApi(roomId ?? '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', floorId] });
      router.back();
    },
    onError: (err: unknown) => {
      setErrorMsg(normalizeApiError(err).message);
    },
  });

  const handleSubmit = () => {
    setErrorMsg(null);
    if (!roomNumber.trim()) {
      setErrorMsg('Room number is required.');
      return;
    }
    mutation.mutate({
      roomNumber: roomNumber.trim(),
      roomType,
      displayOrder: Number(displayOrder) || 0,
    });
  };

  const cycleRoomType = () => {
    const idx = ROOM_TYPES.indexOf(roomType);
    setRoomType(ROOM_TYPES[(idx + 1) % ROOM_TYPES.length]);
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title="Edit Room" />
        <Loading message="Loading room details..." />
      </Screen>
    );
  }

  if (isError || !room) {
    return (
      <Screen>
        <Header title="Edit Room" />
        <ErrorState
          message={error instanceof Error ? error.message : 'Room not found'}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={`Edit Room ${room.roomNumber}`} subtitle={`Type: ${room.roomType}`} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <TextInput label="Room Number *" value={roomNumber} onChangeText={setRoomNumber} />

          <Button
            title={`Room Type: ${roomType} (tap to cycle)`}
            variant="outline"
            onPress={cycleRoomType}
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
