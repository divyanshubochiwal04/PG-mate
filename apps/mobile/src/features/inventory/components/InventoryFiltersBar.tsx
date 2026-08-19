import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BuildingDto, FloorDto } from '@m-square/contracts';
import { colors, spacing, typography } from '../../../theme';

interface InventoryFiltersBarProps {
  buildings: BuildingDto[];
  floors: FloorDto[];
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  onSelectBuilding: (id: string | null) => void;
  onSelectFloor: (id: string | null) => void;
}

export const InventoryFiltersBar: React.FC<InventoryFiltersBarProps> = ({
  buildings,
  floors,
  selectedBuildingId,
  selectedFloorId,
  onSelectBuilding,
  onSelectFloor,
}) => {
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [floorModalVisible, setFloorModalVisible] = useState(false);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const selectedFloor = floors.find((f) => f.id === selectedFloorId);

  const blockLabel = selectedBuilding ? selectedBuilding.name : 'All Blocks';
  const floorLabel = selectedFloor ? selectedFloor.name : 'All Floors';

  return (
    <View style={styles.filterRow}>
      <TouchableOpacity
        style={styles.filterPill}
        onPress={() => setBlockModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Filter by block. Selected: ${blockLabel}`}
      >
        <Text style={styles.filterText} numberOfLines={1}>
          🏢 {blockLabel} ▾
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.filterPill}
        onPress={() => setFloorModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Filter by floor. Selected: ${floorLabel}`}
      >
        <Text style={styles.filterText} numberOfLines={1}>
          🧱 {floorLabel} ▾
        </Text>
      </TouchableOpacity>

      {/* BLOCK MODAL */}
      <Modal
        visible={blockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBlockModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setBlockModalVisible(false)}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Filter by Block / Building</Text>
            <TouchableOpacity
              style={[styles.item, selectedBuildingId === null && styles.selectedItem]}
              onPress={() => {
                onSelectBuilding(null);
                setBlockModalVisible(false);
              }}
            >
              <Text style={styles.itemText}>🏢 All Blocks (Global)</Text>
            </TouchableOpacity>

            <FlatList
              data={buildings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, selectedBuildingId === item.id && styles.selectedItem]}
                  onPress={() => {
                    onSelectBuilding(item.id);
                    setBlockModalVisible(false);
                  }}
                >
                  <Text style={styles.itemText}>🏢 {item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* FLOOR MODAL */}
      <Modal
        visible={floorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFloorModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setFloorModalVisible(false)}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Filter by Floor</Text>
            <TouchableOpacity
              style={[styles.item, selectedFloorId === null && styles.selectedItem]}
              onPress={() => {
                onSelectFloor(null);
                setFloorModalVisible(false);
              }}
            >
              <Text style={styles.itemText}>🧱 All Floors</Text>
            </TouchableOpacity>

            <FlatList
              data={floors}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, selectedFloorId === item.id && styles.selectedItem]}
                  onPress={() => {
                    onSelectFloor(item.id);
                    setFloorModalVisible(false);
                  }}
                >
                  <Text style={styles.itemText}>🧱 {item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterPill: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalBody: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  item: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedItem: {
    backgroundColor: colors.mutedBackground,
  },
  itemText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
});
