import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PropertyDto } from '@m-square/contracts';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { colors, radius, spacing, typography } from '@/design-system';

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
          <StatusBadge status={property.status} label={property.status} />
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.address} numberOfLines={2}>
            {property.address.addressLine1}, {property.address.locality}, {property.address.city},{' '}
            {property.address.state} - {property.address.postalCode}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onPress} style={styles.primaryAction} activeOpacity={0.7}>
          <Ionicons name="business-outline" size={14} color={colors.primary} />
          <Text style={styles.primaryActionText}>View Buildings</Text>
        </TouchableOpacity>

        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    borderRadius: radius.md,
    borderColor: colors.border,
    padding: spacing.md,
  },
  content: {
    paddingBottom: spacing.xs,
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
    ...typography.h3,
    color: colors.textPrimary,
  },
  code: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  address: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  primaryActionText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  editButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
