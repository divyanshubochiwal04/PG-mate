import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { InvoiceDto, InvoiceStatusDto } from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { MetricCard } from '../../../src/components/ui/MetricCard';
import { TextInput } from '../../../src/components/ui/TextInput';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { InvoiceCard } from '../../../src/features/billing/components/InvoiceCard';
import { PaymentCard } from '../../../src/features/billing/components/PaymentCard';
import { PaymentCollectionModal } from '../../../src/features/billing/components/PaymentCollectionModal';
import {
  WhatsAppReminderModal,
  type WhatsAppReminderData,
} from '../../../src/features/billing/components/WhatsAppReminderModal';
import {
  InvoiceReceiptModal,
  type ReceiptData,
} from '../../../src/features/billing/components/InvoiceReceiptModal';
import { ElectricityCalculatorModal } from '../../../src/features/billing/components/ElectricityCalculatorModal';
import { ExpenseTrackerModal } from '../../../src/features/billing/components/ExpenseTrackerModal';
import {
  useBillingOverview,
  useGenerateInvoices,
  useInvoices,
  usePayments,
  useRecordPayment,
} from '../../../src/features/billing/hooks/useBilling';
import { getErrorMessage } from '../../../src/api/error';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function BillingDashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVOICES' | 'PAYMENTS'>('OVERVIEW');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatusDto | 'ALL'>('ALL');
  const [billingPeriodFilter, setBillingPeriodFilter] = useState('');

  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);

  // New Modals State
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderData, setReminderData] = useState<WhatsAppReminderData | null>(null);

  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const [electricityModalVisible, setElectricityModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);

  const {
    data: overview,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
  } = useBillingOverview();

  const {
    data: invoiceData,
    isLoading: isInvoicesLoading,
    refetch: refetchInvoices,
    error: invoicesError,
  } = useInvoices({
    search: searchQuery || undefined,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    billingPeriod: billingPeriodFilter || undefined,
  });

  const { data: payments, isLoading: isPaymentsLoading, refetch: refetchPayments, error: paymentsError } = usePayments();
  const generateInvoicesMutation = useGenerateInvoices();
  const recordPaymentMutation = useRecordPayment();

  const invoices = invoiceData?.items || [];
  const isRefreshing = isOverviewLoading || isInvoicesLoading || isPaymentsLoading;

  const handleRefresh = () => {
    refetchOverview();
    refetchInvoices();
    refetchPayments();
  };

  const handleGenerateInvoices = async () => {
    try {
      const result = await generateInvoicesMutation.mutateAsync({
        billingPeriod: billingPeriodFilter || undefined,
      });
      Alert.alert(
        'Invoices Generated',
        `Successfully generated ${result.length} monthly invoices.`
      );
    } catch (err: unknown) {
      Alert.alert('Generation Error', getErrorMessage(err, 'Failed to generate invoices.'));
    }
  };

  const openPaymentModal = (inv: InvoiceDto) => {
    setSelectedInvoice(inv);
    setIsCollectModalOpen(true);
  };

  const openReminderModal = (inv: InvoiceDto) => {
    const total = inv.totalAmount || 0;
    const paid = inv.paidAmount || 0;
    const balance = inv.balanceDueAmount ?? Math.max(0, total - paid);

    setReminderData({
      residentName: (inv as any).residentName || 'Resident',
      roomNumber: (inv as any).roomNumber || 'Assigned Room',
      amountDue: balance,
      dueDate: inv.dueDate || 'Immediate',
      monthName: inv.billingPeriodStart ? new Date(inv.billingPeriodStart).toLocaleString('default', { month: 'long' }) : undefined,
    });
    setReminderModalVisible(true);
  };

  const openReceiptModal = (inv: InvoiceDto) => {
    const total = inv.totalAmount || 0;
    const paid = inv.paidAmount || 0;
    const balance = inv.balanceDueAmount ?? Math.max(0, total - paid);

    setReceiptData({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      residentName: (inv as any).residentName || 'Resident',
      roomNumber: (inv as any).roomNumber || 'Room',
      lineItems: inv.items?.map((it) => ({
        description: it.description,
        amount: (it as any).amount || (it as any).totalAmount || 0,
      })) || [
        { description: 'Monthly Room Rent & Utilities', amount: total },
      ],
      totalAmount: total,
      paidAmount: paid,
      balanceAmount: balance,
      status: (inv.status as any) || 'PENDING',
    });
    setReceiptModalVisible(true);
  };

  const handleRecordPayment = async (dto: {
    residentId: string;
    stayId: string;
    invoiceId?: string;
    amount: number;
    paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
    referenceNumber?: string;
    notes?: string;
  }) => {
    try {
      await recordPaymentMutation.mutateAsync({
        ...dto,
        idempotencyKey: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });

      handleRefresh();

      if (selectedInvoice) {
        const updatedPaid = (selectedInvoice.paidAmount || 0) + dto.amount;
        const updatedBalance = Math.max(0, (selectedInvoice.totalAmount || 0) - updatedPaid);

        setReceiptData({
          invoiceId: selectedInvoice.id,
          invoiceNumber: selectedInvoice.invoiceNumber,
          residentName: (selectedInvoice as any).residentName || 'Resident',
          roomNumber: (selectedInvoice as any).roomNumber || 'Room',
          lineItems: selectedInvoice.items?.map((it: any) => ({
            description: it.description,
            amount: it.amount || it.totalAmount || 0,
          })) || [
            { description: 'Monthly Room Rent & Utilities', amount: selectedInvoice.totalAmount },
          ],
          totalAmount: selectedInvoice.totalAmount,
          paidAmount: updatedPaid,
          balanceAmount: updatedBalance,
          paymentMethod: dto.paymentMethod,
          transactionId: dto.referenceNumber,
          paymentDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: updatedBalance <= 0 ? 'PAID' : 'PARTIAL',
        });
        setReceiptModalVisible(true);
      } else {
        Alert.alert('Payment Recorded', `Successfully collected ₹${dto.amount.toLocaleString('en-IN')}`);
      }
    } catch (err: unknown) {
      Alert.alert('Payment Failed', getErrorMessage(err, 'Failed to record payment.'));
    }
  };



  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'OVERVIEW' && styles.activeTab]}
            onPress={() => setActiveTab('OVERVIEW')}
            accessibilityRole="button"
          >
            <Ionicons
              name="analytics-outline"
              size={16}
              color={activeTab === 'OVERVIEW' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'OVERVIEW' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'INVOICES' && styles.activeTab]}
            onPress={() => setActiveTab('INVOICES')}
            accessibilityRole="button"
          >
            <Ionicons
              name="receipt-outline"
              size={16}
              color={activeTab === 'INVOICES' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'INVOICES' && styles.activeTabText]}>
              Invoices ({invoices.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'PAYMENTS' && styles.activeTab]}
            onPress={() => setActiveTab('PAYMENTS')}
            accessibilityRole="button"
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={activeTab === 'PAYMENTS' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'PAYMENTS' && styles.activeTabText]}>
              Payments ({payments?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'OVERVIEW' && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          >
            {isOverviewLoading ? (
              <View style={styles.loadingWrap}>
                <SkeletonLoader height={100} style={{ marginBottom: spacing.md }} />
                <SkeletonLoader height={100} style={{ marginBottom: spacing.md }} />
              </View>
            ) : overview ? (
              <View>
                {/* Financial Summary Grid */}
                <View style={styles.metricsRow}>
                  <MetricCard
                    label="Receivable"
                    value={`₹${((overview.totalReceivable || 0) / 1000).toFixed(1)}k`}
                    color={colors.primary}
                  />
                  <MetricCard
                    label="Collected"
                    value={`₹${((overview.collectedThisMonth || 0) / 1000).toFixed(1)}k`}
                    color={colors.success}
                  />
                  <MetricCard
                    label="Outstanding"
                    value={`₹${((overview.totalOutstanding || 0) / 1000).toFixed(1)}k`}
                    color={colors.danger}
                  />
                </View>

                {/* Quick Utility Tools (Electricity Split & PG Expenses) */}
                <View style={styles.utilityRow}>
                  <TouchableOpacity
                    style={styles.utilityBtnElectricity}
                    onPress={() => setElectricityModalVisible(true)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="flash" size={18} color="#EAB308" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.utilityBtnTitle}>⚡ Electricity Split</Text>
                      <Text style={styles.utilityBtnSub}>Auto sub-meter bill divider</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.utilityBtnExpense}
                    onPress={() => setExpenseModalVisible(true)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="pie-chart" size={18} color="#2563EB" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.utilityBtnTitle}>📊 Expense & Profit</Text>
                      <Text style={styles.utilityBtnSub}>Track real net margins</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Overdue Alert Banner */}
                {Boolean(overview.totalOverdue && overview.totalOverdue > 0) && (
                  <Card style={styles.overdueCard}>
                    <View style={styles.overdueHeader}>
                      <Ionicons name="warning-outline" size={18} color={colors.danger} />
                      <Text style={styles.overdueTitle}>
                        ₹{overview.totalOverdue.toLocaleString('en-IN')} Overdue
                      </Text>
                    </View>
                    <Text style={styles.overdueSub}>
                      {overview.unpaidInvoicesCount || 0} invoice(s) are currently unpaid / overdue.
                    </Text>
                  </Card>
                )}

                {/* Monthly Generation Action Card */}
                <Card style={styles.actionCard}>
                  <View style={styles.actionCardHeader}>
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    <Text style={typography.h3}>Monthly Invoice Generator</Text>
                  </View>
                  <Text style={styles.actionCardDesc}>
                    Generate recurring monthly invoices for all active resident stays.
                  </Text>
                  <TextInput
                    placeholder="Billing Period (e.g. 2026-08)"
                    value={billingPeriodFilter}
                    onChangeText={setBillingPeriodFilter}
                    style={{ marginVertical: spacing.xs }}
                  />
                  <Button
                    title="Generate Invoices"
                    loading={generateInvoicesMutation.isPending}
                    onPress={handleGenerateInvoices}
                  />
                </Card>
              </View>
            ) : (
              <EmptyState
                icon="card-outline"
                title="No Billing Data"
                description="Generate invoices to start tracking dues and collections."
              />
            )}
          </ScrollView>
        )}

        {activeTab === 'INVOICES' && (
          <View style={{ flex: 1 }}>
            {/* Search & Filters */}
            <View style={styles.searchRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  placeholder="Search invoices by resident, number..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {isInvoicesLoading ? (
              <View style={styles.loadingWrap}>
                <SkeletonLoader height={120} style={{ marginBottom: spacing.sm }} />
                <SkeletonLoader height={120} style={{ marginBottom: spacing.sm }} />
                <SkeletonLoader height={120} style={{ marginBottom: spacing.sm }} />
              </View>
            ) : invoicesError ? (
              <ErrorState
                title="Failed to load invoices"
                error={invoicesError}
                onRetry={refetchInvoices}
              />
            ) : invoices.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="No Invoices Found"
                description="No invoices match the current search or filters."
              />
            ) : (
              <FlatList
                data={invoices}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <InvoiceCard
                    invoice={item}
                    onCollectPayment={openPaymentModal}
                    onRemind={openReminderModal}
                    onViewReceipt={openReceiptModal}
                  />
                )}
              />
            )}
          </View>
        )}

        {activeTab === 'PAYMENTS' && (
          <View style={{ flex: 1 }}>
            {isPaymentsLoading ? (
              <View style={styles.loadingWrap}>
                <SkeletonLoader height={80} style={{ marginBottom: spacing.sm }} />
                <SkeletonLoader height={80} style={{ marginBottom: spacing.sm }} />
                <SkeletonLoader height={80} style={{ marginBottom: spacing.sm }} />
              </View>
            ) : paymentsError ? (
              <ErrorState
                title="Failed to load payments"
                error={paymentsError}
                onRetry={refetchPayments}
              />
            ) : !payments || payments.length === 0 ? (
              <EmptyState
                icon="cash-outline"
                title="No Payments Recorded"
                description="Payments collected from residents will appear here."
              />
            ) : (
              <FlatList
                data={payments}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => <PaymentCard payment={item} />}
              />
            )}
          </View>
        )}

        {/* Payment Collection Modal */}
        <PaymentCollectionModal
          visible={isCollectModalOpen}
          onClose={() => setIsCollectModalOpen(false)}
          invoice={selectedInvoice}
          onRecordPayment={handleRecordPayment}
          isSubmitting={recordPaymentMutation.isPending}
        />

        {/* WhatsApp & In-App Reminder Modal */}
        <WhatsAppReminderModal
          visible={reminderModalVisible}
          data={reminderData}
          onClose={() => setReminderModalVisible(false)}
        />

        {/* Printable / Shareable Receipt Modal */}
        <InvoiceReceiptModal
          visible={receiptModalVisible}
          data={receiptData}
          onClose={() => setReceiptModalVisible(false)}
        />

        {/* Electricity Sub-Meter Calculator Modal */}
        <ElectricityCalculatorModal
          visible={electricityModalVisible}
          roomNumber="101"
          occupants={[
            { residentId: '1', residentName: 'Rahul Sharma', bedNumber: '1' },
            { residentId: '2', residentName: 'Amit Verma', bedNumber: '2' },
          ]}
          onClose={() => setElectricityModalVisible(false)}
        />

        {/* PG Expense & Profit Tracker Modal */}
        <ExpenseTrackerModal
          visible={expenseModalVisible}
          totalCollectionsMonth={overview?.collectedThisMonth || 85000}
          onClose={() => setExpenseModalVisible(false)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  activeTab: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  loadingWrap: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs + 2,
  },
  utilityRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  utilityBtnElectricity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  utilityBtnExpense: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  utilityBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  utilityBtnSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  overdueCard: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overdueTitle: {
    ...typography.h3,
    color: colors.danger,
  },
  overdueSub: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  actionCardDesc: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  searchRow: {
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: 110,
  },
});
