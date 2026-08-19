import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MetricCard } from '../../../components/ui/MetricCard';
import { colors, spacing } from '../../../design-system';

interface InventorySummaryProps {
  totalBeds: number;
  occupiedCount: number;
  availableCount: number;
  maintenanceCount: number;
}

export const InventorySummaryCards: React.FC<InventorySummaryProps> = ({
  totalBeds,
  occupiedCount,
  availableCount,
  maintenanceCount,
}) => {
  return (
    <View style={styles.gridContainer}>
      <View style={styles.row}>
        <MetricCard label="Total Beds" value={totalBeds} color={colors.primary} style={styles.card} />
        <MetricCard label="Occupied" value={occupiedCount} color={colors.danger} style={styles.card} />
      </View>
      <View style={styles.row}>
        <MetricCard label="Available" value={availableCount} color={colors.success} style={styles.card} />
        <MetricCard label="Maintenance" value={maintenanceCount} color={colors.warning} style={styles.card} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  card: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
