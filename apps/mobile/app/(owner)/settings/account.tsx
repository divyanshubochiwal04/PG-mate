import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { GlobalHeader } from '../../../src/components/common/GlobalHeader';
import { useAuth } from '../../../src/hooks/useAuth';
import { useOrganization } from '../../../src/features/organization/hooks/useOrganization';
import { colors, spacing, typography } from '../../../src/theme';

export default function AccountSettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { data: org } = useOrganization();

  const handleLogout = async () => {
    queryClient.clear();
    await logout();
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Account & Security" />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>User Account Information</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Email Address:</Text>
            <Text style={styles.value}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{user?.role || 'OWNER'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Organization Context:</Text>
            <Text style={styles.value}>{org?.name || 'N/A'}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Session & Security</Text>
          <Text style={styles.subtext}>
            Logging out terminates your current authenticated session and clears cached business
            settings.
          </Text>

          <Button
            title="Logout from M Square"
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutBtn}
          />
        </Card>

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
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
  },
  value: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  subtext: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  logoutBtn: {
    borderColor: colors.danger,
  },
  backBtn: {
    marginTop: spacing.xs,
  },
});
