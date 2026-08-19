import React from 'react';
import {
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
import { Screen } from '../../../src/components/ui/Screen';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { MetricCard } from '../../../src/components/ui/MetricCard';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { getRoomByIdApi } from '../../../src/features/rooms/api/rooms.api';
import { getBedsApi } from '../../../src/features/beds/api/beds.api';
import { getResidentsApi } from '../../../src/features/residents/api/residents.api';
import { BedIndicator } from '../../../src/features/inventory/components/BedIndicator';
import type { DisplayBedState } from '../../../src/features/inventory/components/BedIndicator';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function RoomDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isValidId = Boolean(id && id !== 'index' && id !== 'undefined');

  const {
    data: room,
    isLoading: isLoadingRoom,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rooms', 'detail', id],
    queryFn: () => (isValidId ? getRoomByIdApi(id) : null),
    enabled: isValidId,
  });

  const { data: bedsData, isLoading: isLoadingBeds } = useQuery({
    queryKey: ['beds', 'room', id],
    queryFn: () => (isValidId ? getBedsApi(id) : null),
    enabled: isValidId,
  });

  const { data: resData } = useQuery({
    queryKey: ['residents', 'occupants'],
    queryFn: () => getResidentsApi({ status: 'ACTIVE', page: 1, pageSize: 100 }),
  });

  const occupantMap: Record<string, { name: string; residentId: string }> = {};
  (resData?.items || []).forEach((r) => {
    if (r.currentLocation?.bedId) {
      occupantMap[r.currentLocation.bedId] = {
        name: `${r.firstName} ${r.lastName}`,
        residentId: r.id,
      };
    }
  });

  const beds = bedsData?.items || [];
  const isLoading = isLoadingRoom || isLoadingBeds;

  const occupiedCount = beds.filter((b) => occupantMap[b.id]).length;
  const availableCount = beds.filter((b) => b.status === 'AVAILABLE' && !occupantMap[b.id]).length;

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={80} style={{ marginBottom: spacing.md }} />
            <SkeletonLoader height={100} style={{ marginBottom: spacing.md }} />
            <SkeletonLoader height={160} style={{ marginBottom: spacing.md }} />
          </View>
        ) : isError || !room ? (
          <ErrorState
            title="Failed to load room details"
            error={error}
            onRetry={refetch}
          />
        ) : (
          <View>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={typography.h2}>Room {room.roomNumber}</Text>
                <Text style={styles.subtitle}>Type: {room.roomType}</Text>
              </View>
              <StatusBadge status={room.status} label={room.status} />
            </View>

            <View style={styles.metricsRow}>
              <MetricCard label="Capacity" value={room.capacity} color={colors.primary} />
              <MetricCard label="Occupied" value={occupiedCount} color={colors.danger} />
              <MetricCard label="Available" value={availableCount} color={colors.success} />
            </View>

            <Card style={styles.bedsCard}>
              <View style={styles.bedsHeader}>
                <Ionicons name="bed-outline" size={16} color={colors.primary} />
                <Text style={styles.sectionTitle}>BED OCCUPANCY & RESIDENTS</Text>
              </View>

              {beds.length === 0 ? (
                <Text style={styles.noBedsText}>No beds configured in this room.</Text>
              ) : (
                beds.map((bed) => {
                  const occupant = occupantMap[bed.id];
                  const displayState: DisplayBedState = occupant
                    ? 'OCCUPIED'
                    : bed.status === 'MAINTENANCE'
                    ? 'MAINTENANCE'
                    : bed.status === 'AVAILABLE'
                    ? 'AVAILABLE'
                    : 'INACTIVE';

                  return (
                    <View key={bed.id} style={styles.bedItem}>
                      <View style={styles.bedLeft}>
                        <BedIndicator bedNumber={String(bed.bedNumber)} state={displayState} />
                        <View>
                          <Text style={styles.bedNumber}>Bed {bed.bedNumber}</Text>
                          {occupant ? (
                            <TouchableOpacity
                              onPress={() =>
                                router.push(
                                  `/(owner)/residents/${occupant.residentId}` as `/residents/${string}`
                                )
                              }
                            >
                              <Text style={styles.occupantName}>{occupant.name}</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.bedStatusText}>
                              {displayState === 'AVAILABLE'
                                ? 'Vacant'
                                : displayState === 'MAINTENANCE'
                                ? 'Under Maintenance'
                                : 'Inactive'}
                            </Text>
                          )}
                        </View>
                      </View>

                      {displayState === 'AVAILABLE' && (
                        <Button
                          title="Assign"
                          size="small"
                          variant="outline"
                          onPress={() => router.push('/(owner)/residents/register')}
                        />
                      )}
                    </View>
                  );
                })
              )}
            </Card>
          </View>
        )}

        <Button
          title="Back to Room Map"
          variant="outline"
          icon={<Ionicons name="arrow-back-outline" size={16} color={colors.primary} />}
          onPress={() => router.back()}
          style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
        />
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
  },
  loadingWrap: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  bedsCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  bedsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  noBedsText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  bedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bedNumber: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
  occupantName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  bedStatusText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
});
