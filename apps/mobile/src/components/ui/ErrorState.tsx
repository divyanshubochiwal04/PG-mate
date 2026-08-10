import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography } from '../../theme';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button title="Try Again" onPress={onRetry} variant="outline" style={styles.button} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.danger,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  button: {
    minWidth: 140,
  },
});
