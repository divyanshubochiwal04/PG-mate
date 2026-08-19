import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../design-system';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  /** @deprecated Use `loading` instead */
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading: loadingProp = false,
  isLoading = false,
  disabled = false,
  icon,
  style,
  ...props
}) => {
  const loading = loadingProp || isLoading;
  const getContainerStyle = (): ViewStyle => {
    let bg = colors.primary;
    let border = 'transparent';

    if (variant === 'secondary') {
      bg = colors.secondaryLight;
    } else if (variant === 'outline') {
      bg = 'transparent';
      border = colors.borderDark;
    } else if (variant === 'ghost') {
      bg = 'transparent';
    } else if (variant === 'danger') {
      bg = colors.danger;
    }

    let minHeight = 48;
    let paddingH = spacing.lg;

    if (size === 'small') {
      minHeight = 36;
      paddingH = spacing.md;
    } else if (size === 'large') {
      minHeight = 54;
      paddingH = spacing.xl;
    }

    return {
      backgroundColor: disabled ? colors.borderDark : bg,
      borderColor: border,
      borderWidth: variant === 'outline' ? 1 : 0,
      minHeight,
      paddingHorizontal: paddingH,
    };
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    if (variant === 'secondary') return colors.textPrimary;
    if (variant === 'outline' || variant === 'ghost') return colors.primary;
    if (variant === 'danger' || variant === 'primary') return colors.surface;
    return colors.surface;
  };

  return (
    <TouchableOpacity
      style={[styles.base, getContainerStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: getTextColor() }, size === 'small' && styles.smallText]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  text: {
    ...typography.bodyBold,
  },
  smallText: {
    ...typography.smallBold,
  },
});
