import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { Screen } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function SettingsScreen(): React.JSX.Element {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <Card style={styles.profileCard}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Role:</Text>
          <Text style={styles.value}>{user?.role || 'PG_OWNER'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tenant ID:</Text>
          <Text style={styles.value}>{user?.organizationId || 'N/A'}</Text>
        </View>
      </Card>

      <Button
        title="Sign Out"
        onPress={() => void handleLogout()}
        variant="danger"
        isLoading={isLoggingOut}
        style={styles.logoutButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  profileCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.mutedBackground,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.muted,
  },
  value: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
});
