import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { GlobalHeader } from '../../../src/components/common/GlobalHeader';
import { BackendGapCard } from '../../../src/components/ui/BackendGapCard';
import { useOrganization } from '../../../src/features/organization/hooks/useOrganization';
import { useAuth } from '../../../src/hooks/useAuth';
import { colors, spacing, typography } from '../../../src/theme';

export default function OrganizationScreen(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { data: org, isLoading, error, refetch } = useOrganization();

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Organization Profile" />

      <ScrollView contentContainerStyle={styles.content}>
        <BackendGapCard
          title="Organization Modification Restricted"
          description="The M4 backend API supports read-only organization profiles (GET /organizations/me). Direct profile edits, logo updates, and tax ID modifications are disabled."
          nextAction="Backend API Policy"
        />

        {isLoading ? (
          <Loading message="Fetching organization details..." />
        ) : error ? (
          <ErrorState message="Failed to load organization profile" onRetry={refetch} />
        ) : org ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>🏢 {org.name}</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Organization ID:</Text>
              <Text style={styles.value}>{org.id}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Slug Code:</Text>
              <Text style={styles.value}>{org.slug}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, styles.statusActive]}>{org.status}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Created At:</Text>
              <Text style={styles.value}>
                {new Date(org.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionSubTitle}>Owner Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Owner Account:</Text>
              <Text style={styles.value}>{user?.email || 'Authenticated Owner'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Auth Role:</Text>
              <Text style={styles.value}>{user?.role || 'OWNER'}</Text>
            </View>
          </Card>
        ) : null}

        <Button
          title="← Back to Settings"
          variant="outline"
          onPress={() => router.back()}
          style={styles.backBtn}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    fontWeight: '600',
  },
  value: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontWeight: '500',
  },
  statusActive: {
    color: colors.success,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionSubTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.muted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  backBtn: {
    marginTop: spacing.sm,
  },
});
