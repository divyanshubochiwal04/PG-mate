import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { TextInput } from '../../src/components/ui/TextInput';
import { getApiBaseUrl, setCustomApiBaseUrl } from '../../src/config/env';
import { normalizeApiError } from '../../src/api/error';
import { colors, radius, spacing, typography } from '../../src/design-system';

export default function RegisterScreen(): React.JSX.Element {
  const { register } = useAuth();
  const router = useRouter();

  const [pgName, setPgName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (): Promise<void> => {
    setErrorMessage(null);

    if (!pgName.trim()) {
      setErrorMessage('Please enter your PG / Hostel Name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(email.trim(), password);
      Alert.alert(
        '🎉 Welcome to PG.mate!',
        `Your new PG workspace "${pgName}" has been successfully provisioned.`,
        [
          {
            text: 'Go to Dashboard',
            onPress: () => router.replace('/(owner)'),
          },
        ]
      );
    } catch (err: unknown) {
      const normalized = normalizeApiError(err);
      setErrorMessage(normalized.message || 'Registration failed. Email may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header & Branding */}
          <View style={styles.headerSection}>
            <View style={styles.iconCircle}>
              <Ionicons name="business" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>PG.MATE</Text>
            <Text style={styles.subtitle}>Register New PG / Hostel Account</Text>
            <Text style={styles.caption}>
              100% Isolated SaaS Workspace with custom rooms, billing & mess management.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <TextInput
              label="PG / Hostel Business Name *"
              placeholder="e.g. Royal Palace Boys PG"
              value={pgName}
              onChangeText={setPgName}
              autoCapitalize="words"
            />

            <TextInput
              label="Owner Full Name"
              placeholder="e.g. Rajesh Sharma"
              value={ownerName}
              onChangeText={setOwnerName}
              autoCapitalize="words"
            />

            <TextInput
              label="Owner Email Address *"
              placeholder="e.g. owner@royalpalace.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Contact Phone Number"
              placeholder="e.g. 9876543210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TextInput
              label="Create Password (Min 8 chars) *"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              label="Confirm Password *"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* SaaS Isolation Benefit Pill */}
            <View style={styles.benefitPill}>
              <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
              <Text style={styles.benefitText}>
                Your data is strictly private & isolated under your own Organization ID.
              </Text>
            </View>

            <Button
              title="Create My PG Account 🚀"
              loading={isSubmitting}
              onPress={handleRegister}
              style={styles.submitBtn}
            />

            {/* Link back to login */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.loginLink}>Login Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
    marginTop: 4,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    flex: 1,
  },
  benefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginVertical: spacing.xs,
  },
  benefitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loginLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    marginTop: spacing.xs,
  },
  serverPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    maxWidth: 220,
  },
  serverModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  serverModalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  serverHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
