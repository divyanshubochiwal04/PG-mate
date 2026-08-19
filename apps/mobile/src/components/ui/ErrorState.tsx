import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, radius, spacing, typography } from '../../design-system';

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  message?: string;
  onRetry?: () => void;
}

function getErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in (error as any)) {
    return String((error as any).message);
  }
  return 'Unable to process request. Please try again.';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Couldn't load data",
  error,
  message,
  onRetry,
}) => {
  const displayMsg = message || getErrorMessage(error);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{displayMsg}</Text>

      {Boolean(onRetry) && (
        <View style={styles.actionWrap}>
          <Button title="Try Again" onPress={onRetry!} variant="outline" size="small" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    margin: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionWrap: {
    marginTop: spacing.xs,
  },
});
