import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, radius, spacing, typography } from '../../design-system';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description?: string;
  actionTitle?: string;
  /** @deprecated Use `actionTitle` instead */
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-outline',
  title,
  description,
  actionTitle: actionTitleProp,
  actionLabel,
  onAction,
}) => {
  const actionTitle = actionTitleProp || actionLabel;
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      {Boolean(description) && <Text style={styles.description}>{description}</Text>}

      {Boolean(actionTitle && onAction) && (
        <View style={styles.actionWrap}>
          <Button title={actionTitle!} onPress={onAction!} size="small" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionWrap: {
    marginTop: spacing.xs,
  },
});
