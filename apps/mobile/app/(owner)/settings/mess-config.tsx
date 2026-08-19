import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
import { GlobalHeader } from '../../../src/components/common/GlobalHeader';
import { useMessConfig, useMesses } from '../../../src/features/mess/hooks/useMess';
import { getErrorMessage } from '../../../src/api/error';
import { colors, spacing, typography } from '../../../src/theme';

export default function MessConfigScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: config, updateConfig, isUpdating } = useMessConfig();
  const { data: messes, createMess } = useMesses();

  const messMode = config?.scopeType || 'CENTRAL';
  const billingMode = config?.billingMode || 'MONTHLY';

  const [newMessName, setNewMessName] = useState('');
  const [newMessCode, setNewMessCode] = useState('');

  const handleScopeChange = async (newScope: 'CENTRAL' | 'PER_BLOCK') => {
    try {
      await updateConfig({ scopeType: newScope });
    } catch (err: unknown) {
      Alert.alert('Update Failed', getErrorMessage(err, 'Failed to update mess scope'));
    }
  };

  const handleBillingModeChange = async (newBilling: 'PER_MEAL' | 'MONTHLY') => {
    try {
      await updateConfig({ billingMode: newBilling });
    } catch (err: unknown) {
      Alert.alert('Update Failed', getErrorMessage(err, 'Failed to update meal billing mode'));
    }
  };

  const handleCreateMessFacility = async () => {
    if (!newMessName.trim() || !newMessCode.trim()) {
      Alert.alert('Validation Error', 'Mess Name and Code are required');
      return;
    }
    try {
      await createMess({ name: newMessName.trim(), code: newMessCode.trim(), scopeType: messMode });
      setNewMessName('');
      setNewMessCode('');
      Alert.alert('Success', 'Mess facility created successfully');
    } catch (err: unknown) {
      Alert.alert('Creation Failed', getErrorMessage(err, 'Failed to create mess facility'));
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Mess Rules & Meal Pricing" />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Mess Management Mode</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[styles.segment, messMode === 'CENTRAL' && styles.segmentActive]}
              onPress={() => handleScopeChange('CENTRAL')}
              accessibilityRole="button"
              accessibilityLabel="Central Mess Mode"
            >
              <Text
                style={[styles.segmentText, messMode === 'CENTRAL' && styles.segmentTextActive]}
              >
                Central Mess
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, messMode === 'PER_BLOCK' && styles.segmentActive]}
              onPress={() => handleScopeChange('PER_BLOCK')}
              accessibilityRole="button"
              accessibilityLabel="Per Block Mess Mode"
            >
              <Text
                style={[styles.segmentText, messMode === 'PER_BLOCK' && styles.segmentTextActive]}
              >
                Per Block Mess
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Meal Billing Model</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[styles.segment, billingMode === 'PER_MEAL' && styles.segmentActive]}
              onPress={() => handleBillingModeChange('PER_MEAL')}
              accessibilityRole="button"
              accessibilityLabel="Per Meal Billing"
            >
              <Text
                style={[styles.segmentText, billingMode === 'PER_MEAL' && styles.segmentTextActive]}
              >
                Per Meal Pricing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, billingMode === 'MONTHLY' && styles.segmentActive]}
              onPress={() => handleBillingModeChange('MONTHLY')}
              accessibilityRole="button"
              accessibilityLabel="Monthly Mess Subscription"
            >
              <Text
                style={[styles.segmentText, billingMode === 'MONTHLY' && styles.segmentTextActive]}
              >
                Monthly Subscription
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Mess Facilities Catalog</Text>
          {(messes || []).map((m) => (
            <View key={m.id} style={styles.messItem}>
              <Text style={styles.messItemName}>
                🍲 {m.name} ({m.code})
              </Text>
              <Text style={styles.messItemTag}>{m.scopeType}</Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: spacing.sm }]}>Add Mess Facility</Text>
          <TextInput
            label="Mess Facility Name"
            value={newMessName}
            onChangeText={setNewMessName}
            placeholder="e.g. Central Dining Hall"
          />
          <TextInput
            label="Mess Code"
            value={newMessCode}
            onChangeText={setNewMessCode}
            placeholder="e.g. MESS-01"
          />
          <Button
            title="Create Mess Facility"
            onPress={handleCreateMessFacility}
            style={{ marginTop: spacing.xs }}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Configured Meal Schedule</Text>
          <View style={styles.scheduleItem}>
            <Text style={styles.mealName}>🍳 Breakfast</Text>
            <Text style={styles.mealTime}>07:30 AM - 09:30 AM</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.mealName}>🍲 Lunch</Text>
            <Text style={styles.mealTime}>12:30 PM - 02:30 PM</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.mealName}>☕ Evening Snacks</Text>
            <Text style={styles.mealTime}>05:00 PM - 06:00 PM</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.mealName}>🍽️ Dinner</Text>
            <Text style={styles.mealTime}>08:00 PM - 10:00 PM</Text>
          </View>
        </Card>

        <Button
          title={isUpdating ? 'Saving Rules...' : 'Mess Configuration Saved'}
          disabled
          onPress={() => undefined}
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
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  card: { padding: spacing.md, marginBottom: spacing.md },
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
  segment: { flex: 1, paddingVertical: spacing.xs, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.muted },
  segmentTextActive: { color: colors.primaryForeground },
  messItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  messItemName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  messItemTag: { fontSize: 10, color: colors.primary, fontWeight: 'bold' },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mealName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  mealTime: { fontSize: typography.fontSize.xs, color: colors.muted },
  saveBtn: { marginBottom: spacing.xs },
  backBtn: { marginTop: spacing.xs },
});
