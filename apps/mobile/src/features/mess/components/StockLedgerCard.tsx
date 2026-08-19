import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';
import { useStockLedger } from '../hooks/useMess';
import { colors, radius, spacing, typography } from '../../../design-system';

interface StockLedgerCardProps {
  item: any;
  onClose: () => void;
}

export function StockLedgerCard({ item, onClose }: StockLedgerCardProps): React.JSX.Element {
  const { data: ledgerData } = useStockLedger(item?.id);
  const ledgerItems = ledgerData?.items || [];

  return (
    <Card style={styles.formCard}>
      <View style={styles.ledgerHeader}>
        <Text style={typography.h3}>Stock Ledger: {item.name}</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {ledgerItems.length === 0 ? (
        <Text style={styles.emptyLedgerText}>No stock ledger entries recorded yet.</Text>
      ) : (
        ledgerItems.map((tx: any) => (
          <View key={tx.id} style={styles.ledgerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ledgerTxType}>{tx.transactionType.replace('_', ' ')}</Text>
              <Text style={styles.ledgerDate}>
                {new Date(tx.createdAt).toLocaleDateString()} • {tx.notes || 'N/A'}
              </Text>
            </View>
            <Text
              style={[
                styles.ledgerQty,
                ['ADJUSTMENT_IN', 'PURCHASE'].includes(tx.transactionType) ? styles.incQty : styles.decQty,
              ]}
            >
              {['ADJUSTMENT_IN', 'PURCHASE'].includes(tx.transactionType) ? '+' : '-'}
              {tx.quantity} {item.unit}
            </Text>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  emptyLedgerText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ledgerTxType: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
  ledgerDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  ledgerQty: {
    ...typography.smallBold,
  },
  incQty: {
    color: colors.success,
  },
  decQty: {
    color: colors.danger,
  },
});
