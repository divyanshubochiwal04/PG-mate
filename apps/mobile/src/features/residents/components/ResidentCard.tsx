import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ResidentDto, ResidentOperationalListItemDto } from '@m-square/contracts';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors, radius, spacing, typography } from '../../../design-system';

interface ResidentCardProps {
  item: ResidentOperationalListItemDto | ResidentDto;
  onTransfer?: (item: ResidentOperationalListItemDto) => void;
  onCheckOut?: (item: ResidentOperationalListItemDto) => void;
  onCheckIn?: (item: ResidentOperationalListItemDto) => void;
  onEdit?: (item: ResidentOperationalListItemDto) => void;
}

export const ResidentCard: React.FC<ResidentCardProps> = ({
  item,
  onTransfer,
  onCheckOut,
  onCheckIn,
  onEdit,
}) => {
  const router = useRouter();

  const isOpItem = 'residentId' in item;
  const residentId = isOpItem ? item.residentId : item.id;
  const fullName = isOpItem ? item.fullName : `${item.firstName} ${item.lastName}`;
  const code = item.residentCode;
  const phone = item.phone;

  const stayStatus = isOpItem ? item.stayStatus : item.currentLocation ? 'ACTIVE' : 'NO_STAY';
  const propertyName = isOpItem ? item.propertyName : item.currentLocation?.propertyName;
  const buildingName = isOpItem ? item.buildingName : item.currentLocation?.buildingName;
  const floorNumber = isOpItem ? item.floorNumber : item.currentLocation?.floorName;
  const roomNumber = isOpItem ? item.roomNumber : item.currentLocation?.roomNumber;
  const bedNumber = isOpItem ? item.bedNumber : item.currentLocation?.bedNumber;

  const admissionDate = isOpItem && item.admissionDate
    ? new Date(item.admissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  const messPlan = isOpItem ? item.messPlanName : null;
  const due = isOpItem ? item.outstandingBalance : 0;
  const opItem = isOpItem ? (item as ResidentOperationalListItemDto) : null;

  return (
    <Card style={styles.card}>
      {/* Header Row: Identity & Status */}
      <View style={styles.headerRow}>
        <View style={styles.identityGroup}>
          <Text style={styles.fullName} numberOfLines={1}>{fullName}</Text>
          <View style={styles.subIdentity}>
            <Text style={styles.residentCode}>{code}</Text>
            {Boolean(phone) && (
              <>
                <Text style={styles.dot}>•</Text>
                <Ionicons name="call-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.phoneText}>{phone}</Text>
              </>
            )}
          </View>
        </View>
        <StatusBadge
          status={stayStatus === 'COMPLETED' ? 'CANCELLED' : stayStatus || 'NO_STAY'}
          label={(stayStatus || 'NO_STAY').replace('_', ' ')}
        />
      </View>

      {/* Location Section */}
      <View style={styles.locationBox}>
        {stayStatus === 'ACTIVE' && propertyName ? (
          <View style={styles.locationDetails}>
            <View style={styles.locRow}>
              <Ionicons name="business-outline" size={14} color={colors.primary} />
              <Text style={styles.propertyName} numberOfLines={1}>{propertyName}</Text>
            </View>
            <View style={styles.locChipsRow}>
              <View style={styles.locChip}>
                <Text style={styles.locChipText}>{buildingName || 'Building'}</Text>
              </View>
              <View style={styles.locChip}>
                <Text style={styles.locChipText}>Floor {floorNumber ?? '-'}</Text>
              </View>
              <View style={styles.locChip}>
                <Text style={styles.locChipText}>Room {roomNumber}</Text>
              </View>
              <View style={[styles.locChip, styles.bedChip]}>
                <Ionicons name="bed-outline" size={12} color={colors.primaryDark} />
                <Text style={styles.bedChipText}>Bed {bedNumber}</Text>
              </View>
            </View>
            {admissionDate && (
              <Text style={styles.admissionText}>Admitted: {admissionDate}</Text>
            )}
          </View>
        ) : stayStatus === 'COMPLETED' ? (
          <View style={styles.locRow}>
            <Ionicons name="log-out-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.inactiveLocText}>Checked Out</Text>
          </View>
        ) : (
          <View style={styles.locRow}>
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
            <Text style={styles.inactiveLocText}>No Active Stay</Text>
          </View>
        )}
      </View>

      {/* Operational Indicators: Mess & Financial Dues */}
      <View style={styles.operationalRow}>
        <View style={styles.opMetric}>
          <Ionicons name="restaurant-outline" size={14} color={messPlan ? colors.primary : colors.textMuted} />
          <Text style={styles.opMetricText}>{messPlan || 'No Mess Plan'}</Text>
        </View>

        <View style={styles.opMetric}>
          <Ionicons
            name={due > 0 ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={14}
            color={due > 0 ? colors.danger : colors.success}
          />
          <Text style={[styles.opMetricText, due > 0 ? styles.dueText : styles.paidText]}>
            {due > 0 ? `₹${due.toLocaleString('en-IN')} Due` : 'Dues Cleared'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/(owner)/residents/${residentId}`)}
          accessibilityRole="button"
        >
          <Ionicons name="eye-outline" size={14} color={colors.primary} />
          <Text style={styles.actionBtnText}>View</Text>
        </TouchableOpacity>

        {stayStatus === 'ACTIVE' && opItem && onTransfer && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onTransfer(opItem)}
            accessibilityRole="button"
          >
            <Ionicons name="swap-horizontal-outline" size={14} color={colors.textPrimary} />
            <Text style={styles.actionBtnTextSecondary}>Transfer</Text>
          </TouchableOpacity>
        )}

        {stayStatus === 'ACTIVE' && opItem && onCheckOut && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={() => onCheckOut(opItem)}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={14} color={colors.danger} />
            <Text style={styles.dangerBtnText}>Check Out</Text>
          </TouchableOpacity>
        )}

        {stayStatus === 'NO_STAY' && opItem && onCheckIn && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={() => onCheckIn(opItem)}
            accessibilityRole="button"
          >
            <Ionicons name="log-in-outline" size={14} color={colors.surface} />
            <Text style={styles.primaryBtnText}>Check In</Text>
          </TouchableOpacity>
        )}

        {opItem && onEdit && (
          <TouchableOpacity
            style={styles.iconActionBtn}
            onPress={() => onEdit(opItem)}
            accessibilityRole="button"
            accessibilityLabel="Edit Resident"
          >
            <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  identityGroup: {
    flex: 1,
    marginRight: spacing.sm,
  },
  fullName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  residentCode: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  dot: {
    ...typography.caption,
    color: colors.textMuted,
  },
  phoneText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  locationBox: {
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  locationDetails: {
    gap: 4,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propertyName: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
  locChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  locChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bedChip: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bedChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  admissionText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  inactiveLocText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  operationalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  opMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  opMetricText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dueText: {
    color: colors.danger,
    fontWeight: '700',
  },
  paidText: {
    color: colors.success,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  actionBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  actionBtnTextSecondary: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dangerBtn: {
    backgroundColor: colors.dangerLight,
  },
  dangerBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.danger,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  primaryBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.surface,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
});
