import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
import { MetricCard } from '../../../src/components/ui/MetricCard';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useMesses, useMessExpenses, useVendors } from '../../../src/features/mess/hooks/useMess';
import { getErrorMessage } from '../../../src/api/error';
import { colors, radius, spacing, typography } from '../../../src/design-system';

const CATEGORIES = [
  'GAS',
  'ELECTRICITY',
  'SALARY',
  'CLEANING',
  'TRANSPORT',
  'MAINTENANCE',
  'MISCELLANEOUS',
] as const;

export default function MessExpensesScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: messes } = useMesses();
  const activeMess = (messes || [])[0];

  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const { data: expData, createExpense, isCreating } = useMessExpenses(
    activeMess?.id,
    1,
    50,
    search.trim() || undefined,
    selectedCategoryFilter || undefined
  );
  const { data: vendorData } = useVendors(1, 50);

  const expenses = expData?.items || [];
  const vendors = vendorData?.items || [];

  const [showAdd, setShowAdd] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('GAS');
  const [amountStr, setAmountStr] = useState('1500');
  const [refNo, setRefNo] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const handleCreateExpense = async () => {
    if (!activeMess) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive expense amount');
      return;
    }
    try {
      await createExpense({
        messId: activeMess.id,
        category,
        amount,
        expenseDate: expenseDate.trim() || undefined,
        vendorId: selectedVendorId || undefined,
        referenceNo: refNo.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setShowAdd(false);
      setAmountStr('');
      setRefNo('');
      setNotes('');
      setSelectedVendorId(null);
      Alert.alert('Success', 'Mess operational expense recorded successfully');
    } catch (err: unknown) {
      Alert.alert('Expense Failed', getErrorMessage(err, 'Failed to record expense'));
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h2}>Mess Expenses</Text>
          <Text style={styles.subtitle}>Track overhead costs, utilities and kitchen operations.</Text>
        </View>

        {/* Total Expense Metric Card */}
        <View style={styles.summaryBox}>
          <MetricCard
            label="Total Cash Outflow (Filtered)"
            value={`₹${totalExpenseAmount.toLocaleString('en-IN')}`}
            color={colors.danger}
          />
        </View>

        {/* Search & Add Action */}
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <TextInput
              placeholder="Search reference or notes..."
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Button
            title="+ Expense"
            size="small"
            icon={<Ionicons name="add-circle-outline" size={16} color={colors.surface} />}
            onPress={() => setShowAdd(true)}
          />
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategoryFilter === null && styles.filterChipActive]}
            onPress={() => setSelectedCategoryFilter(null)}
          >
            <Text style={[styles.filterChipText, selectedCategoryFilter === null && styles.filterChipTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.filterChip, selectedCategoryFilter === c && styles.filterChipActive]}
              onPress={() => setSelectedCategoryFilter(c)}
            >
              <Text style={[styles.filterChipText, selectedCategoryFilter === c && styles.filterChipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Add Expense Form */}
        {showAdd && (
          <Card style={styles.formCard}>
            <Text style={typography.h3}>Record Mess Expense</Text>

            <Text style={styles.fieldLabel}>Expense Category *</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, category === c && styles.catChipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              label="Amount (₹) *"
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="numeric"
            />
            <TextInput
              label="Reference / Invoice No."
              placeholder="e.g. BILL-4412"
              value={refNo}
              onChangeText={setRefNo}
            />
            <TextInput
              label="Expense Date"
              value={expenseDate}
              onChangeText={setExpenseDate}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.fieldLabel}>Supplier / Vendor (Optional)</Text>
            <View style={styles.vendorChips}>
              {vendors.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.catChip, selectedVendorId === v.id && styles.catChipActive]}
                  onPress={() => setSelectedVendorId(selectedVendorId === v.id ? null : v.id)}
                >
                  <Text style={[styles.catChipText, selectedVendorId === v.id && styles.catChipTextActive]}>
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              label="Notes"
              placeholder="Additional operational details..."
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.formActions}>
              <Button title="Cancel" variant="outline" onPress={() => setShowAdd(false)} style={{ flex: 1 }} />
              <Button title="Save Expense" loading={isCreating} onPress={handleCreateExpense} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <EmptyState
            icon="cash-outline"
            title="No Expenses Recorded"
            description="Record utility, salary, gas or maintenance costs."
            actionTitle="+ Add Expense"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          expenses.map((e) => (
            <Card key={e.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{e.category}</Text>
                  <Text style={styles.subText}>
                    Date: {new Date(e.expenseDate).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.amountText}>₹{Number(e.amount).toLocaleString('en-IN')}</Text>
              </View>
              {Boolean(e.referenceNo || e.notes) && (
                <View style={styles.cardFooter}>
                  {Boolean(e.referenceNo) && (
                    <Text style={styles.refText}>Ref: {e.referenceNo}</Text>
                  )}
                  {Boolean(e.notes) && (
                    <Text style={styles.notesText}>{e.notes}</Text>
                  )}
                </View>
              )}
            </Card>
          ))
        )}

        <Button
          title="Back to Mess Operations"
          variant="outline"
          icon={<Ionicons name="arrow-back-outline" size={16} color={colors.primary} />}
          onPress={() => router.back()}
          style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
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
  header: {
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryBox: {
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chipScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  catChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surface,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  catChipTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  vendorChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountText: {
    ...typography.h3,
    color: colors.danger,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  refText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  notesText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
