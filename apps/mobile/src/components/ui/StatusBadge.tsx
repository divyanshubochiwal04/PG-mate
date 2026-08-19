import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../design-system';

export type StatusType =
  | 'ACTIVE'
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'PENDING'
  | 'WARNING'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'SUSPENDED'
  | 'DISABLED'
  | 'MAINTENANCE'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const normalized = (status || '').toUpperCase();

  let bg = colors.secondaryLight;
  let text = colors.secondary;

  switch (normalized) {
    case 'ACTIVE':
    case 'AVAILABLE':
    case 'COMPLETED':
    case 'IN_STOCK':
      bg = colors.successLight;
      text = colors.success;
      break;

    case 'OCCUPIED':
    case 'IN_PROGRESS':
      bg = colors.primaryLight;
      text = colors.primary;
      break;

    case 'PENDING':
    case 'WARNING':
    case 'LOW_STOCK':
    case 'PARTIALLY_PAID':
      bg = colors.warningLight;
      text = colors.warning;
      break;

    case 'OVERDUE':
    case 'CANCELLED':
    case 'OUT_OF_STOCK':
    case 'DANGER':
      bg = colors.dangerLight;
      text = colors.danger;
      break;

    case 'SUSPENDED':
    case 'DISABLED':
    case 'MAINTENANCE':
      bg = colors.secondaryLight;
      text = colors.secondary;
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: text + '40' }]}>
      <Text style={[styles.badgeText, { color: text }]}>{label || normalized}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
