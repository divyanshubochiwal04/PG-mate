import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { GlobalHeader } from '../../../src/components/common/GlobalHeader';
import {
  useBillingConfig,
  useUpdateBillingConfig,
} from '../../../src/features/billing/hooks/useBilling';
import { getErrorMessage } from '../../../src/api/error';
import { colors, spacing, typography } from '../../../src/theme';

export default function BillingConfigScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: config, isLoading } = useBillingConfig();
  const updateConfigMutation = useUpdateBillingConfig();

  const [cycleType, setCycleType] = useState<'CALENDAR' | 'JOINING_DATE'>('JOINING_DATE');
  const [gracePeriod, setGracePeriod] = useState(5);
  const [lateFee, setLateFee] = useState(100);

  useEffect(() => {
    if (config) {
      setCycleType(config.defaultBillingCycle === 'FIRST_OF_MONTH' ? 'CALENDAR' : 'JOINING_DATE');
      setGracePeriod(config.gracePeriodDays);
      setLateFee(config.lateFeePerDay);
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateConfigMutation.mutateAsync({
        defaultBillingCycle: cycleType === 'CALENDAR' ? 'FIRST_OF_MONTH' : 'JOINING_DATE',
        gracePeriodDays: gracePeriod,
        lateFeePerDay: lateFee,
      });
      Alert.alert('Configuration Saved', 'Billing parameters updated successfully.');
    } catch (err: unknown) {
      Alert.alert('Save Failed', getErrorMessage(err, 'Failed to save billing configuration.'));
    }
  };

  if (isLoading) {
    return <Loading message="Loading billing settings..." />;
  }

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Billing & Deposit Configuration" />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Rent Billing Cycle</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[styles.segment, cycleType === 'CALENDAR' && styles.segmentActive]}
              onPress={() => setCycleType('CALENDAR')}
              accessibilityRole="button"
              accessibilityLabel="1st of Month Billing Cycle"
            >
              <Text
                style={[styles.segmentText, cycleType === 'CALENDAR' && styles.segmentTextActive]}
              >
                1st of Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, cycleType === 'JOINING_DATE' && styles.segmentActive]}
              onPress={() => setCycleType('JOINING_DATE')}
              accessibilityRole="button"
              accessibilityLabel="Joining Date Cycle"
            >
              <Text
                style={[
                  styles.segmentText,
                  cycleType === 'JOINING_DATE' && styles.segmentTextActive,
                ]}
              >
                Joining Date
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Default Security Deposit & Late Fee Rules</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Security Deposit:</Text>
            <Text style={styles.value}>1 Month Rent Equivalent</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Grace Period:</Text>
            <Text style={styles.value}>{gracePeriod} Days</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Late Fee Charge:</Text>
            <Text style={styles.value}>₹{lateFee} / Day</Text>
          </View>
        </Card>

        <Button
          title="Save Billing Configuration"
          onPress={handleSave}
          isLoading={updateConfigMutation.isPending}
          style={styles.saveBtn}
        />

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
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.mutedBackground,
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.primaryForeground,
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
  saveBtn: {
    marginBottom: spacing.xs,
  },
  backBtn: {
    marginTop: spacing.xs,
  },
});
