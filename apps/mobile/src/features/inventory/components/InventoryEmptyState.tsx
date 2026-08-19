import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors, spacing, typography } from '../../../theme';

import { Button } from '../../../components/ui/Button';

interface InventoryEmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const InventoryEmptyState: React.FC<InventoryEmptyStateProps> = ({
  title = 'No Inventory Records Found',
  message = 'No rooms or beds match your selected property, block, or status filters.',
  icon = '🚪',
  actionLabel,
  onAction,
}) => {
  return (
    <Card style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: spacing.md }} />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  icon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
