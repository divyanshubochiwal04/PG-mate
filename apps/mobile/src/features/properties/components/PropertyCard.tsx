import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PropertyDto } from '@m-square/contracts';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography } from '@/theme';

interface PropertyCardProps {
  property: PropertyDto;
  onPress: () => void;
  onEdit?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress, onEdit }) => {
  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name}>{property.name}</Text>
            <Text style={styles.code}>{property.code}</Text>
          </View>
          <View
            style={[
              styles.badge,
              property.status === 'ACTIVE' ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                property.status === 'ACTIVE' ? styles.activeText : styles.inactiveText,
              ]}
            >
              {property.status}
            </Text>
          </View>
        </View>

        <Text style={styles.address}>
          {property.address.addressLine1}, {property.address.locality}, {property.address.city},{' '}
          {property.address.state} - {property.address.postalCode}
        </Text>
      </TouchableOpacity>

      {onEdit && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.editButton} activeOpacity={0.7}>
            <Text style={styles.editButtonText}>Edit Details</Text>
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
    marginBottom: spacing.xs,
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
  code: {
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
  address: {
    fontSize: typography.fontSize.sm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    alignItems: 'flex-end',
  },
  editButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  editButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary,
    fontWeight: typography.fontWeight.medium,
  },
});
