import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { BedDto, BuildingDto, FloorDto, PropertyDto, RoomDto } from '@m-square/contracts';
import { getErrorMessage } from '../../../api/error';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { getPropertiesApi } from '../../properties/api/properties.api';
import { getBuildingsApi } from '../../buildings/api/buildings.api';
import { getFloorsApi } from '../../floors/api/floors.api';
import { getRoomsApi } from '../../rooms/api/rooms.api';
import { getBedsApi } from '../../beds/api/beds.api';
import { LocationBedSelector } from './LocationBedSelector';
import { colors, spacing, typography } from '../../../theme';

interface TransferBedModalProps {
  visible: boolean;
  residentName: string;
  currentLocation: {
    propertyName?: string;
    buildingName?: string;
    floorName?: string;
    roomNumber?: string;
    bedNumber?: string;
    bedId?: string;
  } | null;
  allocationId: string | null;
  isTransferring: boolean;
  onTransfer: (targetBedId: string, notes?: string) => Promise<void>;
  onClose: () => void;
}

export const TransferBedModal: React.FC<TransferBedModalProps> = ({
  visible,
  residentName,
  currentLocation,
  allocationId,
  isTransferring,
  onTransfer,
  onClose,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch Properties
  const { data: properties = [] } = useQuery<PropertyDto[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await getPropertiesApi();
      return res.items || [];
    },
    enabled: visible,
  });

  // Auto-select first property if available and not selected
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // 2. Fetch Buildings for Selected Property
  const { data: buildings = [] } = useQuery<BuildingDto[]>({
    queryKey: ['buildings', selectedPropertyId],
    queryFn: async () => {
      if (!selectedPropertyId) return [];
      const res = await getBuildingsApi(selectedPropertyId);
      return res.items || [];
    },
    enabled: visible && !!selectedPropertyId,
  });

  // 3. Fetch Floors for Selected Building
  const { data: floors = [] } = useQuery<FloorDto[]>({
    queryKey: ['floors', selectedBuildingId],
    queryFn: async () => {
      if (!selectedBuildingId) return [];
      const res = await getFloorsApi(selectedBuildingId);
      return res.items || [];
    },
    enabled: visible && !!selectedBuildingId,
  });

  // 4. Fetch Rooms for Selected Floor
  const { data: rooms = [] } = useQuery<RoomDto[]>({
    queryKey: ['rooms', selectedFloorId],
    queryFn: async () => {
      if (!selectedFloorId) return [];
      const res = await getRoomsApi(selectedFloorId);
      return res.items || [];
    },
    enabled: visible && !!selectedFloorId,
  });

  // 5. Fetch Beds for Selected Room
  const { data: beds = [], isLoading: isLoadingBeds } = useQuery<BedDto[]>({
    queryKey: ['beds', selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return [];
      const res = await getBedsApi(selectedRoomId);
      return res.items || [];
    },
    enabled: visible && !!selectedRoomId,
  });

  // Reset internal state when modal becomes invisible
  useEffect(() => {
    if (!visible) {
      setSelectedPropertyId(null);
      setSelectedBuildingId(null);
      setSelectedFloorId(null);
      setSelectedRoomId(null);
      setSelectedBedId(null);
      setShowConfirm(false);
      setErrorMsg(null);
    }
  }, [visible]);

  // Derive target bed details for confirmation view
  const targetBedObj = beds.find((b) => b.id === selectedBedId);
  const targetRoomObj = rooms.find((r) => r.id === selectedRoomId);
  const targetBuildingObj = buildings.find((b) => b.id === selectedBuildingId);
  const targetPropertyObj = properties.find((p) => p.id === selectedPropertyId);

  const handleConfirmTransfer = async () => {
    if (!selectedBedId || !allocationId) return;
    try {
      setErrorMsg(null);
      await onTransfer(selectedBedId);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
      setShowConfirm(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Modal Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔄 Transfer Bed / Room Change</Text>
          <TouchableOpacity onPress={onClose} disabled={isTransferring} accessibilityRole="button">
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {/* Resident & Current Location Info */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>RESIDENT</Text>
            <Text style={styles.residentName}>👤 {residentName}</Text>

            <Text style={[styles.cardTitle, { marginTop: spacing.sm }]}>CURRENT LOCATION</Text>
            {currentLocation ? (
              <Text style={styles.locationText}>
                🏢 {currentLocation.propertyName || 'Property'} • {currentLocation.buildingName || 'Block'} • {currentLocation.floorName || 'Floor'} • Room {currentLocation.roomNumber || 'N/A'} • Bed {currentLocation.bedNumber || 'N/A'}
              </Text>
            ) : (
              <Text style={styles.emptyText}>No active bed allocation found.</Text>
            )}
          </Card>

          {!showConfirm ? (
            <>
              {/* Target Location Selector */}
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>SELECT NEW LOCATION</Text>
                <LocationBedSelector
                  properties={properties}
                  buildings={buildings}
                  floors={floors}
                  rooms={rooms}
                  beds={beds}
                  selectedPropertyId={selectedPropertyId}
                  selectedBuildingId={selectedBuildingId}
                  selectedFloorId={selectedFloorId}
                  selectedRoomId={selectedRoomId}
                  selectedBedId={selectedBedId}
                  isLoading={isLoadingBeds}
                  onSelectProperty={(id) => {
                    setSelectedPropertyId(id);
                    setSelectedBuildingId(null);
                    setSelectedFloorId(null);
                    setSelectedRoomId(null);
                    setSelectedBedId(null);
                  }}
                  onSelectBuilding={(id) => {
                    setSelectedBuildingId(id);
                    setSelectedFloorId(null);
                    setSelectedRoomId(null);
                    setSelectedBedId(null);
                  }}
                  onSelectFloor={(id) => {
                    setSelectedFloorId(id);
                    setSelectedRoomId(null);
                    setSelectedBedId(null);
                  }}
                  onSelectRoom={(id) => {
                    setSelectedRoomId(id);
                    setSelectedBedId(null);
                  }}
                  onSelectBed={(id) => setSelectedBedId(id)}
                />
              </Card>

              {/* Actions */}
              <View style={styles.actions}>
                <Button title="Cancel" variant="outline" onPress={onClose} disabled={isTransferring} />
                <Button
                  title="Review Transfer →"
                  disabled={!selectedBedId || selectedBedId === currentLocation?.bedId || isTransferring}
                  onPress={() => {
                    setErrorMsg(null);
                    setShowConfirm(true);
                  }}
                />
              </View>
            </>
          ) : (
            /* Confirmation Screen */
            <Card style={styles.card}>
              <Text style={styles.confirmTitle}>Confirm Resident Bed Transfer?</Text>
              <Text style={styles.confirmSubtitle}>
                You are about to transfer <Text style={{ fontWeight: 'bold' }}>{residentName}</Text> to a new physical bed.
              </Text>

              <View style={styles.compareBox}>
                <View style={styles.compareCol}>
                  <Text style={styles.compareHeader}>CURRENT BED</Text>
                  <Text style={styles.compareValue}>
                    {currentLocation?.buildingName || ''}
                  </Text>
                  <Text style={styles.compareValue}>
                    Room {currentLocation?.roomNumber || ''}
                  </Text>
                  <Text style={[styles.compareValue, { fontWeight: 'bold', color: colors.danger }]}>
                    Bed {currentLocation?.bedNumber || ''}
                  </Text>
                </View>

                <Text style={styles.arrow}>➔</Text>

                <View style={styles.compareCol}>
                  <Text style={styles.compareHeader}>NEW TARGET BED</Text>
                  <Text style={styles.compareValue}>
                    {targetBuildingObj?.name || 'Block'}
                  </Text>
                  <Text style={styles.compareValue}>
                    Room {targetRoomObj?.roomNumber || ''}
                  </Text>
                  <Text style={[styles.compareValue, { fontWeight: 'bold', color: colors.success }]}>
                    Bed {targetBedObj?.bedNumber || ''}
                  </Text>
                </View>
              </View>

              <Text style={styles.confirmNote}>
                ℹ️ The current bed will be marked AVAILABLE immediately, and the new target bed will be marked OCCUPIED in real-time PostgreSQL.
              </Text>

              <View style={styles.actions}>
                <Button
                  title="← Change Target"
                  variant="outline"
                  onPress={() => setShowConfirm(false)}
                  disabled={isTransferring}
                />
                <Button
                  title={isTransferring ? 'Transferring...' : '✓ Confirm & Transfer Bed'}
                  disabled={isTransferring}
                  onPress={handleConfirmTransfer}
                />
              </View>
            </Card>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  closeButton: {
    fontSize: typography.fontSize.lg,
    color: colors.muted,
    padding: spacing.xs,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  residentName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: 2,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginTop: 4,
  },
  emptyText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: colors.danger + '15',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.danger,
    fontWeight: typography.fontWeight.bold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  confirmTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  confirmSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  compareBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.mutedBackground,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  compareCol: {
    flex: 1,
    alignItems: 'center',
  },
  compareHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  compareValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  arrow: {
    fontSize: 20,
    color: colors.primary,
    marginHorizontal: spacing.xs,
  },
  confirmNote: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
