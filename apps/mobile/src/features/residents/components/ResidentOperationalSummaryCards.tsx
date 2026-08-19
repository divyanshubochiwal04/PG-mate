import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ResidentOperationalSummaryDto } from '@m-square/contracts';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { colors, radius, spacing, typography } from '../../../design-system';

interface Props {
  summary?: ResidentOperationalSummaryDto;
  isLoading?: boolean;
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MetricItem {
  title: string;
  value: string | number;
  color: string;
  icon: IoniconsName;
}

export const ResidentOperationalSummaryCards: React.FC<Props> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} width={130} height={70} borderRadius={radius.sm} style={{ marginRight: spacing.sm }} />
          ))}
        </ScrollView>
      </View>
    );
  }

  const cards: MetricItem[] = [
    {
      title: 'Total Residents',
      value: summary?.totalResidents ?? 0,
      color: colors.primary,
      icon: 'people-outline',
    },
    {
      title: 'Active Stays',
      value: summary?.activeResidents ?? 0,
      color: colors.success,
      icon: 'checkmark-circle-outline',
    },
    {
      title: 'Checked Out',
      value: summary?.checkedOutResidents ?? 0,
      color: colors.textSecondary,
      icon: 'log-out-outline',
    },
    {
      title: 'No Stay',
      value: summary?.residentsWithoutStay ?? 0,
      color: colors.warning,
      icon: 'alert-circle-outline',
    },
    {
      title: 'Occupied Beds',
      value: summary?.occupiedBeds ?? 0,
      color: colors.info,
      icon: 'bed-outline',
    },
    {
      title: 'Outstanding Dues',
      value: `₹${(summary?.outstandingAmount ?? 0).toLocaleString('en-IN')}`,
      color: summary?.outstandingAmount ? colors.danger : colors.success,
      icon: 'cash-outline',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {cards.map((c) => (
          <View key={c.title} style={[styles.card, { borderLeftColor: c.color }]}>
            <View style={styles.header}>
              <Ionicons name={c.icon} size={14} color={c.color} />
              <Text style={styles.cardTitle}>{c.title}</Text>
            </View>
            <Text style={[styles.cardValue, { color: c.color }]}>{c.value}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  scroll: {
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: spacing.sm,
    marginRight: spacing.sm,
    minWidth: 125,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cardValue: {
    ...typography.h3,
    fontWeight: '700',
  },
});
