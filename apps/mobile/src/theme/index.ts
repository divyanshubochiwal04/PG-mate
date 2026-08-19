/**
 * LEGACY THEME RE-EXPORT
 * All design tokens are now centralized in `src/design-system/`.
 * This file re-exports them for backward compatibility.
 * New code should import from `../../design-system` directly.
 */
import { colors as dsColors, spacing as dsSpacing } from '../design-system';

export const colors = {
  ...dsColors,
  // Legacy aliases mapped to new design-system tokens
  primary: dsColors.primary,
  primaryForeground: dsColors.surface,
  secondary: dsColors.secondary,
  secondaryForeground: dsColors.surface,
  background: dsColors.background,
  surface: dsColors.surface,
  text: dsColors.textPrimary,
  muted: dsColors.textMuted,
  mutedBackground: dsColors.secondaryLight,
  border: dsColors.border,
  danger: dsColors.danger,
  dangerForeground: dsColors.surface,
  success: dsColors.success,
  warning: dsColors.warning,
};

export const spacing = dsSpacing;

export const typography = {
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const theme = {
  colors,
  spacing,
  typography,
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
};
