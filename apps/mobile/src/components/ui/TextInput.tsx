import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../design-system';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {Boolean(label) && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          Boolean(error) && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {Boolean(error) ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : Boolean(helperText) ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.smallBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 4,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
