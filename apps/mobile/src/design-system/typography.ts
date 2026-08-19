import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography: Record<string, TextStyle> = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  h1: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  bodyBold: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },
};
