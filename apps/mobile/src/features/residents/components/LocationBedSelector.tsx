import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BedDto, BuildingDto, FloorDto, PropertyDto, RoomDto } from '@m-square/contracts';
import { BedIndicator } from '../../inventory/components/BedIndicator';
import type { DisplayBedState } from '../../inventory/components/BedIndicator';
import { InventoryFiltersBar } from '../../inventory/components/InventoryFiltersBar';
import { colors, spacing, typography } from '../../../theme';

interface LocationBedSelectorProps {
  properties?: PropertyDto[];
  buildings: BuildingDto[];
  floors: FloorDto[];
  rooms: RoomDto[];
  beds: BedDto[];
  selectedPropertyId?: string | null;
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedRoomId: string | null;
  selectedBedId: string | null;
  occupantMap?: Record<string, string>;
  isLoading?: boolean;
  onSelectProperty?: (id: string | null) => void;
  onSelectBuilding: (id: string | null) => void;
  onSelectFloor: (id: string | null) => void;
  onSelectRoom: (id: string | null) => void;
  onSelectBed: (id: string | null) => void;
}

export const LocationBedSelector: React.FC<LocationBedSelectorProps> = ({
  properties,
  buildings,
  floors,
  rooms,
  beds,
  selectedPropertyId,
  selectedBuildingId,
  selectedFloorId,
  selectedRoomId,
  selectedBedId,
  occupantMap = {},
  isLoading,
  onSelectProperty,
  onSelectBuilding,
  onSelectFloor,
  onSelectRoom,
  onSelectBed,
}) => {
  return (
    <View style={styles.container}>
      {properties && properties.length > 0 && onSelectProperty && (
        <View style={{ marginBottom: spacing.xs }}>
          <Text style={styles.sectionTitle}>1. Select Property</Text>
          <View style={styles.chipsGrid}>
            {properties.map((p) => {
              const isSelected = p.id === selectedPropertyId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => {
                    onSelectProperty(p.id);
                    onSelectBuilding(null);
                    onSelectFloor(null);
                    onSelectRoom(null);
                    onSelectBed(null);
                  }}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    🏢 {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>2. Select Block & Floor</Text>
      <InventoryFiltersBar
        buildings={buildings}
        floors={floors}
        selectedBuildingId={selectedBuildingId}
        selectedFloorId={selectedFloorId}
        onSelectBuilding={onSelectBuilding}
        onSelectFloor={onSelectFloor}
      />

      <Text style={styles.sectionTitle}>2. Select Room</Text>
      {rooms.length === 0 ? (
        <Text style={styles.emptyText}>No rooms available under selected block/floor.</Text>
      ) : (
        <View style={styles.chipsGrid}>
          {rooms.map((r) => {
            const isSelected = r.id === selectedRoomId;
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => {
                  onSelectRoom(r.id);
                  onSelectBed(null);
                }}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  Room {r.roomNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.sectionTitle}>3. Select Available Bed</Text>
      {!selectedRoomId ? (
        <Text style={styles.emptyText}>Select a room above to view available physical beds.</Text>
      ) : isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ margin: spacing.md }} />
      ) : beds.length === 0 ? (
        <Text style={styles.emptyText}>No beds configured for this room.</Text>
      ) : (
        <View style={styles.bedsGrid}>
          {beds.map((b) => {
            const occupant = occupantMap[b.id];
            let state: DisplayBedState = 'AVAILABLE';
            if (occupant || b.status === 'OCCUPIED') {
              state = 'OCCUPIED';
            } else if (b.status === 'MAINTENANCE') {
              state = 'MAINTENANCE';
            } else if (b.status === 'INACTIVE') {
              state = 'INACTIVE';
            }

            const isSelectable = state === 'AVAILABLE';
            const isSelected = b.id === selectedBedId;

            return (
              <TouchableOpacity
                key={b.id}
                disabled={!isSelectable}
                style={[
                  styles.bedBox,
                  isSelected && styles.bedSelected,
                  !isSelectable && styles.bedDisabled,
                ]}
                onPress={() => onSelectBed(b.id)}
                accessibilityRole="button"
                accessibilityLabel={`Bed ${b.bedNumber}, ${state}, ${isSelectable ? 'tap to select' : 'unavailable'}`}
              >
                <BedIndicator bedNumber={b.bedNumber} state={state} occupantName={occupant} />
                {isSelected && <Text style={styles.selectedBadge}>✓ SELECTED</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.primaryForeground,
    fontWeight: typography.fontWeight.bold,
  },
  bedsGrid: {
    gap: spacing.xs,
  },
  bedBox: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bedSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.mutedBackground,
  },
  bedDisabled: {
    opacity: 0.6,
  },
  selectedBadge: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textAlign: 'right',
    paddingRight: spacing.xs,
    paddingBottom: 2,
  },
  emptyText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    fontStyle: 'italic',
  },
});
