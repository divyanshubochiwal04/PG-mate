import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { TextInput } from '../../../src/components/ui/TextInput';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { usePropertyContext } from '../../../src/context/property-context';
import { useAllRoomsList } from '../../../src/features/inventory/hooks/useAllRoomsList';
import { RoomOccupancyCard } from '../../../src/features/inventory/components/RoomOccupancyCard';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function AllRoomsScreen(): React.JSX.Element {
  const { selectedProperty, selectedPropertyId } = usePropertyContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VACANT' | 'FULL'>('ALL');
  const [sharingFilter, setSharingFilter] = useState<number | null>(null);

  const {
    data: rooms,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAllRoomsList(selectedPropertyId, null, null, searchQuery);

  const roomList = rooms || [];

  // Filter rooms based on status and sharing
  const filteredRooms = roomList.filter((item) => {
    const isFull = item.occupiedCount >= item.room.capacity && item.room.capacity > 0;
    const hasVacant = item.occupiedCount < item.room.capacity;

    if (statusFilter === 'VACANT' && !hasVacant) return false;
    if (statusFilter === 'FULL' && !isFull) return false;
    if (sharingFilter !== null && item.room.capacity !== sharingFilter) return false;

    return true;
  });

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <TextInput
          placeholder="Search room number..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={{ marginBottom: 8 }}
        />

        {/* Status Filter Chips */}
        <View style={styles.chipsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'ALL', label: `All (${roomList.length})` },
              { id: 'VACANT', label: '🟢 Has Vacant Beds' },
              { id: 'FULL', label: '🔴 Fully Occupied' },
            ].map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={[styles.statusChip, statusFilter === chip.id && styles.statusChipActive]}
                onPress={() => setStatusFilter(chip.id as any)}
              >
                <Text style={[styles.statusChipText, statusFilter === chip.id && styles.statusChipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sharing Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {[
              { id: null, label: 'All Sharing' },
              { id: 1, label: '1-Bed (Single)' },
              { id: 2, label: '2-Bed Sharing' },
              { id: 3, label: '3-Bed Sharing' },
              { id: 4, label: '4-Bed Sharing' },
            ].map((chip) => (
              <TouchableOpacity
                key={String(chip.id)}
                style={[styles.sharingChip, sharingFilter === chip.id && styles.sharingChipActive]}
                onPress={() => setSharingFilter(chip.id)}
              >
                <Text style={[styles.sharingChipText, sharingFilter === chip.id && styles.sharingChipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.sectionHeader}>
          All Rooms — {selectedProperty ? selectedProperty.name : 'Global View'} ({filteredRooms.length})
        </Text>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={140} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={140} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={140} style={{ marginBottom: spacing.sm }} />
          </View>
        ) : isError ? (
          <ErrorState
            title="Failed to load rooms list"
            error={error}
            onRetry={refetch}
          />
        ) : filteredRooms.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No Matching Rooms Found"
            description={
              searchQuery || statusFilter !== 'ALL' || sharingFilter !== null
                ? 'No rooms match your active search and filter criteria.'
                : 'No rooms registered for this property.'
            }
            actionTitle="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setSharingFilter(null);
            }}
          />
        ) : (
          <FlatList
            data={filteredRooms}
            keyExtractor={(item) => item.room.id}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <RoomOccupancyCard
                room={item.room}
                buildingName={item.buildingName}
                floorName={item.floorName}
                beds={item.beds}
              />
            )}
          />
        )}
      </View>
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
    paddingBottom: 0,
  },
  chipsWrap: {
    marginBottom: spacing.xs,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sharingChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  sharingChipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  sharingChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sharingChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginVertical: spacing.xs,
  },
  loadingWrap: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  listContent: {
    paddingBottom: 110,
  },
});
