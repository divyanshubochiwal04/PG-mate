import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors, radius, spacing, typography } from '../../../design-system';

export type DisplayBedState = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';

interface BedIndicatorProps {
  bedNumber?: string;
  state: DisplayBedState;
  occupantName?: string;
  onPress?: () => void;
  compact?: boolean;
  berthCardStyle?: boolean;
}

export const BedIndicator: React.FC<BedIndicatorProps> = ({
  bedNumber = '',
  state,
  occupantName,
  onPress,
  compact = false,
  berthCardStyle = false,
}) => {
  const isOccupied = state === 'OCCUPIED' || Boolean(occupantName);
  const isMaintenance = state === 'MAINTENANCE';
  const isAvailable = state === 'AVAILABLE' && !occupantName;

  const formatBedNumber = (num: string) => {
    if (!num) return '';
    return num.toLowerCase().startsWith('bed') ? num : `Bed ${num}`;
  };

  if (berthCardStyle) {
    return (
      <TouchableOpacity
        style={[
          styles.berthContainer,
          isOccupied
            ? styles.berthOccupied
            : isMaintenance
            ? styles.berthMaintenance
            : isAvailable
            ? styles.berthAvailable
            : styles.berthInactive,
        ]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.pillowBar,
            isOccupied
              ? styles.pillowRed
              : isMaintenance
              ? styles.pillowAmber
              : isAvailable
              ? styles.pillowGreen
              : styles.pillowMuted,
          ]}
        />
        <View style={styles.berthBody}>
          <View style={styles.berthHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons
                name="bed"
                size={13}
                color={isOccupied ? '#DC2626' : isMaintenance ? '#D97706' : '#059669'}
              />
              <Text style={styles.berthNumberText}>{formatBedNumber(bedNumber)}</Text>
            </View>
            <View
              style={[
                styles.badgeChip,
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
                  styles.badgeChipText,
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
          {isOccupied ? (
            <Text style={styles.occupantTextCard} numberOfLines={1}>
              👤 {occupantName || 'Assigned'}
            </Text>
          ) : isMaintenance ? (
            <Text style={styles.maintenanceTextCard}>Under Repair</Text>
          ) : (
            <Text style={styles.vacantTextCard}>🟢 Available</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactWrap}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
      >
        <StatusBadge
          status={state === 'INACTIVE' ? 'DISABLED' : state}
          label={formatBedNumber(bedNumber) || state}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.fullWrap}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
    >
      <StatusBadge
        status={state === 'INACTIVE' ? 'DISABLED' : state}
        label={formatBedNumber(bedNumber) ? `${formatBedNumber(bedNumber)} • ${state}` : state}
      />
      {Boolean(occupantName) && (
        <Text style={styles.occupantText} numberOfLines={1}>
          {occupantName}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  compactWrap: {
    marginRight: 4,
  },
  fullWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  occupantText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },

  // 3D Berth Styles
  berthContainer: {
    borderRadius: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    minWidth: 120,
  },
  berthOccupied: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  berthMaintenance: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  berthAvailable: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  berthInactive: { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },

  pillowBar: { height: 4, width: '100%' },
  pillowRed: { backgroundColor: '#EF4444' },
  pillowAmber: { backgroundColor: '#F59E0B' },
  pillowGreen: { backgroundColor: '#10B981' },
  pillowMuted: { backgroundColor: '#94A3B8' },

  berthBody: { padding: 8 },
  berthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  berthNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badgeChip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  chipRed: { backgroundColor: '#FEE2E2' },
  chipAmber: { backgroundColor: '#FEF3C7' },
  chipGreen: { backgroundColor: '#D1FAE5' },
  chipMuted: { backgroundColor: '#F1F5F9' },

  badgeChipText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  textRed: { color: '#DC2626' },
  textAmber: { color: '#D97706' },
  textGreen: { color: '#059669' },
  textMuted: { color: '#64748B' },

  occupantTextCard: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    marginTop: 2,
  },
  maintenanceTextCard: {
    fontSize: 10,
    color: '#B45309',
    fontStyle: 'italic',
    marginTop: 2,
  },
  vacantTextCard: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '600',
    marginTop: 2,
  },
});

