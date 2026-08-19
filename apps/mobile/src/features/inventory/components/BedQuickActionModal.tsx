import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import type { BedDto, RoomDto } from '@m-square/contracts';
import { updateBedStatusApi } from '../../beds/api/beds.api';
import { colors, radius, shadows, spacing, typography } from '../../../design-system';

export interface SelectedBedData {
  bed: BedDto;
  room?: RoomDto | { id: string; roomNumber: string; capacity?: number; roomType?: string };
  buildingName?: string;
  floorName?: string;
  occupant?: {
    name: string;
    residentId: string;
    phone?: string;
  };
}

interface BedQuickActionModalProps {
  selectedBed: SelectedBedData | null;
  onClose: () => void;
  onStatusChanged?: () => void;
}

export const BedQuickActionModal: React.FC<BedQuickActionModalProps> = ({
  selectedBed,
  onClose,
  onStatusChanged,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!selectedBed) return null;

  const { bed, room, buildingName, floorName, occupant } = selectedBed;
  const isOccupied = Boolean(occupant) || bed.status === 'OCCUPIED';
  const isMaintenance = bed.status === 'MAINTENANCE';
  const isInactive = bed.status === 'INACTIVE';
  const isAvailable = !isOccupied && !isMaintenance && !isInactive;

  const handleUpdateStatus = async (newStatus: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE') => {
    try {
      setIsUpdating(true);
      await updateBedStatusApi(bed.id, newStatus);
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      await queryClient.invalidateQueries({ queryKey: ['beds'] });
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      if (onStatusChanged) onStatusChanged();
      onClose();
    } catch (err: any) {
      Alert.alert('Status Update Failed', err?.message || 'Could not update bed status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCallResident = () => {
    if (occupant?.phone) {
      Linking.openURL(`tel:${occupant.phone}`);
    } else {
      Alert.alert('No Phone Number', 'Contact number is not registered for this occupant.');
    }
  };

  const handleWhatsAppResident = () => {
    if (occupant?.phone) {
      const cleanPhone = occupant.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}`);
    } else {
      Alert.alert('No Phone Number', 'WhatsApp contact is not available.');
    }
  };

  const handleShareVacancy = async () => {
    const text = `🛏️ *Bed Available for Booking!*\n` +
      `🏢 Room: ${room?.roomNumber || 'N/A'}\n` +
      `📍 Location: ${buildingName ? `${buildingName} • ` : ''}${floorName || ''}\n` +
      `🛋️ Type: ${room?.roomType?.replace('_', ' ') || 'Hostel'} Sharing\n` +
      `✨ Status: Immediate Move-in Ready\n\n` +
      `Contact Property Management for details & bookings!`;

    try {
      await Share.share({ message: text });
    } catch {
      // Ignored
    }
  };

  return (
    <Modal
      visible={Boolean(selectedBed)}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.statusIconWrap,
                  isOccupied
                    ? styles.statusRed
                    : isMaintenance
                    ? styles.statusAmber
                    : isAvailable
                    ? styles.statusGreen
                    : styles.statusMuted,
                ]}
              >
                <Ionicons
                  name={
                    isOccupied
                      ? 'person'
                      : isMaintenance
                      ? 'construct'
                      : isAvailable
                      ? 'checkmark-circle'
                      : 'close-circle'
                  }
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View>
                <Text style={styles.bedTitle}>Bed {bed.bedNumber}</Text>
                <Text style={styles.locationSubtitle}>
                  Room {room?.roomNumber || 'N/A'}
                  {buildingName ? ` • ${buildingName}` : ''}
                  {floorName ? ` • ${floorName}` : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 3D Berth Graphic Card */}
          <View
            style={[
              styles.berthPreviewCard,
              isOccupied
                ? styles.previewRed
                : isMaintenance
                ? styles.previewAmber
                : isAvailable
                ? styles.previewGreen
                : styles.previewMuted,
            ]}
          >
            <View
              style={[
                styles.pillowIndicator,
                isOccupied
                  ? styles.bgRed
                  : isMaintenance
                  ? styles.bgAmber
                  : isAvailable
                  ? styles.bgGreen
                  : styles.bgMuted,
              ]}
            />
            <View style={styles.previewBody}>
              <View style={styles.previewTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="bed" size={18} color={isOccupied ? '#DC2626' : isMaintenance ? '#D97706' : '#059669'} />
                  <Text style={styles.previewBedNum}>Bed #{bed.bedNumber}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    isOccupied
                      ? styles.pillRed
                      : isMaintenance
                      ? styles.pillAmber
                      : isAvailable
                      ? styles.pillGreen
                      : styles.pillMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isOccupied
                        ? styles.textRed
                        : isMaintenance
                        ? styles.textAmber
                        : isAvailable
                        ? styles.textGreen
                        : styles.textMuted,
                    ]}
                  >
                    {isOccupied
                      ? 'OCCUPIED'
                      : isMaintenance
                      ? 'MAINTENANCE'
                      : isAvailable
                      ? 'VACANT / AVAILABLE'
                      : 'INACTIVE'}
                  </Text>
                </View>
              </View>

              {/* Occupant Detail Card if Occupied */}
              {isOccupied && occupant && (
                <View style={styles.occupantCard}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.occupantLabel}>CURRENT RESIDENT</Text>
                    <Text style={styles.occupantName}>{occupant.name}</Text>
                  </View>
                  <View style={styles.contactIcons}>
                    <TouchableOpacity style={styles.contactBtn} onPress={handleCallResident}>
                      <Ionicons name="call" size={16} color="#059669" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactBtn} onPress={handleWhatsAppResident}>
                      <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons Section */}
          <View style={styles.actionSection}>
            <Text style={styles.actionSectionTitle}>QUICK MANAGEMENT ACTIONS</Text>

            {isUpdating ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Updating Bed Status...</Text>
              </View>
            ) : (
              <View style={styles.actionList}>
                {/* 1. OCCUPIED BED ACTIONS */}
                {isOccupied && occupant && (
                  <>
                    <TouchableOpacity
                      style={styles.actionItem}
                      onPress={() => {
                        onClose();
                        router.push(`/(owner)/residents/${occupant.residentId}` as `/residents/${string}`);
                      }}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionItemTitle}>View Resident Profile</Text>
                        <Text style={styles.actionItemSub}>View ledger, bills, documents & emergency contacts</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionItem}
                      onPress={() => {
                        onClose();
                        router.push(`/(owner)/residents/transfer-${occupant.residentId}` as any);
                      }}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="swap-horizontal-outline" size={20} color="#2563EB" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionItemTitle}>Transfer to Another Bed / Room</Text>
                        <Text style={styles.actionItemSub}>Relocate resident seamlessly with audit history</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </>
                )}

                {/* 2. AVAILABLE (VACANT) BED ACTIONS */}
                {isAvailable && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionItem, styles.actionItemPrimary]}
                      onPress={() => {
                        onClose();
                        router.push(`/(owner)/residents/register` as any);
                      }}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: '#FFFFFF' }]}>
                        <Ionicons name="person-add" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.actionItemTitle, { color: '#FFFFFF' }]}>
                          Assign Resident (Instant Check-in)
                        </Text>
                        <Text style={[styles.actionItemSub, { color: '#DBEAFE' }]}>
                          Register new resident directly into this bed
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionItem}
                      onPress={() => handleUpdateStatus('MAINTENANCE')}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="construct-outline" size={20} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionItemTitle}>Mark Under Maintenance / Cleaning</Text>
                        <Text style={styles.actionItemSub}>Temporarily hold from booking for repairs</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={handleShareVacancy}>
                      <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                        <Ionicons name="share-social-outline" size={20} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionItemTitle}>Share Vacancy on WhatsApp</Text>
                        <Text style={styles.actionItemSub}>Broadcast availability to agents or groups</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </>
                )}

                {/* 3. MAINTENANCE BED ACTIONS */}
                {isMaintenance && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionItem, { backgroundColor: '#059669' }]}
                      onPress={() => handleUpdateStatus('AVAILABLE')}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: '#FFFFFF' }]}>
                        <Ionicons name="checkmark-done" size={20} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.actionItemTitle, { color: '#FFFFFF' }]}>
                          Mark Cleaned & Available
                        </Text>
                        <Text style={[styles.actionItemSub, { color: '#D1FAE5' }]}>
                          Release bed for fresh bookings & allocations
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </>
                )}

                {/* 4. GO TO ROOM DETAILS */}
                {room?.id && (
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => {
                      onClose();
                      router.push(`/(owner)/inventory/room/${room.id}` as `/inventory/room/${string}`);
                    }}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: colors.mutedBackground }]}>
                      <Ionicons name="business-outline" size={20} color={colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actionItemTitle}>Open Full Room #{room.roomNumber} Details</Text>
                      <Text style={styles.actionItemSub}>View all berths, amenities, and room settings</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    paddingBottom: 36,
    maxHeight: '92%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRed: { backgroundColor: '#EF4444' },
  statusAmber: { backgroundColor: '#F59E0B' },
  statusGreen: { backgroundColor: '#10B981' },
  statusMuted: { backgroundColor: '#94A3B8' },

  bedTitle: {
    ...typography.h3,
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  locationSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryLight,
  },

  berthPreviewCard: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  previewRed: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  previewAmber: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  previewGreen: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  previewMuted: { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },

  pillowIndicator: {
    height: 6,
    width: '100%',
  },
  bgRed: { backgroundColor: '#EF4444' },
  bgAmber: { backgroundColor: '#F59E0B' },
  bgGreen: { backgroundColor: '#10B981' },
  bgMuted: { backgroundColor: '#94A3B8' },

  previewBody: {
    padding: spacing.md,
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewBedNum: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pillRed: { backgroundColor: '#FEE2E2' },
  pillAmber: { backgroundColor: '#FEF3C7' },
  pillGreen: { backgroundColor: '#D1FAE5' },
  pillMuted: { backgroundColor: '#F1F5F9' },

  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textRed: { color: '#DC2626' },
  textAmber: { color: '#D97706' },
  textGreen: { color: '#059669' },
  textMuted: { color: '#64748B' },

  occupantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 6,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  occupantLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  occupantName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  contactIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  contactBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionSection: {
    marginTop: spacing.xs,
  },
  actionSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  actionList: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionItemPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionItemSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
