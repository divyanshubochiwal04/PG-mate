import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../../src/components/ui/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { ErrorState } from '../../../../src/components/ui/ErrorState';
import { getBuildingByIdApi } from '../../../../src/features/buildings/api/buildings.api';
import { useInventoryTree } from '../../../../src/features/inventory/hooks/useInventoryTree';
import { RoomOccupancyCard } from '../../../../src/features/inventory/components/RoomOccupancyCard';
import { InventorySummaryCards } from '../../../../src/features/inventory/components/InventorySummaryCards';
import { usePropertyContext } from '../../../../src/context/property-context';
import { colors, spacing, typography } from '../../../../src/theme';

export default function BlockDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedPropertyId } = usePropertyContext();

  const isValidId = Boolean(id && id !== 'index' && id !== 'undefined');

  const { data: building, isLoading: isLoadingBuilding } = useQuery({
    queryKey: ['buildings', 'detail', id],
    queryFn: () => (isValidId ? getBuildingByIdApi(id) : null),
    enabled: isValidId,
  });

  const { data, isLoading, isError, error, refetch, isRefetching } = useInventoryTree(
    selectedPropertyId,
    id,
    null
  );

  const summary = data?.summary || {
    totalBeds: 0,
    occupiedCount: 0,
    availableCount: 0,
    maintenanceCount: 0,
  };
  const floorMap = data?.floorMap || [];
  const occupancyPercent =
    summary.totalBeds > 0 ? Math.round((summary.occupiedCount / summary.totalBeds) * 100) : 0;

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backBtnText}>Back to Inventory</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>🏢 Block: {building?.name || id}</Text>
          <Text style={styles.subtitle}>Code: {building?.code || 'N/A'}</Text>
        </View>

        <Card style={styles.occupancyCard}>
          <View style={styles.occupancyRow}>
            <Text style={styles.occupancyLabel}>Block Occupancy Rate</Text>
            <Text style={styles.occupancyValue}>{occupancyPercent}%</Text>
          </View>
        </Card>

        <InventorySummaryCards
          totalBeds={summary.totalBeds}
          occupiedCount={summary.occupiedCount}
          availableCount={summary.availableCount}
          maintenanceCount={summary.maintenanceCount}
        />

        <Text style={styles.sectionTitle}>Floor Breakdown</Text>

        {isLoading || isLoadingBuilding ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ margin: spacing.lg }} />
        ) : isError ? (
          <ErrorState
            title="Failed to load block details"
            error={error}
            onRetry={refetch}
          />
        ) : floorMap.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No floors or rooms registered in this block.</Text>
          </Card>
        ) : (
          floorMap.map((item) => (
            <View key={item.floor.id} style={styles.floorBlock}>
              <Text style={styles.floorTitle}>
                🧱 {item.floor.name} (Floor {item.floor.floorNumber})
              </Text>
              {item.rooms.map((roomData) => (
                <RoomOccupancyCard
                  key={roomData.room.id}
                  room={roomData.room}
                  beds={roomData.beds}
                  facilities={roomData.facilities}
                  occupantMap={data?.occupantMap}
                  onPress={() => router.push(`/(owner)/inventory/room/${roomData.room.id}`)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 72 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  backBtnText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  header: { marginBottom: spacing.md },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text },
  subtitle: { fontSize: typography.fontSize.xs, color: colors.muted, marginTop: 2 },
  occupancyCard: { padding: spacing.md, marginBottom: spacing.md },
  occupancyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  occupancyLabel: { fontSize: typography.fontSize.sm, color: colors.muted },
  occupancyValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.primary },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyCard: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.fontSize.sm, color: colors.muted },
  floorBlock: { marginBottom: spacing.md },
  floorTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
});
