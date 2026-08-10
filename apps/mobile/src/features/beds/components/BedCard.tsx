import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BedDto } from '@m-square/contracts';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography } from '@/theme';

interface BedCardProps {
  bed: BedDto;
  onToggleStatus?: (newStatus: 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE') => void;
}

export const BedCard: React.FC<BedCardProps> = ({ bed, onToggleStatus }) => {
  const getStatusBadgeStyle = () => {
    switch (bed.status) {
      case 'AVAILABLE':
        return { bg: '#DCFCE7', text: colors.success };
      case 'MAINTENANCE':
        return { bg: '#FEF3C7', text: '#D97706' };
      default:
        return { bg: '#F1F5F9', text: colors.muted };
    }
  };

  const statusStyle = getStatusBadgeStyle();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{bed.bedNumber}</Text>
          <Text style={styles.order}>Display Order: #{bed.displayOrder}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.badgeText, { color: statusStyle.text }]}>{bed.status}</Text>
        </View>
      </View>

      {onToggleStatus && (
        <View style={styles.actions}>
          {bed.status !== 'AVAILABLE' && (
            <TouchableOpacity
              onPress={() => onToggleStatus('AVAILABLE')}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionText, { color: colors.success }]}>Set Available</Text>
            </TouchableOpacity>
          )}
          {bed.status !== 'MAINTENANCE' && (
            <TouchableOpacity
              onPress={() => onToggleStatus('MAINTENANCE')}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionText, { color: '#D97706' }]}>Set Maintenance</Text>
            </TouchableOpacity>
          )}
          {bed.status !== 'INACTIVE' && (
            <TouchableOpacity
              onPress={() => onToggleStatus('INACTIVE')}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionText, { color: colors.muted }]}>Deactivate</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  order: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.sm,
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
