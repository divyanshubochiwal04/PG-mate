import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getBackgroundColor = (): string => {
    if (disabled) return colors.mutedBackground;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'danger':
        return colors.danger;
      case 'outline':
        return 'transparent';
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.muted;
    switch (variant) {
      case 'outline':
        return colors.primary;
      default:
        return colors.primaryForeground;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineBorder,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  outlineBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
