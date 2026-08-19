import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { CommercialAgreementDto } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { colors, spacing, typography } from '../../../theme';

interface CommercialHistoryModalProps {
  visible: boolean;
  history: CommercialAgreementDto[];
  onClose: () => void;
}

export function CommercialHistoryModal({
  visible,
  history,
  onClose,
}: CommercialHistoryModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Commercial History Timeline</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {history.length > 0 ? (
              history.map((agr, idx) => (
                <Card key={agr.id} style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.versionLabel}>
                      Revision #{history.length - idx} ({agr.status})
                    </Text>
                    <Text style={styles.dateLabel}>Effective: {agr.effectiveDate}</Text>
                  </View>

                  <View style={styles.rentRow}>
                    <Text style={styles.rentLabel}>Base Rent:</Text>
                    <Text style={styles.rentValue}>
                      ₹{agr.baseRentAmount.toLocaleString('en-IN')} / mo
                    </Text>
                  </View>

                  <View style={styles.rentRow}>
                    <Text style={styles.rentLabel}>Security Deposit:</Text>
                    <Text style={styles.rentValue}>
                      ₹{agr.securityDepositAmount.toLocaleString('en-IN')} (
                      {agr.securityDepositStatus})
                    </Text>
                  </View>

                  <View style={styles.rentRow}>
                    <Text style={styles.rentLabel}>Billing Cycle:</Text>
                    <Text style={styles.rentValue}>
                      {agr.billingCycle === 'JOINING_DATE' ? 'Joining Date' : '1st of Month'}
                    </Text>
                  </View>

                  {agr.endDate && (
                    <Text style={styles.endDateText}>Superseded / Ended on: {agr.endDate}</Text>
                  )}
                </Card>
              ))
            ) : (
              <Text style={styles.emptyText}>No historical pricing revisions recorded.</Text>
            )}
          </ScrollView>

          <Button
            title="Close History"
            variant="outline"
            onPress={onClose}
            style={styles.closeBtn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  closeText: {
    fontSize: typography.fontSize.md,
    color: colors.muted,
    fontWeight: typography.fontWeight.bold,
  },
  content: { paddingBottom: spacing.md },
  historyCard: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  versionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  dateLabel: { fontSize: 10, color: colors.muted },
  rentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  rentLabel: { fontSize: typography.fontSize.xs, color: colors.muted },
  rentValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  endDateText: { fontSize: 9, color: colors.warning, marginTop: 4, fontStyle: 'italic' },
  emptyText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  closeBtn: { marginTop: spacing.sm },
});
