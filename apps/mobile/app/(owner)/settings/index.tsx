import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { useAuth } from '../../../src/hooks/useAuth';
import { useOrganization } from '../../../src/features/organization/hooks/useOrganization';
import { getPropertiesApi } from '../../../src/features/properties/api/properties.api';
import { getFacilitiesApi } from '../../../src/features/facilities/api/facilities.api';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function SettingsHubScreen(): React.JSX.Element {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: org } = useOrganization();

  const { data: propertiesData } = useQuery({
    queryKey: ['properties', org?.id],
    queryFn: () => getPropertiesApi({ page: 1, pageSize: 50 }),
    enabled: !!org?.id,
  });

  const { data: facilitiesData } = useQuery({
    queryKey: ['facilities', org?.id],
    queryFn: () => getFacilitiesApi({ page: 1, pageSize: 50 }),
    enabled: !!org?.id,
  });

  const propCount = propertiesData?.items?.length ?? 0;
  const facCount = facilitiesData?.items?.length ?? 0;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Property Owner';

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* User / Org Header Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{fullName}</Text>
              <Text style={styles.userEmail}>{user?.email || 'owner@example.com'}</Text>
              <Text style={styles.orgName}>{org?.name || 'PG.mate Living'}</Text>
            </View>
          </View>
        </Card>

        {/* Operational Modules & Quick Access */}
        <Text style={styles.sectionHeader}>OPERATIONS & MANAGEMENT</Text>

        <TouchableOpacity
          onPress={() => router.push('/(owner)/reports')}
          activeOpacity={0.7}
        >
          <Card style={styles.settingCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.successLight }]}>
              <Ionicons name="bar-chart-outline" size={20} color={colors.success} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Reports & Analytics Hub</Text>
              <Text style={styles.cardSub}>Occupancy, dues, revenue & CSV exports</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(owner)/mess')}
          activeOpacity={0.7}
        >
          <Card style={styles.settingCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="restaurant-outline" size={20} color={colors.warning} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Mess Operations</Text>
              <Text style={styles.cardSub}>Daily meals, kitchen stock, procurement & expenses</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(owner)/config')}
          activeOpacity={0.7}
        >
          <Card style={styles.settingCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Operational Configuration Center</Text>
              <Text style={styles.cardSub}>Global defaults, properties & room hierarchy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Card>
        </TouchableOpacity>

        {/* Business Settings & Inventory */}
        <Text style={styles.sectionHeader}>BUSINESS RULES & CATALOG</Text>

        <TouchableOpacity
          onPress={() => router.push('/(owner)/settings/properties')}
          activeOpacity={0.7}
        >
          <Card style={styles.settingCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="business-outline" size={20} color={colors.info} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Properties & Inventory</Text>
              <Text style={styles.cardSub}>
                {propCount > 0 ? `${propCount} Properties Configured` : 'Manage PG Properties & Details'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(owner)/settings/facilities')}
          activeOpacity={0.7}
        >
          <Card style={styles.settingCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="wifi-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Facilities Catalog</Text>
              <Text style={styles.cardSub}>
                {facCount > 0 ? `${facCount} Catalog Amenities` : 'Wi-Fi, AC, Parking & Mapping'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(owner)/settings/organization')}
          activeOpacity={0.7}
        >
          <Card style={styles.settingCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name="globe-outline" size={20} color={colors.textPrimary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Organization Profile</Text>
              <Text style={styles.cardSub}>
                {org ? `${org.name} • Status: ${org.status}` : 'Organization Identity & Settings'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Card>
        </TouchableOpacity>

        {/* Account & Session */}
        <Text style={styles.sectionHeader}>ACCOUNT & SESSION</Text>

        <TouchableOpacity
          onPress={() => router.push('/(owner)/settings/account')}
          activeOpacity={0.7}
        >
          <Card style={styles.settingCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Account Security & Passwords</Text>
              <Text style={styles.cardSub}>Update credentials & active sessions</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Card>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <Button
          title="Sign Out"
          variant="danger"
          icon={<Ionicons name="log-out-outline" size={16} color={colors.surface} />}
          onPress={logout}
          style={{ marginTop: spacing.md, marginBottom: spacing.xxl }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h2,
    color: colors.surface,
    fontWeight: '800',
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  orgName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  cardSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
