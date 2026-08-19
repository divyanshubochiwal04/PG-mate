import React, { useState } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BedDto, FacilityDto, RoomDto } from '@m-square/contracts';
import { BedQuickActionModal, SelectedBedData } from './BedQuickActionModal';
import { colors, radius, spacing, typography } from '../../../design-system';

export type DisplayBedState = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';

interface RoomOccupancyCardProps {
  room?: RoomDto;
  roomId?: string;
  roomNumber?: string;
  buildingName?: string;
  floorName?: string;
  capacity?: number;
  beds?: BedDto[];
  facilities?: FacilityDto[];
  occupantMap?: Record<string, string>;
  onPress?: () => void;
  onSelectBed?: (bed: BedDto, occupant?: string) => void;
}

export const RoomOccupancyCard: React.FC<RoomOccupancyCardProps> = ({
  room,
  roomId: propRoomId,
  roomNumber: propRoomNumber,
  buildingName,
  floorName,
  capacity: propCapacity,
  beds = [],
  facilities = [],
  occupantMap = {},
  onPress,
  onSelectBed,
}) => {
  const router = useRouter();
  const [selectedBedForAction, setSelectedBedForAction] = useState<SelectedBedData | null>(null);

  const roomId = room?.id || propRoomId || '';
  const roomNumber = room?.roomNumber || propRoomNumber || '';
  const capacity = room?.capacity ?? propCapacity ?? beds.length;

  const occupiedCount = beds.filter(
    (b) => Boolean(occupantMap[b.id]) || b.status === 'OCCUPIED'
  ).length;
  const isFull = occupiedCount >= capacity && capacity > 0;
  const isPartiallyOccupied = occupiedCount > 0 && !isFull;
  const isVacant = occupiedCount === 0;
  const vacantBedCount = Math.max(0, capacity - occupiedCount);

  const roomTypeLabel = room?.roomType
    ? room.roomType.replace('_', ' ') + ' SHARING'
    : `${capacity} BED SHARING`;

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else if (roomId) {
      router.push(`/(owner)/inventory/room/${roomId}`);
    }
  };

  const handleBedPress = (b: BedDto) => {
    const occupantName = occupantMap[b.id];
    if (onSelectBed) {
      onSelectBed(b, occupantName);
    } else {
      setSelectedBedForAction({
        bed: b,
        room: room || { id: roomId, roomNumber, capacity, roomType: roomTypeLabel },
        buildingName,
        floorName,
        occupant: occupantName
          ? {
              name: occupantName,
              residentId: '',
            }
          : undefined,
      });
    }
  };

  const handleShareRoomVacancy = async () => {
    const text = `🚪 *Hostel Room Vacancy Alert!*\n` +
      `🏢 Room #${roomNumber} (${buildingName ? `${buildingName} • ` : ''}${floorName || ''})\n` +
      `🛋️ Sharing: ${roomTypeLabel}\n` +
      `🟢 Available Beds: ${vacantBedCount} of ${capacity}\n` +
      `✨ Amenities: ${facilities.length > 0 ? facilities.map((f) => f.name).join(', ') : 'Standard Bedding'}\n\n` +
      `Bookings Open! Contact Management.`;
    try {
      await Share.share({ message: text });
    } catch {
      // Ignored
    }
  };

  // Helper for facility icon
  const getFacilityIcon = (name: string): any => {
    const lower = name.toLowerCase();
    if (lower.includes('ac') || lower.includes('air')) return 'snow-outline';
    if (lower.includes('wifi') || lower.includes('internet')) return 'wifi-outline';
    if (lower.includes('washroom') || lower.includes('bath') || lower.includes('toilet')) return 'water-outline';
    if (lower.includes('tv') || lower.includes('television')) return 'tv-outline';
    if (lower.includes('clean') || lower.includes('housekeep')) return 'sparkles-outline';
    if (lower.includes('balcony')) return 'sunny-outline';
    return 'checkmark-circle-outline';
  };

  const formatBedNumber = (num: string) => {
    if (!num) return 'Bed';
    return num.toLowerCase().startsWith('bed') ? num : `Bed ${num}`;
  };

  return (
    <View style={styles.card}>
      {/* 1. ROOM HEADER */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={handleCardPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <View style={styles.roomIdentity}>
          <View style={styles.doorIconBadge}>
            <Ionicons name="business-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.roomTitle}>Room {roomNumber}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{roomTypeLabel}</Text>
              </View>
            </View>
            {(Boolean(buildingName) || Boolean(floorName)) && (
              <Text style={styles.subTitle}>
                {buildingName ? `${buildingName}` : ''}
                {floorName ? ` • ${floorName}` : ''}
              </Text>
            )}
          </View>
        </View>

        {/* Occupancy Status Badge */}
        <View
          style={[
            styles.occupancyBadge,
            isFull
              ? styles.badgeFull
              : isPartiallyOccupied
                ? styles.badgePartial
                : styles.badgeVacant,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isFull
                ? styles.dotFull
                : isPartiallyOccupied
                  ? styles.dotPartial
                  : styles.dotVacant,
            ]}
          />
          <Text
            style={[
              styles.occupancyBadgeText,
              isFull
                ? styles.textFull
                : isPartiallyOccupied
                  ? styles.textPartial
                  : styles.textVacant,
            ]}
          >
            {isFull
              ? `FULL (${occupiedCount}/${capacity})`
              : isVacant
                ? `ALL VACANT (0/${capacity})`
                : `${occupiedCount}/${capacity} OCCUPIED`}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 2. AMENITIES & FACILITIES STRIP */}
      <View style={styles.amenitiesRow}>
        {facilities && facilities.length > 0 ? (
          facilities.map((fac) => (
            <View key={fac.id} style={styles.amenityChip}>
              <Ionicons
                name={getFacilityIcon(fac.name)}
                size={12}
                color={colors.primary}
                style={{ marginRight: 3 }}
              />
              <Text style={styles.amenityChipText}>{fac.name}</Text>
            </View>
          ))
        ) : (
          <View style={styles.amenityChip}>
            <Ionicons name="bed-outline" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
            <Text style={styles.amenityChipText}>Standard Bedding</Text>
          </View>
        )}
      </View>

      {/* 3. REDBUS-STYLE VISUAL BERTH / BED LAYOUT */}
      <View style={styles.busLayoutContainer}>
        <View style={styles.busLayoutHeader}>
          <Text style={styles.busLayoutTitle} numberOfLines={1}>
            BERTH ALLOCATION
          </Text>
          <TouchableOpacity onPress={handleCardPress} style={styles.manageLink}>
            <Text style={styles.manageLinkText}>Manage Room →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bedsGrid}>
          {beds.map((b) => {
            const occupant = occupantMap[b.id];
            const isOccupied = Boolean(occupant) || b.status === 'OCCUPIED';
            const isMaintenance = b.status === 'MAINTENANCE';
            const isInactive = b.status === 'INACTIVE';
            const isAvailable = !isOccupied && !isMaintenance && !isInactive;

            return (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.berthCard,
                  isOccupied
                    ? styles.berthOccupied
                    : isMaintenance
                      ? styles.berthMaintenance
                      : isInactive
                        ? styles.berthInactive
                        : styles.berthAvailable,
                ]}
                onPress={() => handleBedPress(b)}
                activeOpacity={0.7}
              >
                {/* RedBus Pillow/Headrest Frame */}
                <View
                  style={[
                    styles.pillowBar,
                    isOccupied
                      ? styles.pillowOccupied
                      : isMaintenance
                        ? styles.pillowMaintenance
                        : isAvailable
                          ? styles.pillowAvailable
                          : styles.pillowInactive,
                  ]}
                />

                <View style={styles.berthContent}>
                  <View style={styles.berthTopRow}>
                    <View style={styles.bedNumberWrap}>
                      <Ionicons
                        name="bed"
                        size={14}
                        color={
                          isOccupied
                            ? '#DC2626'
                            : isMaintenance
                              ? '#D97706'
                              : '#059669'
                        }
                      />
                      <Text
                        style={[
                          styles.berthNumber,
                          isOccupied && styles.textRed,
                          isMaintenance && styles.textAmber,
                          isAvailable && styles.textGreen,
                        ]}
                      >
                        {formatBedNumber(b.bedNumber)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.berthPill,
                        isOccupied && styles.pillOccupied,
                        isMaintenance && styles.pillMaintenance,
                        isAvailable && styles.pillAvailable,
                      ]}
                    >
                      <Text
                        style={[
                          styles.berthPillText,
                          isOccupied && styles.textRed,
                          isMaintenance && styles.textAmber,
                          isAvailable && styles.textGreen,
                        ]}
                      >
                        {isOccupied ? 'Occupied' : isMaintenance ? 'Maint.' : 'Vacant'}
                      </Text>
                    </View>
                  </View>

                  {/* Resident Info or Vacant status */}
                  <View style={styles.occupantRow}>
                    {isOccupied ? (
                      <>
                        <Ionicons name="person-circle" size={14} color="#DC2626" />
                        <Text style={styles.occupantName} numberOfLines={1}>
                          {occupant || 'Assigned'}
                        </Text>
                      </>
                    ) : isMaintenance ? (
                      <Text style={styles.vacantHint}>Under Repair</Text>
                    ) : (
                      <>
                        <Ionicons name="add-circle" size={13} color="#059669" />
                        <Text style={styles.availableHint}>Tap to Assign</Text>
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Quick Room Actions Row */}
        <View style={styles.roomFooterActions}>
          {vacantBedCount > 0 && (
            <TouchableOpacity
              style={styles.quickAssignBtn}
              onPress={() => router.push('/(owner)/residents/register' as any)}
            >
              <Ionicons name="person-add" size={13} color="#FFFFFF" />
              <Text style={styles.quickAssignText}>+ Book Bed ({vacantBedCount} Vacant)</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.quickShareBtn}
            onPress={handleShareRoomVacancy}
          >
            <Ionicons name="logo-whatsapp" size={13} color="#059669" />
            <Text style={styles.quickShareText}>Share Room</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bed Quick Action Modal */}
      <BedQuickActionModal
        selectedBed={selectedBedForAction}
        onClose={() => setSelectedBedForAction(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  roomIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
  },
  doorIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  roomTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  typeBadge: {
    backgroundColor: colors.mutedBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  subTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  occupancyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeFull: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  badgePartial: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  badgeVacant: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotFull: { backgroundColor: '#DC2626' },
  dotPartial: { backgroundColor: '#D97706' },
  dotVacant: { backgroundColor: '#059669' },
  occupancyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textFull: { color: '#DC2626' },
  textPartial: { color: '#B45309' },
  textVacant: { color: '#047857' },

  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark + '20',
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mutedBackground,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amenityChipText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  busLayoutContainer: {
    marginTop: spacing.xs,
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  busLayoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  busLayoutTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  manageLink: {
    paddingVertical: 2,
  },
  manageLinkText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },

  bedsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  berthCard: {
    flex: 1,
    minWidth: 135,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  berthOccupied: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  berthAvailable: {
    borderColor: '#34D399',
    backgroundColor: '#F0FDF4',
  },
  berthMaintenance: {
    borderColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
  },
  berthInactive: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },

  pillowBar: {
    height: 4,
    width: '100%',
  },
  pillowOccupied: { backgroundColor: '#EF4444' },
  pillowAvailable: { backgroundColor: '#10B981' },
  pillowMaintenance: { backgroundColor: '#F59E0B' },
  pillowInactive: { backgroundColor: '#94A3B8' },

  berthContent: {
    padding: spacing.xs + 2,
  },
  berthTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bedNumberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  berthNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  berthPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pillOccupied: { backgroundColor: '#FEE2E2' },
  pillAvailable: { backgroundColor: '#D1FAE5' },
  pillMaintenance: { backgroundColor: '#FEF3C7' },
  berthPillText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textRed: { color: '#DC2626' },
  textGreen: { color: '#059669' },
  textAmber: { color: '#D97706' },

  occupantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  occupantName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  availableHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  vacantHint: {
    fontSize: 10,
    fontWeight: '500',
    color: '#B45309',
    fontStyle: 'italic',
  },

  roomFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quickAssignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  quickAssignText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  quickShareText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});
