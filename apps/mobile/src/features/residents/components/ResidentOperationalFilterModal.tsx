import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type {
  BuildingDto,
  FloorDto,
  PropertyDto,
  ResidentBillingStatusFilter,
  ResidentMessStatusFilter,
  ResidentStayStatusFilter,
} from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { getPropertiesApi } from '../../properties/api/properties.api';
import { getBuildingsApi } from '../../buildings/api/buildings.api';
import { getFloorsApi } from '../../floors/api/floors.api';
import { colors, spacing, typography } from '../../../theme';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  stayStatus: ResidentStayStatusFilter;
  setStayStatus: (val: ResidentStayStatusFilter) => void;
  propertyId?: string;
  setPropertyId: (val?: string) => void;
  buildingId?: string;
  setBuildingId: (val?: string) => void;
  floorId?: string;
  setFloorId: (val?: string) => void;
  messStatus: ResidentMessStatusFilter;
  setMessStatus: (val: ResidentMessStatusFilter) => void;
  billingStatus: ResidentBillingStatusFilter;
  setBillingStatus: (val: ResidentBillingStatusFilter) => void;
  onResetAll: () => void;
}

export const ResidentOperationalFilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  stayStatus,
  setStayStatus,
  propertyId,
  setPropertyId,
  buildingId,
  setBuildingId,
  floorId,
  setFloorId,
  messStatus,
  setMessStatus,
  billingStatus,
  setBillingStatus,
  onResetAll,
}) => {
  // Fetch properties
  const { data: properties = [] } = useQuery<PropertyDto[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await getPropertiesApi();
      return res.items || [];
    },
    enabled: visible,
  });

  // Fetch buildings for selected property
  const { data: buildings = [] } = useQuery<BuildingDto[]>({
    queryKey: ['buildings', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const res = await getBuildingsApi(propertyId);
      return res.items || [];
    },
    enabled: visible && !!propertyId,
  });

  // Fetch floors for selected building
  const { data: floors = [] } = useQuery<FloorDto[]>({
    queryKey: ['floors', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      const res = await getFloorsApi(buildingId);
      return res.items || [];
    },
    enabled: visible && !!buildingId,
  });

  const handlePropertySelect = (id?: string) => {
    setPropertyId(id);
    setBuildingId(undefined);
    setFloorId(undefined);
  };

  const handleBuildingSelect = (id?: string) => {
    setBuildingId(id);
    setFloorId(undefined);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Operational Filters</Text>
            <TouchableOpacity onPress={onResetAll} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* Stay Status Section */}
            <Text style={styles.sectionTitle}>Stay Status</Text>
            <View style={styles.chipGrid}>
              {[
                { id: 'ALL', label: 'All Stays' },
                { id: 'ACTIVE', label: '🟢 ACTIVE' },
                { id: 'CHECKED_OUT', label: '🚪 CHECKED OUT' },
                { id: 'NO_STAY', label: '⚪ NO STAY' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.chip,
                    stayStatus === item.id && styles.chipActive,
                  ]}
                  onPress={() => setStayStatus(item.id as ResidentStayStatusFilter)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      stayStatus === item.id && styles.chipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Location Hierarchy Section */}
            <Text style={styles.sectionTitle}>Location Hierarchy</Text>

            {/* Property Select */}
            <Text style={styles.subTitle}>Property</Text>
            <View style={styles.chipGrid}>
              <TouchableOpacity
                style={[styles.chip, !propertyId && styles.chipActive]}
                onPress={() => handlePropertySelect(undefined)}
              >
                <Text style={[styles.chipText, !propertyId && styles.chipTextActive]}>
                  All Properties
                </Text>
              </TouchableOpacity>
              {properties.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, propertyId === p.id && styles.chipActive]}
                  onPress={() => handlePropertySelect(p.id)}
                >
                  <Text style={[styles.chipText, propertyId === p.id && styles.chipTextActive]}>
                    🏢 {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Building Select */}
            {propertyId ? (
              <>
                <Text style={styles.subTitle}>Building</Text>
                <View style={styles.chipGrid}>
                  <TouchableOpacity
                    style={[styles.chip, !buildingId && styles.chipActive]}
                    onPress={() => handleBuildingSelect(undefined)}
                  >
                    <Text style={[styles.chipText, !buildingId && styles.chipTextActive]}>
                      All Buildings
                    </Text>
                  </TouchableOpacity>
                  {buildings.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.chip, buildingId === b.id && styles.chipActive]}
                      onPress={() => handleBuildingSelect(b.id)}
                    >
                      <Text style={[styles.chipText, buildingId === b.id && styles.chipTextActive]}>
                        🏬 {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}

            {/* Floor Select */}
            {buildingId ? (
              <>
                <Text style={styles.subTitle}>Floor</Text>
                <View style={styles.chipGrid}>
                  <TouchableOpacity
                    style={[styles.chip, !floorId && styles.chipActive]}
                    onPress={() => setFloorId(undefined)}
                  >
                    <Text style={[styles.chipText, !floorId && styles.chipTextActive]}>
                      All Floors
                    </Text>
                  </TouchableOpacity>
                  {floors.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.chip, floorId === f.id && styles.chipActive]}
                      onPress={() => setFloorId(f.id)}
                    >
                      <Text style={[styles.chipText, floorId === f.id && styles.chipTextActive]}>
                        Floor {f.floorNumber}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}

            {/* Mess Status Section */}
            <Text style={styles.sectionTitle}>Mess Subscription</Text>
            <View style={styles.chipGrid}>
              {[
                { id: 'ALL', label: 'All Mess' },
                { id: 'ACTIVE', label: '🥗 Active Sub' },
                { id: 'NONE', label: '🚫 No Mess Sub' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, messStatus === item.id && styles.chipActive]}
                  onPress={() => setMessStatus(item.id as ResidentMessStatusFilter)}
                >
                  <Text style={[styles.chipText, messStatus === item.id && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Billing Dues Section */}
            <Text style={styles.sectionTitle}>Billing & Dues</Text>
            <View style={styles.chipGrid}>
              {[
                { id: 'ALL', label: 'All Dues' },
                { id: 'DUE', label: '🔴 Outstanding Dues' },
                { id: 'PAID', label: '🟢 Fully Paid' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, billingStatus === item.id && styles.chipActive]}
                  onPress={() => setBillingStatus(item.id as ResidentBillingStatusFilter)}
                >
                  <Text style={[styles.chipText, billingStatus === item.id && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button title="Apply Filters" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  resetButton: {
    padding: spacing.xs,
  },
  resetText: {
    fontSize: typography.fontSize.xs,
    color: colors.danger,
    fontWeight: typography.fontWeight.semibold,
  },
  scrollBody: {
    marginVertical: spacing.xs,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  subTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  modalFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
