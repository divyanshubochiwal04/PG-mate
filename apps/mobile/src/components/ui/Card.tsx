import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
});
