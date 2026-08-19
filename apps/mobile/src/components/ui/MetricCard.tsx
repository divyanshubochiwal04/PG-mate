import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../design-system';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  color?: string;
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  color = colors.primary,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[styles.value, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {Boolean(subValue) && (
        <Text style={styles.subValue} numberOfLines={1}>
          {subValue}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 70,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  subValue: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});
