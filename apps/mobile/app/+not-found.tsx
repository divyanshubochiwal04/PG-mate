import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { colors, spacing, typography } from '../src/theme';

export default function NotFoundScreen(): React.JSX.Element {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: true }} />
      <View style={styles.container}>
        <Text style={styles.icon}>❓</Text>
        <Text style={styles.title}>Page Could Not Be Found</Text>
        <Text style={styles.subtitle}>
          The screen you are trying to access does not exist or has been moved.
        </Text>

        <Link href="/" replace asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Go to Home Screen</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.md,
  },
});
