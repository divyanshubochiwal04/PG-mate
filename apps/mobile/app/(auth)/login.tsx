import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { TextInput } from '../../src/components/ui/TextInput';
import { normalizeApiError } from '../../src/api/error';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function LoginScreen(): React.JSX.Element {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (): Promise<void> => {
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
      router.replace('/(owner)');
    } catch (err: unknown) {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen style={styles.content}>
      <View style={styles.headerSection}>
        <Text style={styles.brandTitle}>M SQUARE</Text>
        <Text style={styles.subtitle}>PG Owner Portal</Text>
      </View>

      <View style={styles.formSection}>
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <TextInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="owner@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={true}
          returnKeyType="done"
          onSubmitEditing={() => void handleLogin()}
        />

        <Button
          title="Sign In"
          onPress={() => void handleLogin()}
          isLoading={isSubmitting}
          style={styles.submitButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  formSection: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
