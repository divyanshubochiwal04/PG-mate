import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { GlobalHeader } from '../../../src/components/common/GlobalHeader';
import { colors, spacing, typography } from '../../../src/theme';

export default function InventoryLayout(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();

  const isRooms = pathname.includes('/inventory/rooms');
  const isBeds = pathname.includes('/inventory/beds');
  const isDetail = pathname.includes('/inventory/room') || pathname.includes('/inventory/block');
  const isVisual = !isRooms && !isBeds && !isDetail;

  return (
    <View style={styles.container}>
      <GlobalHeader
        title={isDetail ? 'Room Details' : 'Physical Occupancy'}
        showBackButton={isDetail}
      />

      {!isDetail && (
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, isVisual && styles.segmentActive]}
            onPress={() => router.push('/(owner)/inventory')}
            accessibilityRole="button"
            accessibilityLabel="Visual Occupancy Map"
          >
            <Text style={[styles.segmentText, isVisual && styles.segmentTextActive]}>
              🗺️ Visual Map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, isRooms && styles.segmentActive]}
            onPress={() => router.push('/(owner)/inventory/rooms')}
            accessibilityRole="button"
            accessibilityLabel="All Rooms View"
          >
            <Text style={[styles.segmentText, isRooms && styles.segmentTextActive]}>
              🚪 All Rooms
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, isBeds && styles.segmentActive]}
            onPress={() => router.push('/(owner)/inventory/beds')}
            accessibilityRole="button"
            accessibilityLabel="All Beds View"
          >
            <Text style={[styles.segmentText, isBeds && styles.segmentTextActive]}>🛏️ All Beds</Text>
          </TouchableOpacity>
        </View>
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="rooms" />
        <Stack.Screen name="beds" />
        <Stack.Screen name="room/[id]" />
        <Stack.Screen name="block/[id]" />
        <Stack.Screen name="block-[id]" />
        <Stack.Screen name="room-[id]" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: colors.mutedBackground,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  segmentTextActive: {
    color: colors.primaryForeground,
    fontWeight: typography.fontWeight.bold,
  },
});
