import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getPropertiesApi } from '@/features/properties/api/properties.api';
import { PropertyCard } from '@/features/properties/components/PropertyCard';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { colors, spacing, typography } from '@/theme';

export default function PropertiesListScreen(): React.JSX.Element {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['properties', { page, search }],
    queryFn: () => getPropertiesApi({ page, pageSize: 10, search: search.trim() || undefined }),
  });

  return (
    <Screen>
      <Header title="Properties" subtitle="Manage your physical PG properties" />
      <View style={styles.container}>
        <View style={styles.topActions}>
          <TextInput
            placeholder="Search property by name..."
            value={search}
            onChangeText={(val) => {
              setSearch(val);
              setPage(1);
            }}
            style={styles.searchBar}
          />
          <Button
            title="+ Add Property"
            onPress={() => router.push('/(owner)/properties/create')}
            variant="primary"
          />
        </View>

        {isLoading ? (
          <Loading message="Loading properties..." />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Failed to load properties'}
            onRetry={refetch}
          />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="No Properties Found"
            description={search ? 'No property matched your search.' : 'Add your first property to get started.'}
          />
        ) : (
          <FlatList
            data={data.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PropertyCard
                property={item}
                onPress={() => router.push(`/(owner)/properties/${item.id}` as `/properties/${string}`)}
                onEdit={() => router.push(`/(owner)/properties/${item.id}/edit` as `/properties/${string}`)}
              />
            )}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={
              data.pagination.totalPages > 1 ? (
                <View style={styles.pagination}>
                  <Button
                    title="Previous"
                    variant="outline"
                    disabled={!data.pagination.hasPrevious}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  />
                  <Text style={styles.pageInfo}>
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </Text>
                  <Button
                    title="Next"
                    variant="outline"
                    disabled={!data.pagination.hasNext}
                    onPress={() => setPage((p) => p + 1)}
                  />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  topActions: {
    marginBottom: spacing.sm,
  },
  searchBar: {
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  pageInfo: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
  },
});
