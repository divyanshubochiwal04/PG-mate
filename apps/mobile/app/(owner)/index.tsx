import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { Screen } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function DashboardScreen(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <Screen style={styles.container}>
      <Card style={styles.welcomeCard}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user ? `${user.firstName} ${user.lastName}` : 'PG Owner'}</Text>
        <Text style={styles.role}>Role: {user?.role || 'PG_OWNER'}</Text>
      </Card>

      <Card style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Mobile Foundation Verified</Text>
        <Text style={styles.noticeText}>
          Authentication, secure storage, and API connectivity foundation established successfully.
        </Text>
        <Text style={styles.milestoneNotice}>
          Business feature modules (Properties, Rooms, Residents, Allocations) will be implemented in subsequent milestones.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  welcomeCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  greeting: {
    fontSize: typography.fontSize.sm,
    color: colors.primaryForeground,
    opacity: 0.8,
  },
  name: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryForeground,
    marginVertical: spacing.xs,
  },
  role: {
    fontSize: typography.fontSize.xs,
    color: colors.primaryForeground,
    opacity: 0.9,
  },
  noticeCard: {
    marginTop: spacing.md,
  },
  noticeTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  noticeText: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary,
    lineHeight: 20,
  },
  milestoneNotice: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
