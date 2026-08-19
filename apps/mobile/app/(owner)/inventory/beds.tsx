import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/ui/Screen';
import { TextInput } from '../../../src/components/ui/TextInput';
import { Card } from '../../../src/components/ui/Card';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { usePropertyContext } from '../../../src/context/property-context';
import { useAllBedsList } from '../../../src/features/inventory/hooks/useAllBedsList';
import { BedIndicator } from '../../../src/features/inventory/components/BedIndicator';
import { BedQuickActionModal, SelectedBedData } from '../../../src/features/inventory/components/BedQuickActionModal';
import { InventoryEmptyState } from '../../../src/features/inventory/components/InventoryEmptyState';
import { colors, spacing, typography } from '../../../src/theme';

export default function AllBedsScreen(): React.JSX.Element {
  const router = useRouter();
  const { selectedProperty, selectedPropertyId } = usePropertyContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedBedForAction, setSelectedBedForAction] = useState<SelectedBedData | null>(null);

  const {
    data: beds,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAllBedsList(selectedPropertyId, null, null, searchQuery, statusFilter);

  const bedList = beds || [];

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <TextInput
          placeholder="Search bed #, room #, or resident name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.statusChipsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: null, label: 'All States' },
              { id: 'AVAILABLE', label: '🟢 Available' },
              { id: 'OCCUPIED', label: '🔴 Occupied' },
              { id: 'MAINTENANCE', label: '🟡 Maintenance' },
              { id: 'INACTIVE', label: '⚫ Inactive' },
            ].map((chip) => (
              <TouchableOpacity
                key={chip.label}
                style={[styles.chip, statusFilter === chip.id && styles.chipActive]}
                onPress={() => setStatusFilter(chip.id)}
              >
                <Text style={[styles.chipText, statusFilter === chip.id && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.sectionHeader}>
          All Beds — {selectedProperty ? selectedProperty.name : 'Global View'} ({bedList.length})
        </Text>

        {!selectedPropertyId ? (
          <InventoryEmptyState
            title="Global View Active"
            message="Select a property using the top header to view its beds."
          />
        ) : isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: spacing.xl }}
          />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Failed to load beds list'}
            onRetry={refetch}
          />
        ) : bedList.length === 0 ? (
          <InventoryEmptyState
            title="No Beds Found"
            message={
              searchQuery || statusFilter
                ? 'No beds match your search and filter criteria.'
                : 'No beds registered under this property.'
            }
          />
        ) : (
          <FlatList
            data={bedList}
            keyExtractor={(item) => item.bed.id}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card style={styles.bedCard}>
                <View style={styles.bedMeta}>
                  <View style={styles.bedTopRow}>
                    <Text style={styles.roomInfo}>
                      🚪 Room {item.roomNumber} ({item.buildingName} • {item.floorName})
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedBedForAction({
                          bed: item.bed,
                          room: { id: item.roomId, roomNumber: item.roomNumber },
                          buildingName: item.buildingName,
                          floorName: item.floorName,
                          occupant: item.residentId && item.occupantName
                            ? { name: item.occupantName, residentId: item.residentId }
                            : undefined,
                        })
                      }
                      style={styles.manageBedBtn}
                    >
                      <Text style={styles.manageBedBtnText}>Manage →</Text>
                    </TouchableOpacity>
                  </View>

                  <BedIndicator
                    bedNumber={item.bed.bedNumber}
                    state={item.state}
                    occupantName={item.occupantName}
                    berthCardStyle={true}
                    onPress={() =>
                      setSelectedBedForAction({
                        bed: item.bed,
                        room: { id: item.roomId, roomNumber: item.roomNumber },
                        buildingName: item.buildingName,
                        floorName: item.floorName,
                        occupant: item.residentId && item.occupantName
                          ? { name: item.occupantName, residentId: item.residentId }
                          : undefined,
                      })
                    }
                  />
                </View>
              </Card>
            )}
          />
        )}

        {/* Bed Quick Action Modal */}
        <BedQuickActionModal
          selectedBed={selectedBedForAction}
          onClose={() => setSelectedBedForAction(null)}
          onStatusChanged={() => refetch()}
        />
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
  },
  statusChipsRow: {
    marginVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.primaryForeground,
    fontWeight: typography.fontWeight.bold,
  },
  sectionHeader: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  bedCard: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  bedMeta: {
    gap: spacing.xs,
  },
  roomInfo: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  bedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  manageBedBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  manageBedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
