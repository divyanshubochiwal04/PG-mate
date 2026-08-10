import React from 'react';
import { StyleSheet } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { spacing } from '../../src/theme/spacing';

export default function ResidentsScreen(): React.JSX.Element {
  return (
    <Screen style={styles.container}>
      <EmptyState
        title="Resident Management"
        description="Resident profiles, Emergency Contacts, Check-in & Bed Allocation coming in next milestone."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    justifyContent: 'center',
  },
});
