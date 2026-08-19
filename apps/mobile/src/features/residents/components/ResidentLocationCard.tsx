import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CurrentLocationDto } from '@m-square/contracts';
import { Card } from '../../../components/ui/Card';
import { colors, spacing, typography } from '../../../theme';

interface ResidentLocationCardProps {
  location?: CurrentLocationDto | null;
}

export const ResidentLocationCard: React.FC<ResidentLocationCardProps> = ({ location }) => {
  const router = useRouter();

  if (!location) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>CURRENT LOCATION</Text>
        <Text style={styles.emptyText}>⚪ Resident currently has no active stay allocation.</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>CURRENT LOCATION</Text>
        <TouchableOpacity
          onPress={() => router.push(`/(owner)/inventory/room/${location.roomId}`)}
          accessibilityRole="button"
          accessibilityLabel={`View room ${location.roomNumber} details`}
        >
          <Text style={styles.viewRoomText}>View Room →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <View style={styles.col}>
          <Text style={styles.label}>Property</Text>
          <Text style={styles.value}>{location.propertyName}</Text>
        </View>

        <View style={styles.col}>
          <Text style={styles.label}>Block / Building</Text>
          <Text style={styles.value}>{location.buildingName}</Text>
        </View>

        <View style={styles.col}>
          <Text style={styles.label}>Floor</Text>
          <Text style={styles.value}>{location.floorName}</Text>
        </View>

        <View style={styles.col}>
          <Text style={styles.label}>Room</Text>
          <Text style={styles.value}>{location.roomNumber}</Text>
        </View>

        <View style={styles.col}>
          <Text style={styles.label}>Bed</Text>
          <Text style={[styles.value, { color: colors.primary, fontWeight: 'bold' }]}>
            Bed {location.bedNumber}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.muted,
  },
  viewRoomText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  col: {
    width: '45%',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs - 1,
    color: colors.muted,
  },
  value: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginTop: 2,
  },
  emptyText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
