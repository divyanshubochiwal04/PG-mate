import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors, radius, spacing, typography } from '../../../design-system';

export const BedStatusLegend: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BED OCCUPANCY STATUS</Text>
      <View style={styles.legendRow}>
        <StatusBadge status="AVAILABLE" label="Available" />
        <StatusBadge status="OCCUPIED" label="Occupied" />
        <StatusBadge status="MAINTENANCE" label="Maintenance" />
        <StatusBadge status="DISABLED" label="Inactive" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
