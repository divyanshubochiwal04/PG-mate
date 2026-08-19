import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { TextInput } from '../../src/components/ui/TextInput';
import { getApiBaseUrl, setCustomApiBaseUrl } from '../../src/config/env';
import { normalizeApiError } from '../../src/api/error';
import { colors, radius, spacing, typography } from '../../src/design-system';

export default function LoginScreen(): React.JSX.Element {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Server IP config state
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [tempServerInput, setTempServerInput] = useState(getApiBaseUrl());

  const handleSaveServer = () => {
    let clean = tempServerInput.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    if (!clean.endsWith('/api/v1')) {
      clean = clean.replace(/\/$/, '') + '/api/v1';
    }
    setCustomApiBaseUrl(clean);
    setServerUrl(clean);
    setServerModalVisible(false);
    Alert.alert('Server Connected', `API endpoint updated to: ${clean}`);
  };

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
        <View style={styles.iconCircle}>
          <Ionicons name="business" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.brandTitle}>M SQUARE</Text>
        <Text style={styles.subtitle}>PG Owner & Management Portal</Text>
      </View>

      <View style={styles.formSection}>
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
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
          loading={isSubmitting}
          style={styles.submitButton}
        />

        {/* Register New Owner SaaS Button */}
        <View style={styles.registerDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push('/(auth)/register')}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.registerBtnText}>Register New PG / Hostel Account</Text>
        </TouchableOpacity>

        {/* Server Connection Settings Pill */}
        <TouchableOpacity
          style={styles.serverPill}
          onPress={() => {
            setTempServerInput(serverUrl);
            setServerModalVisible(true);
          }}
        >
          <Ionicons name="wifi-outline" size={13} color={colors.primary} />
          <Text style={styles.serverPillText} numberOfLines={1}>
            Server: {serverUrl}
          </Text>
          <Ionicons name="pencil" size={12} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.saasNote}>
          🔒 Each PG owner gets an isolated, private workspace.
        </Text>
      </View>

      {/* Server IP Config Modal */}
      <Modal visible={serverModalVisible} transparent animationType="fade">
        <View style={styles.serverModalOverlay}>
          <View style={styles.serverModalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs }}>
              <Ionicons name="server" size={20} color={colors.primary} />
              <Text style={typography.h3}>Backend Server URL</Text>
            </View>
            <Text style={styles.serverHint}>
              Enter your backend API endpoint (e.g. laptop IP or ngrok tunnel):
            </Text>
            <TextInput
              value={tempServerInput}
              onChangeText={setTempServerInput}
              placeholder="http://10.87.2.159:3000/api/v1"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ marginVertical: spacing.sm }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setServerModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save & Connect"
                onPress={handleSaveServer}
                style={{ flex: 1.2 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: spacing.xl,
    alignItems: 'center',
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
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  formSection: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  registerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  registerBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  saasNote: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
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
    marginTop: spacing.sm,
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
