import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../src/components/ui/Screen';
import { TextInput } from '../../src/components/ui/TextInput';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { getResidentsApi } from '../../src/features/residents/api/residents.api';
import { colors, radius, spacing, typography } from '../../src/design-system';

export default function GlobalSearchScreen(): React.JSX.Element {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<
    'ALL' | 'RESIDENT' | 'ROOM' | 'BED' | 'PROPERTY'
  >('ALL');

  const { data: residentsData, isLoading } = useQuery({
    queryKey: ['search', 'residents', query],
    queryFn: () => (query.trim() ? getResidentsApi({ search: query, pageSize: 20 }) : null),
    enabled: query.trim().length > 0,
  });

  const matchingResidents = residentsData?.items || [];

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={typography.h2}>Global Search</Text>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search resident name, phone, room #, code..."
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
            {(['ALL', 'RESIDENT', 'ROOM', 'BED', 'PROPERTY'] as const).map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.chip, selectedEntity === e && styles.chipActive]}
                onPress={() => setSelectedEntity(e)}
              >
                <Text style={[styles.chipText, selectedEntity === e && styles.chipTextActive]}>
                  {e}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {query.trim().length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="Instant Operational Search"
            description="Type a resident name, phone number, room or bed code to look up operational records."
          />
        ) : isLoading ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={80} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={80} style={{ marginBottom: spacing.sm }} />
          </View>
        ) : matchingResidents.length === 0 ? (
          <EmptyState
            icon="alert-circle-outline"
            title="No Results Found"
            description={`No operational records matching "${query}".`}
          />
        ) : (
          <FlatList
            data={matchingResidents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/(owner)/residents/${item.id}` as never)}
                activeOpacity={0.7}
              >
                <Card style={styles.resultCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <Text style={styles.resultName}>{item.firstName} {item.lastName}</Text>
                      <Text style={styles.resultCode}>
                        Code: {item.residentCode} • Phone: {item.phone}
                      </Text>
                    </View>
                    <StatusBadge status={item.status} label={item.status} />
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    marginVertical: spacing.xs,
  },
  filterRow: {
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  loadingWrap: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  resultCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  resultCode: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
