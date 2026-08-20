import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/ui/Screen';
import { TextInput } from '../../../src/components/ui/TextInput';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { usePropertyContext } from '../../../src/context/property-context';
import { useInventoryTree } from '../../../src/features/inventory/hooks/useInventoryTree';
import { BedStatusLegend } from '../../../src/features/inventory/components/BedStatusLegend';
import { InventorySummaryCards } from '../../../src/features/inventory/components/InventorySummaryCards';
import { InventoryFiltersBar } from '../../../src/features/inventory/components/InventoryFiltersBar';
import { RoomOccupancyCard } from '../../../src/features/inventory/components/RoomOccupancyCard';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function InventoryVisualMapScreen(): React.JSX.Element {
  const router = useRouter();
  const { selectedProperty, selectedPropertyId } = usePropertyContext();
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VACANT' | 'FULL' | 'MAINTENANCE'>('ALL');
  const [sharingFilter, setSharingFilter] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch, isRefetching } = useInventoryTree(
    selectedPropertyId,
    buildingId,
    floorId
  );

  const buildings = data?.buildings || [];
  const floors = data?.floors || [];
  const floorMap = data?.floorMap || [];
  const summary = data?.summary || {
    totalBeds: 0,
    occupiedCount: 0,
    availableCount: 0,
    maintenanceCount: 0,
  };

  const handleShareAllVacancies = async () => {
    const propertyName = selectedProperty?.name || 'PG.mate Properties';
    const text = `🏢 *${propertyName} — Live Room & Bed Vacancy List*\n\n` +
      `📊 *Current Availability:*\n` +
      `🟢 Total Vacant Beds: *${summary.availableCount}*\n` +
      `🛏️ Total Capacity: *${summary.totalBeds} beds*\n` +
      `🔴 Occupied: *${summary.occupiedCount}*\n` +
      `🔧 Maintenance: *${summary.maintenanceCount}*\n\n` +
      `✨ Immediate Move-in Available with Wi-Fi, Food & Housekeeping.\n` +
      `📞 Contact us now for bookings!`;

    try {
      await Share.share({ message: text });
    } catch {
      // Ignored
    }
  };

  // Filter floorMap based on search, status, and sharing
  const filteredFloorMap = floorMap.map((floorItem) => {
    const filteredRooms = floorItem.rooms.filter((roomData) => {
      const roomNum = roomData.room.roomNumber.toLowerCase();
      const beds = roomData.beds;
      const occupied = beds.filter((b) => data?.occupantMap?.[b.id] || b.status === 'OCCUPIED').length;
      const capacity = roomData.room.capacity || beds.length;
      const hasVacant = occupied < capacity;
      const isFull = occupied >= capacity && capacity > 0;
      const hasMaintenance = beds.some((b) => b.status === 'MAINTENANCE');

      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        roomNum.includes(q) ||
        beds.some((b) => b.bedNumber.toLowerCase().includes(q)) ||
        beds.some((b) => data?.occupantMap?.[b.id]?.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'VACANT' && !hasVacant) return false;
      if (statusFilter === 'FULL' && !isFull) return false;
      if (statusFilter === 'MAINTENANCE' && !hasMaintenance) return false;

      // Sharing filter
      if (sharingFilter !== null && capacity !== sharingFilter) return false;

      return true;
    });

    return {
      ...floorItem,
      rooms: filteredRooms,
    };
  }).filter((floorItem) => floorItem.rooms.length > 0 || !searchQuery);

  const totalVisibleRooms = filteredFloorMap.reduce((acc, f) => acc + f.rooms.length, 0);

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <BedStatusLegend />

        <InventoryFiltersBar
          buildings={buildings}
          floors={floors}
          selectedBuildingId={buildingId}
          selectedFloorId={floorId}
          onSelectBuilding={setBuildingId}
          onSelectFloor={setFloorId}
        />

        <InventorySummaryCards
          totalBeds={summary.totalBeds}
          occupiedCount={summary.occupiedCount}
          availableCount={summary.availableCount}
          maintenanceCount={summary.maintenanceCount}
        />

        {/* Live Vacancy Share Action Card */}
        {selectedPropertyId && summary.availableCount > 0 && (
          <View style={styles.broadcastCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.broadcastTitle}>📢 {summary.availableCount} Beds Available for Booking</Text>
              <Text style={styles.broadcastSub}>Share instant vacancy brochure on WhatsApp groups</Text>
            </View>
            <TouchableOpacity style={styles.broadcastBtn} onPress={handleShareAllVacancies}>
              <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
              <Text style={styles.broadcastBtnText}>Share Vacancy</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar & Instant Chips */}
        <View style={styles.searchSection}>
          <TextInput
            placeholder="Search room #, bed #, or resident..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={{ marginBottom: 8 }}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {[
              { id: 'ALL', label: 'All Rooms' },
              { id: 'VACANT', label: `🟢 Has Vacant Beds (${summary.availableCount})` },
              { id: 'FULL', label: `🔴 Fully Occupied (${summary.occupiedCount})` },
              { id: 'MAINTENANCE', label: `🟡 Maintenance (${summary.maintenanceCount})` },
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipsScroll, { marginTop: 6 }]}>
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

        {!selectedPropertyId ? (
          <EmptyState
            icon="business-outline"
            title="Global View Active"
            description="Select a specific property in the header above to view its block & floor room map."
          />
        ) : isLoading ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={80} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={140} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={140} style={{ marginBottom: spacing.sm }} />
          </View>
        ) : isError ? (
          <ErrorState
            title="Failed to load visual inventory"
            error={error}
            onRetry={refetch}
          />
        ) : filteredFloorMap.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No Matching Rooms Found"
            description={
              searchQuery || statusFilter !== 'ALL' || sharingFilter !== null
                ? 'No rooms match your active search and filter criteria.'
                : `No rooms or floors available under ${selectedProperty?.name || 'this property'}.`
            }
            actionTitle="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setSharingFilter(null);
            }}
          />
        ) : (
          filteredFloorMap.map((item) => (
            <View key={item.floor.id} style={styles.floorBlock}>
              <View style={styles.floorHeader}>
                <Ionicons name="layers-outline" size={16} color={colors.primary} />
                <Text style={styles.floorTitle}>
                  {item.floor.name} (Floor {item.floor.floorNumber})
                </Text>
                <View style={styles.floorRoomCountBadge}>
                  <Text style={styles.floorRoomCountText}>{item.rooms.length} Rooms</Text>
                </View>
              </View>
              {item.rooms.length === 0 ? (
                <Text style={styles.noRoomsText}>No rooms on this floor matching criteria.</Text>
              ) : (
                <View style={styles.roomsGrid}>
                  {item.rooms.map((roomData) => (
                    <RoomOccupancyCard
                      key={roomData.room.id}
                      room={roomData.room}
                      beds={roomData.beds}
                      facilities={roomData.facilities}
                      occupantMap={data?.occupantMap}
                      buildingName={buildings.find((b) => b.id === roomData.room.buildingId)?.name}
                      floorName={item.floor.name}
                      onPress={() =>
                        router.push(
                          `/(owner)/inventory/room/${roomData.room.id}` as `/inventory/room/${string}`
                        )
                      }
                    />
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 64,
  },
  broadcastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    gap: 10,
  },
  broadcastTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  broadcastSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  broadcastBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  searchSection: {
    marginBottom: spacing.md,
  },
  chipsScroll: {
    flexDirection: 'row',
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

  loadingWrap: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  floorBlock: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  floorTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  floorRoomCountBadge: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  floorRoomCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  noRoomsText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    padding: spacing.xs,
  },
  roomsGrid: {
    gap: spacing.xs,
  },
});
