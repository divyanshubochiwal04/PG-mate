import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ResidentCommercialSummaryDto } from '@m-square/contracts';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { colors, spacing, typography } from '../../../theme';

interface CommercialSummaryCardProps {
  summary: ResidentCommercialSummaryDto | null;
  isLoading?: boolean;
  onRevisePricing: () => void;
  onAssignFacility: () => void;
  onAddCharge: () => void;
  onViewHistory: () => void;
  onRevokeFacility: (facilityId: string) => void;
  onCancelCharge: (chargeId: string) => void;
}

export function CommercialSummaryCard({
  summary,
  isLoading,
  onRevisePricing,
  onAssignFacility,
  onAddCharge,
  onViewHistory,
  onRevokeFacility,
  onCancelCharge,
}: CommercialSummaryCardProps): React.JSX.Element {
  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Text style={styles.loadingText}>Loading commercial agreement...</Text>
      </Card>
    );
  }

  const agreement = summary?.agreement;
  const facilities = summary?.facilities || [];
  const charges = summary?.additionalCharges || [];

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Commercial & Rent Terms</Text>
        <TouchableOpacity onPress={onViewHistory}>
          <Text style={styles.historyBtn}>History 📜</Text>
        </TouchableOpacity>
      </View>

      {agreement ? (
        <View style={styles.rentSection}>
          <View style={styles.mainRentRow}>
            <View>
              <Text style={styles.rentLabel}>Base Monthly Rent</Text>
              <Text style={styles.rentAmount}>
                ₹{agreement.baseRentAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <Button
              title="Revise Rate"
              variant="outline"
              onPress={onRevisePricing}
              style={styles.smallBtn}
            />
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Security Deposit</Text>
              <Text style={styles.detailValue}>
                ₹{agreement.securityDepositAmount.toLocaleString('en-IN')} (
                {agreement.securityDepositStatus})
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Billing Cycle</Text>
              <Text style={styles.detailValue}>
                {agreement.billingCycle === 'JOINING_DATE' ? 'Joining Date' : '1st of Month'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No active commercial agreement found for this resident.
          </Text>
          <Button
            title="Configure Pricing"
            onPress={onRevisePricing}
            style={{ marginTop: spacing.xs }}
          />
        </View>
      )}

      {/* Facilities Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.subTitle}>Assigned Facilities ({facilities.length})</Text>
        <TouchableOpacity onPress={onAssignFacility}>
          <Text style={styles.addBtn}>+ Assign</Text>
        </TouchableOpacity>
      </View>
      {facilities.length > 0 ? (
        <View style={styles.chipRow}>
          {facilities.map((f) => (
            <View key={f.id} style={styles.facilityChip}>
              <Text style={styles.facilityChipText}>
                {f.facilityName} {f.monthlyCharge > 0 ? `(+₹${f.monthlyCharge})` : ''}
              </Text>
              <TouchableOpacity onPress={() => onRevokeFacility(f.facilityId)}>
                <Text style={styles.chipRemove}> ×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.mutedText}>No custom resident facilities assigned.</Text>
      )}

      {/* Additional Charges Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.subTitle}>Additional Charges ({charges.length})</Text>
        <TouchableOpacity onPress={onAddCharge}>
          <Text style={styles.addBtn}>+ Add Charge</Text>
        </TouchableOpacity>
      </View>
      {charges.length > 0 ? (
        <View style={styles.chargesList}>
          {charges.map((c) => (
            <View key={c.id} style={styles.chargeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chargeDesc}>
                  {c.description} ({c.chargeType})
                </Text>
                <Text style={styles.chargeMeta}>
                  {c.isRecurring ? 'Monthly Recurring' : 'One-Time'}
                </Text>
              </View>
              <Text style={styles.chargeAmount}>₹{c.amount.toLocaleString('en-IN')}</Text>
              <TouchableOpacity onPress={() => onCancelCharge(c.id)}>
                <Text style={styles.chipRemove}> Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.mutedText}>No additional charges active.</Text>
      )}

      {/* Total Monthly Summary */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Monthly Payable</Text>
        <Text style={styles.totalValue}>
          ₹{(summary?.totalMonthlyAmount || 0).toLocaleString('en-IN')} / mo
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, marginBottom: spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  historyBtn: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    padding: spacing.md,
  },
  rentSection: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  mainRentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rentLabel: { fontSize: typography.fontSize.xs, color: colors.muted },
  rentAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  smallBtn: { paddingHorizontal: spacing.sm, height: 36 },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 10, color: colors.muted },
  detailValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  emptyBox: {
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  emptyText: { fontSize: typography.fontSize.xs, color: colors.muted, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  addBtn: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.xs },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  facilityChipText: { fontSize: 11, color: colors.primary, fontWeight: typography.fontWeight.bold },
  chipRemove: { fontSize: 12, color: colors.danger, fontWeight: typography.fontWeight.bold },
  chargesList: { gap: 4, marginBottom: spacing.xs },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chargeDesc: { fontSize: 11, fontWeight: typography.fontWeight.bold, color: colors.text },
  chargeMeta: { fontSize: 9, color: colors.muted },
  chargeAmount: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginHorizontal: 6,
  },
  mutedText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.primary + '40',
  },
  totalLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  totalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});
