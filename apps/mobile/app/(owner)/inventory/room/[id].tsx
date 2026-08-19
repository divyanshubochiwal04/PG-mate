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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../../src/components/ui/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { StatusBadge } from '../../../../src/components/ui/StatusBadge';
import { MetricCard } from '../../../../src/components/ui/MetricCard';
import { ErrorState } from '../../../../src/components/ui/ErrorState';
import { SkeletonLoader } from '../../../../src/components/ui/SkeletonLoader';
import { getRoomByIdApi } from '../../../../src/features/rooms/api/rooms.api';
import { getBedsApi } from '../../../../src/features/beds/api/beds.api';
import { getResidentsApi } from '../../../../src/features/residents/api/residents.api';
import { getRoomFacilitiesApi } from '../../../../src/features/facilities/api/facilities.api';
import { BedQuickActionModal, SelectedBedData } from '../../../../src/features/inventory/components/BedQuickActionModal';
import { colors, radius, spacing, typography } from '../../../../src/design-system';

export default function RoomDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedBedForAction, setSelectedBedForAction] = useState<SelectedBedData | null>(null);

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

  const { data: bedsData, isLoading: isLoadingBeds, refetch: refetchBeds } = useQuery({
    queryKey: ['beds', 'room', id],
    queryFn: () => (isValidId ? getBedsApi(id) : null),
    enabled: isValidId,
  });

  const { data: facilitiesData } = useQuery({
    queryKey: ['facilities', 'room', id],
    queryFn: () => (isValidId ? getRoomFacilitiesApi(id) : []),
    enabled: isValidId,
  });

  const { data: resData } = useQuery({
    queryKey: ['residents', 'occupants'],
    queryFn: () => getResidentsApi({ status: 'ACTIVE', page: 1, pageSize: 100 }),
  });

  const occupantMap: Record<string, { name: string; residentId: string; phone?: string }> = {};
  (resData?.items || []).forEach((r) => {
    if (r.currentLocation?.bedId) {
      occupantMap[r.currentLocation.bedId] = {
        name: `${r.firstName} ${r.lastName}`,
        residentId: r.id,
        phone: r.phone,
      };
    }
  });

  const beds = bedsData?.items || [];
  const facilities = facilitiesData || [];
  const isLoading = isLoadingRoom || isLoadingBeds;

  const occupiedCount = beds.filter((b) => occupantMap[b.id] || b.status === 'OCCUPIED').length;
  const availableCount = beds.filter((b) => b.status === 'AVAILABLE' && !occupantMap[b.id]).length;
  const maintenanceCount = beds.filter((b) => b.status === 'MAINTENANCE').length;

  const handleShareVacancy = async () => {
    if (!room) return;
    const text = `🚪 *Room #${room.roomNumber} Booking Details*\n` +
      `🛋️ Sharing: ${room.roomType?.replace('_', ' ')} Bed Sharing\n` +
      `🟢 Vacant Beds: ${availableCount} of ${room.capacity}\n` +
      `✨ Amenities: ${facilities.length > 0 ? facilities.map((f) => f.name).join(', ') : 'Standard Bedding'}\n\n` +
      `Instant Check-in available! Contact Management.`;
    try {
      await Share.share({ message: text });
    } catch {
      // Ignored
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refetch(); refetchBeds(); }} />}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={styles.backBtnText}>Back to Inventory</Text>
        </TouchableOpacity>

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={typography.h2}>Room {room.roomNumber}</Text>
                  <View style={styles.roomTypeBadge}>
                    <Text style={styles.roomTypeBadgeText}>
                      {room.roomType.replace('_', ' ')} SHARING
                    </Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>Capacity: {room.capacity} Bed(s)</Text>
              </View>
              <StatusBadge status={room.status} label={room.status} />
            </View>

            {/* Metrics */}
            <View style={styles.metricsRow}>
              <MetricCard label="Capacity" value={room.capacity} color={colors.primary} />
              <MetricCard label="Occupied" value={occupiedCount} color={colors.danger} />
              <MetricCard label="Available" value={availableCount} color={colors.success} />
              <MetricCard label="Maintenance" value={maintenanceCount} color={colors.warning} />
            </View>

            {/* WhatsApp Vacancy Broadcast Banner */}
            {availableCount > 0 && (
              <View style={styles.broadcastBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.broadcastBannerTitle}>📢 {availableCount} Vacant Bed(s) in Room {room.roomNumber}</Text>
                  <Text style={styles.broadcastBannerSub}>Ready for instant resident assignment</Text>
                </View>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShareVacancy}>
                  <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Room Amenities / Facilities */}
            {facilities.length > 0 && (
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>ROOM AMENITIES & FACILITIES</Text>
                <View style={styles.facilitiesGrid}>
                  {facilities.map((fac) => (
                    <View key={fac.id} style={styles.facilityChip}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                      <Text style={styles.facilityText}>{fac.name}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* 3D Visual Berths Grid */}
            <Card style={styles.bedsCard}>
              <View style={styles.bedsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="bed-outline" size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>BED LAYOUT & BERTHS (TAP TO MANAGE)</Text>
                </View>
                {availableCount > 0 && (
                  <TouchableOpacity
                    style={styles.headerAssignBtn}
                    onPress={() => router.push('/(owner)/residents/register' as any)}
                  >
                    <Ionicons name="person-add" size={12} color="#FFFFFF" />
                    <Text style={styles.headerAssignBtnText}>+ Assign</Text>
                  </TouchableOpacity>
                )}
              </View>

              {beds.length === 0 ? (
                <Text style={styles.noBedsText}>No beds configured in this room.</Text>
              ) : (
                <View style={styles.berthsGrid}>
                  {beds.map((bed) => {
                    const occupant = occupantMap[bed.id];
                    const isOccupied = Boolean(occupant) || bed.status === 'OCCUPIED';
                    const isMaintenance = bed.status === 'MAINTENANCE';
                    const isInactive = bed.status === 'INACTIVE';
                    const isAvailable = !isOccupied && !isMaintenance && !isInactive;

                    return (
                      <TouchableOpacity
                        key={bed.id}
                        style={[
                          styles.berthBox,
                          isOccupied
                            ? styles.berthBoxOccupied
                            : isMaintenance
                            ? styles.berthBoxMaintenance
                            : isAvailable
                            ? styles.berthBoxAvailable
                            : styles.berthBoxInactive,
                        ]}
                        onPress={() =>
                          setSelectedBedForAction({
                            bed,
                            room,
                            occupant: occupant ? { name: occupant.name, residentId: occupant.residentId, phone: occupant.phone } : undefined,
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.berthPillow,
                            isOccupied
                              ? styles.pillowRed
                              : isMaintenance
                              ? styles.pillowAmber
                              : isAvailable
                              ? styles.pillowGreen
                              : styles.pillowMuted,
                          ]}
                        />
                        <View style={styles.berthBoxBody}>
                          <View style={styles.berthBoxTop}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Ionicons
                                name="bed"
                                size={16}
                                color={isOccupied ? '#DC2626' : isMaintenance ? '#D97706' : '#059669'}
                              />
                              <Text style={styles.berthBoxNum}>Bed {bed.bedNumber}</Text>
                            </View>
                            <View
                              style={[
                                styles.berthStatusChip,
                                isOccupied
                                  ? styles.chipRed
                                  : isMaintenance
                                  ? styles.chipAmber
                                  : isAvailable
                                  ? styles.chipGreen
                                  : styles.chipMuted,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.berthStatusChipText,
                                  isOccupied
                                    ? styles.textRed
                                    : isMaintenance
                                    ? styles.textAmber
                                    : isAvailable
                                    ? styles.textGreen
                                    : styles.textMuted,
                                ]}
                              >
                                {isOccupied ? 'Occupied' : isMaintenance ? 'Repair' : 'Vacant'}
                              </Text>
                            </View>
                          </View>

                          {isOccupied && occupant ? (
                            <View style={styles.occupantPill}>
                              <Ionicons name="person" size={13} color="#991B1B" />
                              <Text style={styles.occupantPillName} numberOfLines={1}>
                                {occupant.name}
                              </Text>
                            </View>
                          ) : isMaintenance ? (
                            <Text style={styles.maintenanceHint}>🔧 Under Maintenance</Text>
                          ) : (
                            <View style={styles.assignHint}>
                              <Ionicons name="add-circle" size={14} color="#059669" />
                              <Text style={styles.assignHintText}>Tap to Assign / Manage</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Bed Quick Action Modal */}
        <BedQuickActionModal
          selectedBed={selectedBedForAction}
          onClose={() => setSelectedBedForAction(null)}
          onStatusChanged={() => {
            refetch();
            refetchBeds();
          }}
        />
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
    color: colors.textPrimary,
    fontWeight: '600',
  },
  loadingWrap: { gap: spacing.md, marginVertical: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  roomTypeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  roomTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },

  broadcastBanner: {
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
  broadcastBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  broadcastBannerSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  sectionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.mutedBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  facilityText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  bedsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bedsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  headerAssignBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noBedsText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    padding: spacing.xs,
  },

  berthsGrid: {
    gap: spacing.sm,
  },
  berthBox: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  berthBoxOccupied: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  berthBoxMaintenance: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  berthBoxAvailable: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  berthBoxInactive: { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },

  berthPillow: { height: 5, width: '100%' },
  pillowRed: { backgroundColor: '#EF4444' },
  pillowAmber: { backgroundColor: '#F59E0B' },
  pillowGreen: { backgroundColor: '#10B981' },
  pillowMuted: { backgroundColor: '#94A3B8' },

  berthBoxBody: { padding: spacing.sm },
  berthBoxTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  berthBoxNum: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  berthStatusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chipRed: { backgroundColor: '#FEE2E2' },
  chipAmber: { backgroundColor: '#FEF3C7' },
  chipGreen: { backgroundColor: '#D1FAE5' },
  chipMuted: { backgroundColor: '#F1F5F9' },

  berthStatusChipText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  textRed: { color: '#DC2626' },
  textAmber: { color: '#D97706' },
  textGreen: { color: '#059669' },
  textMuted: { color: '#64748B' },

  occupantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  occupantPillName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  maintenanceHint: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 2,
  },
  assignHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  assignHintText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
});
