import React, { useState } from 'react';
import { TextInput as RNTextInput, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  style?: ViewStyle;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType = 'done',
  onSubmitEditing,
  style,
}) => {
  const [isSecureVisible, setIsSecureVisible] = useState(!secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <RNTextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          accessible={true}
          accessibilityLabel={label || placeholder}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsSecureVisible((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>{isSecureVisible ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  toggleButton: {
    padding: spacing.xs,
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
