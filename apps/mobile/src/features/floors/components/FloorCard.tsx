import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { FloorDto } from '@m-square/contracts';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography } from '@/theme';

interface FloorCardProps {
  floor: FloorDto;
  onPress: () => void;
}

export const FloorCard: React.FC<FloorCardProps> = ({ floor, onPress }) => {
  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name}>{floor.name}</Text>
            <Text style={styles.number}>Floor Number: {floor.floorNumber}</Text>
          </View>
          <View
            style={[
              styles.badge,
              floor.status === 'ACTIVE' ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                floor.status === 'ACTIVE' ? styles.activeText : styles.inactiveText,
              ]}
            >
              {floor.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  number: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
  },
  inactiveBadge: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  activeText: {
    color: colors.success,
  },
  inactiveText: {
    color: colors.muted,
  },
});
