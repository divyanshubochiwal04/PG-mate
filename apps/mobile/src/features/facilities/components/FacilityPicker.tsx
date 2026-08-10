import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { FacilityDto } from '@m-square/contracts';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing, typography } from '@/theme';

interface FacilityPickerProps {
  facilities: FacilityDto[];
  assignedFacilityIds: string[];
  isLoading?: boolean;
  onAssign: (facilityId: string) => void;
  onUnassign: (facilityId: string) => void;
}

export const FacilityPicker: React.FC<FacilityPickerProps> = ({
  facilities,
  assignedFacilityIds,
  isLoading = false,
  onAssign,
  onUnassign,
}) => {
  if (isLoading) {
    return <Loading message="Loading facilities..." />;
  }

  if (facilities.length === 0) {
    return (
      <EmptyState
        title="No Catalog Facilities Available"
        description="Add facilities to catalog to assign them here."
      />
    );
  }

  const renderItem = ({ item }: { item: FacilityDto }) => {
    const isAssigned = assignedFacilityIds.includes(item.id);

    return (
      <Card style={styles.card}>
        <View style={styles.content}>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.category}>{item.category || 'GENERAL'}</Text>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          </View>
          <TouchableOpacity
            style={[styles.button, isAssigned ? styles.unassignButton : styles.assignButton]}
            onPress={() => (isAssigned ? onUnassign(item.id) : onAssign(item.id))}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, isAssigned ? styles.unassignText : styles.assignText]}>
              {isAssigned ? 'Remove' : 'Assign'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <FlatList
      data={facilities}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.xs,
  },
  card: {
    marginVertical: spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  category: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary,
    marginTop: 2,
  },
  description: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
  },
  assignButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unassignButton: {
    backgroundColor: 'transparent',
    borderColor: colors.danger,
  },
  buttonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  assignText: {
    color: colors.primaryForeground,
  },
  unassignText: {
    color: colors.danger,
  },
});
