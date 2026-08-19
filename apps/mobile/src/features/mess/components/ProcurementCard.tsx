import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MessProcurementDto, MessVendorDto } from '@m-square/contracts';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing, typography } from '../../../design-system';

interface ProcurementCardProps {
  procurement: MessProcurementDto;
  vendors: MessVendorDto[];
}

export function ProcurementCard({ procurement, vendors }: ProcurementCardProps): React.JSX.Element {
  const matchedVendor = vendors.find((v) => v.id === procurement.vendorId);
  const pDate = procurement.purchaseDate || procurement.createdAt;

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>PO: {procurement.id.slice(0, 8)}</Text>
          <Text style={styles.subText}>
            Supplier: {matchedVendor?.name || 'General Supplier'}
          </Text>
        </View>
        <Text style={styles.amountText}>
          ₹{procurement.totalAmount.toLocaleString('en-IN')}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Date: {new Date(pDate).toLocaleDateString()}
        </Text>
        {Boolean(procurement.invoiceReference) && (
          <Text style={styles.refText}>Inv: {procurement.invoiceReference}</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: spacing.xs,
  },
  subText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountText: {
    ...typography.h3,
    color: colors.textPrimary,
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
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  refText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});
