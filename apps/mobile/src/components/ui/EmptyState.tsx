import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
