import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteBuildingApi,
  getBuildingOccupancyTreeApi,
} from '@/features/buildings/api/buildings.api';
import { DeleteBuildingModal } from '@/features/buildings/components/DeleteBuildingModal';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { colors, spacing, typography } from '@/theme';
import type { FloorOccupancySummaryDto, RoomOccupancySummaryDto } from '@m-square/contracts';

export default function BuildingDetailScreen(): React.JSX.Element {
  const { propertyId, buildingId } = useLocalSearchParams<{
    propertyId: string;
    buildingId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedFloorIds, setExpandedFloorIds] = useState<string[]>([]);

  const treeQuery = useQuery({
    queryKey: ['building-tree', buildingId],
    queryFn: () => getBuildingOccupancyTreeApi(buildingId ?? ''),
    enabled: !!buildingId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBuildingApi(buildingId ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['building-tree', buildingId] });
      router.back();
    },
  });

  const toggleFloorExpand = (floorId: string) => {
    setExpandedFloorIds((prev) =>
      prev.includes(floorId) ? prev.filter((id) => id !== floorId) : [...prev, floorId]
    );
  };

  if (treeQuery.isLoading) {
    return (
      <Screen>
        <Header title="Building Operational Dashboard" />
        <Loading message="Loading building occupancy & room hierarchy..." />
      </Screen>
    );
  }

  if (treeQuery.isError || !treeQuery.data) {
    return (
      <Screen>
        <Header title="Building Operational Dashboard" />
        <ErrorState
          message="Building occupancy tree not found or access denied."
          onRetry={() => treeQuery.refetch()}
        />
      </Screen>
    );
  }

  const tree = treeQuery.data;

  return (
    <Screen style={styles.screen}>
      <Header
        title={tree.buildingName}
        subtitle={`Code: ${tree.buildingCode} | Property: ${tree.propertyName}`}
      />
      <View style={styles.container}>
        {/* Actions Card */}
        <Card style={styles.actionsCard}>
          <View style={styles.actionRow}>
            <Button
              title="Edit Building"
              variant="outline"
              onPress={() =>
                router.push(
                  `/(owner)/properties/${propertyId}/buildings/${buildingId}/edit` as `/properties/${string}`
                )
              }
              style={styles.actionBtn}
            />
            <Button
              title="Delete"
              variant="danger"
              onPress={() => setShowDeleteModal(true)}
              style={styles.actionBtn}
            />
          </View>
        </Card>

        {/* Occupancy Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardSectionTitle}>🏢 Building Occupancy Metrics</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricBadge}>
              <Text style={styles.metricNumber}>{tree.totalFloors}</Text>
              <Text style={styles.metricLabel}>Floors</Text>
            </View>
            <View style={styles.metricBadge}>
              <Text style={styles.metricNumber}>{tree.totalRooms}</Text>
              <Text style={styles.metricLabel}>Rooms</Text>
            </View>
            <View style={styles.metricBadge}>
              <Text style={styles.metricNumber}>{tree.totalBeds}</Text>
              <Text style={styles.metricLabel}>Total Beds</Text>
            </View>
            <View style={styles.metricBadge}>
              <Text style={[styles.metricNumber, { color: colors.success }]}>
                {tree.occupiedBeds}
              </Text>
              <Text style={styles.metricLabel}>Occupied</Text>
            </View>
            <View style={styles.metricBadge}>
              <Text style={[styles.metricNumber, { color: colors.primary }]}>
                {tree.availableBeds}
              </Text>
              <Text style={styles.metricLabel}>Available</Text>
            </View>
          </View>

          {/* Occupancy Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressTitle}>Occupancy Rate</Text>
              <Text style={styles.progressValue}>{tree.occupancyPercentage}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(0, tree.occupancyPercentage))}%` },
                ]}
              />
            </View>
          </View>
        </Card>

        {/* Floors Header */}
        <View style={styles.floorsHeader}>
          <Text style={styles.sectionTitle}>Floors ({tree.floors.length})</Text>
          <Button
            title="+ Add Floor"
            variant="primary"
            onPress={() =>
              router.push(
                `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/create` as `/properties/${string}`
              )
            }
          />
        </View>

        {tree.floors.length === 0 ? (
          <EmptyState
            title="No Floors Found"
            description="Add your first floor to this building."
            actionLabel="+ Add Floor"
            onAction={() =>
              router.push(
                `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/create` as `/properties/${string}`
              )
            }
          />
        ) : (
          <FlatList
            data={tree.floors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FloorOccupancyCard
                floor={item}
                propertyId={propertyId ?? ''}
                buildingId={buildingId ?? ''}
                isExpanded={expandedFloorIds.includes(item.id)}
                onToggleExpand={() => toggleFloorExpand(item.id)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={treeQuery.isRefetching}
                onRefresh={() => treeQuery.refetch()}
              />
            }
          />
        )}
      </View>

      <DeleteBuildingModal
        visible={showDeleteModal}
        building={{ id: tree.buildingId, name: tree.buildingName, code: tree.buildingCode } as any}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={async () => {
          await deleteMutation.mutateAsync();
        }}
      />
    </Screen>
  );
}

function FloorOccupancyCard({
  floor,
  propertyId,
  buildingId,
  isExpanded,
  onToggleExpand,
}: {
  floor: FloorOccupancySummaryDto;
  propertyId: string;
  buildingId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const router = useRouter();

  return (
    <Card style={styles.floorCard}>
      <TouchableOpacity style={styles.floorHeaderRow} onPress={onToggleExpand}>
        <View style={styles.floorTitleGroup}>
          <Text style={styles.floorNameText}>🧱 {floor.name}</Text>
          <Text style={styles.floorMetaText}>
            Level {floor.floorNumber} • {floor.totalRooms} Rooms • {floor.totalBeds} Beds
          </Text>
        </View>
        <View style={styles.floorBadgeGroup}>
          <Text style={styles.floorOccupancyBadge}>{floor.occupancyPercentage}%</Text>
          <Text style={styles.expandToggleText}>{isExpanded ? '▲ Hide' : '▼ View Rooms'}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.floorStatSummary}>
        <Text style={styles.floorStatText}>
          Occupied: <Text style={{ fontWeight: 'bold', color: colors.success }}>{floor.occupiedBeds}</Text> |
          Available: <Text style={{ fontWeight: 'bold', color: colors.primary }}>{floor.availableBeds}</Text>
        </Text>
      </View>

      {/* Expanded Room List */}
      {isExpanded && (
        <View style={styles.roomListContainer}>
          <View style={styles.floorActionRow}>
            <Button
              title="+ Add Room"
              variant="primary"
              size="small"
              onPress={() =>
                router.push(
                  `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${floor.id}/rooms/create` as `/properties/${string}`
                )
              }
            />
            <Button
              title="Manage Floor →"
              variant="outline"
              size="small"
              onPress={() =>
                router.push(
                  `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${floor.id}` as `/properties/${string}`
                )
              }
            />
          </View>

          {floor.rooms.length === 0 ? (
            <View style={styles.emptyFloorBox}>
              <Text style={styles.mutedText}>No rooms configured on this floor yet.</Text>
            </View>
          ) : (
            floor.rooms.map((room) => (
              <RoomSummaryCard
                key={room.id}
                room={room}
                onManage={() =>
                  router.push(
                    `/(owner)/properties/${propertyId}/buildings/${buildingId}/floors/${floor.id}/rooms/${room.id}` as `/properties/${string}`
                  )
                }
              />
            ))
          )}
        </View>
      )}
    </Card>
  );
}

function RoomSummaryCard({
  room,
  onManage,
}: {
  room: RoomOccupancySummaryDto;
  onManage: () => void;
}) {
  return (
    <View style={styles.roomCardInner}>
      <View style={styles.roomCardHeader}>
        <View>
          <Text style={styles.roomTitleText}>Door {room.roomNumber}</Text>
          <Text style={styles.roomSubtitleText}>
            {room.roomType} • Capacity: {room.capacity}
          </Text>
        </View>
        <Button title="Manage Room →" variant="outline" onPress={onManage} style={styles.manageBtn} />
      </View>

      {/* Bed occupancy list */}
      <View style={styles.bedsGrid}>
        {room.beds.map((bed) => {
          const isOccupied = bed.status === 'OCCUPIED' || !!bed.activeResident;
          return (
            <View
              key={bed.id}
              style={[styles.bedTag, isOccupied ? styles.bedTagOccupied : styles.bedTagAvailable]}
            >
              <Text style={styles.bedTagIcon}>{isOccupied ? '🟢' : bed.status === 'MAINTENANCE' ? '🛠️' : '⚪'}</Text>
              <Text style={styles.bedTagLabel}>
                {bed.bedNumber} {bed.activeResident ? `— ${bed.activeResident.fullName}` : `(${bed.status})`}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Facility Tags */}
      {room.facilities.length > 0 && (
        <View style={styles.facilityTagsRow}>
          {room.facilities.map((fac) => (
            <View key={fac.id} style={styles.facilityTagItem}>
              <Text style={styles.facilityTagText}>✓ {fac.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
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
  actionsCard: {
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  summaryCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  metricBadge: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
  },
  progressSection: {
    marginTop: spacing.xs,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },
  progressValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.mutedBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  floorsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  floorCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  floorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floorTitleGroup: {
    flex: 1,
  },
  floorNameText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  floorMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  floorBadgeGroup: {
    alignItems: 'flex-end',
  },
  floorOccupancyBadge: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  expandToggleText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  floorStatSummary: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  floorStatText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },
  roomListContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  floorActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  emptyFloorBox: {
    paddingVertical: spacing.xs,
  },
  mutedText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    fontStyle: 'italic',
  },
  roomCardInner: {
    backgroundColor: colors.mutedBackground,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  roomTitleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  roomSubtitleText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
  },
  manageBtn: {
    paddingHorizontal: spacing.sm,
  },
  bedsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  bedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  bedTagOccupied: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.success,
  },
  bedTagAvailable: {
    backgroundColor: '#F3F4F6',
    borderColor: colors.border,
  },
  bedTagIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  bedTagLabel: {
    fontSize: 11,
    color: colors.text,
  },
  facilityTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  facilityTagItem: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  facilityTagText: {
    fontSize: 10,
    color: colors.muted,
  },
});
