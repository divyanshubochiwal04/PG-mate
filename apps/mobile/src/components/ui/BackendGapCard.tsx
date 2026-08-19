import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { spacing, typography } from '../../theme';

interface BackendGapCardProps {
  title: string;
  description: string;
  nextAction?: string;
}

export function BackendGapCard({
  title,
  description,
  nextAction = 'Scheduled for M7 backend',
}: BackendGapCardProps): React.JSX.Element {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.badge}>BACKEND GAP</Text>
        <Text style={styles.nextAction}>{nextAction}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  nextAction: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#78350F',
    marginBottom: 4,
  },
  description: {
    fontSize: typography.fontSize.xs,
    color: '#92400E',
    lineHeight: 18,
  },
});
