import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RoomDto } from '@m-square/contracts';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography } from '@/theme';

interface RoomCardProps {
  room: RoomDto;
  onPress: () => void;
  onUpdateCapacity?: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onPress, onUpdateCapacity }) => {
  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.number}>Room {room.roomNumber}</Text>
            <Text style={styles.type}>{room.roomType}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{room.status}</Text>
          </View>
        </View>

        <Text style={styles.capacity}>Bed Capacity: {room.capacity}</Text>
      </TouchableOpacity>

      {onUpdateCapacity && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={onUpdateCapacity} style={styles.actionButton} activeOpacity={0.7}>
            <Text style={styles.actionText}>Change Capacity</Text>
          </TouchableOpacity>
        </View>
      )}
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
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  number: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  type: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  capacity: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary,
    fontWeight: typography.fontWeight.medium,
  },
});
