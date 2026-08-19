import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../../design-system';

export interface ExpenseRecord {
  id: string;
  category: string;
  categoryLabel: string;
  amount: number;
  date: string;
  payeeName: string;
  paymentMode: string;
  notes?: string;
}

const EXPENSE_CATEGORIES = [
  { id: 'RATION_GROCERY', label: '🛒 Ration & Groceries', icon: 'cart-outline' },
  { id: 'DAIRY_MILK', label: '🥛 Milk & Dairy', icon: 'nutrition-outline' },
  { id: 'STAFF_SALARY', label: '👨‍🍳 Staff / Cook Salary', icon: 'people-outline' },
  { id: 'ELECTRICITY_BILL', label: '⚡ Main Power Bill', icon: 'flash-outline' },
  { id: 'WIFI_INTERNET', label: '📶 Wi-Fi & Internet', icon: 'wifi-outline' },
  { id: 'WATER_SUPPLY', label: '💧 Water Tanker', icon: 'water-outline' },
  { id: 'MAINTENANCE_REPAIRS', label: '🛠️ Repairs & Plumbing', icon: 'construct-outline' },
  { id: 'MISC', label: '📦 Miscellaneous', icon: 'cube-outline' },
];

interface ExpenseTrackerModalProps {
  visible: boolean;
  totalCollectionsMonth?: number;
  onClose: () => void;
  onAddExpense?: (expense: Omit<ExpenseRecord, 'id'>) => void;
}

export function ExpenseTrackerModal({
  visible,
  totalCollectionsMonth = 85000,
  onClose,
  onAddExpense,
}: ExpenseTrackerModalProps): React.JSX.Element {
  const [selectedCat, setSelectedCat] = useState('RATION_GROCERY');
  const [amount, setAmount] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [notes, setNotes] = useState('');

  // Sample existing logged expenses for real net profit calculation
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    {
      id: '1',
      category: 'RATION_GROCERY',
      categoryLabel: '🛒 Ration & Groceries',
      amount: 14500,
      date: '15 Aug 2026',
      payeeName: 'Sharma Grocery Store',
      paymentMode: 'UPI',
    },
    {
      id: '2',
      category: 'STAFF_SALARY',
      categoryLabel: '👨‍🍳 Staff / Cook Salary',
      amount: 18000,
      date: '10 Aug 2026',
      payeeName: 'Ramesh Cook & Housekeeper',
      paymentMode: 'Bank Transfer',
    },
    {
      id: '3',
      category: 'WIFI_INTERNET',
      categoryLabel: '📶 Wi-Fi & Internet',
      amount: 1999,
      date: '05 Aug 2026',
      payeeName: 'Airtel Fiber',
      paymentMode: 'UPI',
    },
  ]);

  const totalExpenseSum = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalCollectionsMonth - totalExpenseSum;
  const profitMargin = totalCollectionsMonth > 0
    ? Math.round((netProfit / totalCollectionsMonth) * 100)
    : 0;

  const handleSaveExpense = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid expense amount.');
      return;
    }

    const catObj = EXPENSE_CATEGORIES.find((c) => c.id === selectedCat);
    const newRecord: ExpenseRecord = {
      id: String(Date.now()),
      category: selectedCat,
      categoryLabel: catObj ? catObj.label : selectedCat,
      amount: amt,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      payeeName: payeeName.trim() || 'Vendor / Expense',
      paymentMode,
      notes: notes.trim() || undefined,
    };

    setExpenses([newRecord, ...expenses]);
    if (onAddExpense) {
      onAddExpense(newRecord);
    }

    setAmount('');
    setPayeeName('');
    setNotes('');
    Alert.alert('Expense Recorded', `₹${amt.toLocaleString('en-IN')} logged under ${newRecord.categoryLabel}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="pie-chart" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>PG Expense & Net Profit</Text>
                <Text style={styles.modalSub}>Track operational costs & real margins</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Real Net Profit Dashboard Card */}
            <View style={styles.profitDashboard}>
              <View style={styles.profitRow}>
                <View>
                  <Text style={styles.dashLabel}>TOTAL COLLECTIONS</Text>
                  <Text style={styles.dashValGreen}>₹{totalCollectionsMonth.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.dashLabel}>TOTAL EXPENSES</Text>
                  <Text style={styles.dashValRed}>- ₹{totalExpenseSum.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <View style={styles.dashDivider} />

              <View style={styles.profitRow}>
                <View>
                  <Text style={styles.netProfitLabel}>REAL NET PROFIT</Text>
                  <Text style={styles.netProfitVal}>₹{netProfit.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.marginPill}>
                  <Text style={styles.marginPillText}>{profitMargin}% MARGIN</Text>
                </View>
              </View>
            </View>

            {/* Log New Expense Form */}
            <Text style={styles.sectionHeader}>LOG NEW EXPENSE</Text>
            <View style={styles.formCard}>
              {/* Category Selector Chips */}
              <Text style={styles.fieldLabel}>EXPENSE CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
                    onPress={() => setSelectedCat(cat.id)}
                  >
                    <Text style={[styles.catChipText, selectedCat === cat.id && styles.catChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Amount & Payee Row */}
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>AMOUNT (₹)</Text>
                  <NativeTextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>PAYEE / VENDOR</Text>
                  <NativeTextInput
                    style={styles.textInput}
                    placeholder="e.g. Cook / Airtel"
                    value={payeeName}
                    onChangeText={setPayeeName}
                  />
                </View>
              </View>

              {/* Payment Mode Selector */}
              <View style={{ marginTop: 8 }}>
                <Text style={styles.fieldLabel}>PAYMENT MODE</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['UPI', 'Cash', 'Bank Transfer'].map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.modeChip, paymentMode === mode && styles.modeChipActive]}
                      onPress={() => setPaymentMode(mode)}
                    >
                      <Text style={[styles.modeChipText, paymentMode === mode && styles.modeChipTextActive]}>
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveExpense}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Add Expense Record</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Logged Expenses List */}
            <Text style={styles.sectionHeader}>RECENT LOGGED EXPENSES</Text>
            {expenses.map((exp) => (
              <View key={exp.id} style={styles.expenseItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expTitle}>{exp.categoryLabel}</Text>
                  <Text style={styles.expSub}>
                    {exp.payeeName} • {exp.paymentMode} • {exp.date}
                  </Text>
                </View>
                <Text style={styles.expAmount}>- ₹{exp.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '92%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  modalSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    maxHeight: 500,
  },
  profitDashboard: {
    backgroundColor: '#0F172A',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dashValGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4ADE80',
    marginTop: 2,
  },
  dashValRed: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F87171',
    marginTop: 2,
  },
  dashDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: spacing.sm,
  },
  netProfitLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  netProfitVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
    marginTop: 2,
  },
  marginPill: {
    backgroundColor: '#166534',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  marginPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DCFCE7',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.mutedBackground,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.mutedBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    height: 44,
    borderRadius: radius.md,
    marginTop: spacing.sm + 2,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  expTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  expSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
});
