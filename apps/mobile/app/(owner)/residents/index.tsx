import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import type {
  ResidentBillingStatusFilter,
  ResidentMessStatusFilter,
  ResidentOperationalListItemDto,
  ResidentStayStatusFilter,
} from '@m-square/contracts';
import { Screen } from '../../../src/components/ui/Screen';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { ResidentCard } from '../../../src/features/residents/components/ResidentCard';
import { ResidentOperationalSummaryCards } from '../../../src/features/residents/components/ResidentOperationalSummaryCards';
import { ResidentOperationalFilterModal } from '../../../src/features/residents/components/ResidentOperationalFilterModal';
import { ResidentActionModals } from '../../../src/features/residents/components/ResidentActionModals';
import type { EditResidentFormValues } from '../../../src/features/residents/components/EditResidentModal';
import {
  useOperationalResidents,
  useOperationalSummary,
} from '../../../src/features/residents/hooks/useOperationalResidents';
import { checkOutResidentApi, transferBedApi, updateResidentApi } from '../../../src/features/residents/api/residents.api';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function ResidentsOperationalDashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [stayStatus, setStayStatus] = useState<ResidentStayStatusFilter>('ALL');
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
  const [buildingId, setBuildingId] = useState<string | undefined>(undefined);
  const [floorId, setFloorId] = useState<string | undefined>(undefined);
  const [messStatus, setMessStatus] = useState<ResidentMessStatusFilter>('ALL');
  const [billingStatus, setBillingStatus] = useState<ResidentBillingStatusFilter>('ALL');
  const [page, setPage] = useState(1);

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [transferTarget, setTransferTarget] = useState<ResidentOperationalListItemDto | null>(null);
  const [checkOutTarget, setCheckOutTarget] = useState<ResidentOperationalListItemDto | null>(null);
  const [editTarget, setEditTarget] = useState<ResidentOperationalListItemDto | null>(null);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const { data: summary, isLoading: isLoadingSummary } = useOperationalSummary();

  const {
    data: listData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useOperationalResidents({
    page,
    pageSize: 15,
    search: debouncedSearch || undefined,
    stayStatus,
    propertyId,
    buildingId,
    floorId,
    messStatus,
    billingStatus,
  });

  const residentItems = listData?.items || [];
  const totalPages = listData?.totalPages || 1;

  let activeFilterCount = 0;
  if (stayStatus !== 'ALL') activeFilterCount++;
  if (propertyId) activeFilterCount++;
  if (buildingId) activeFilterCount++;
  if (floorId) activeFilterCount++;
  if (messStatus !== 'ALL') activeFilterCount++;
  if (billingStatus !== 'ALL') activeFilterCount++;

  const handleResetFilters = () => {
    setStayStatus('ALL');
    setPropertyId(undefined);
    setBuildingId(undefined);
    setFloorId(undefined);
    setMessStatus('ALL');
    setBillingStatus('ALL');
    setPage(1);
  };

  const invalidateQueriesPostMutation = (residentId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['residents'] });
    queryClient.invalidateQueries({ queryKey: ['stays'] });
    queryClient.invalidateQueries({ queryKey: ['beds'] });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    queryClient.invalidateQueries({ queryKey: ['building-tree'] });
    queryClient.invalidateQueries({ queryKey: ['building-occupancy'] });
    queryClient.invalidateQueries({ queryKey: ['billing'] });
    queryClient.invalidateQueries({ queryKey: ['mess'] });
    if (residentId) {
      queryClient.invalidateQueries({ queryKey: ['resident', residentId] });
    }
  };

  const handleConfirmTransfer = async (targetBedId: string, notes?: string) => {
    if (!transferTarget || !transferTarget.allocationId) return;
    try {
      setIsTransferring(true);
      await transferBedApi(transferTarget.allocationId, { targetBedId, notes });
      invalidateQueriesPostMutation(transferTarget.residentId);
      setTransferTarget(null);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleConfirmCheckOut = async (dto: { actualCheckoutDate?: string; notes?: string }) => {
    if (!checkOutTarget) return;
    try {
      setIsCheckingOut(true);
      await checkOutResidentApi(checkOutTarget.residentId, dto);
      invalidateQueriesPostMutation(checkOutTarget.residentId);
      setCheckOutTarget(null);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSaveEdit = async (values: EditResidentFormValues) => {
    if (!editTarget) return;
    try {
      setIsSavingEdit(true);
      await updateResidentApi(editTarget.residentId, {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email,
        gender: values.gender,
        emergencyContact: {
          name: values.emergencyName,
          relationship: values.emergencyRelationship,
          phone: values.emergencyPhone,
        },
      });
      invalidateQueriesPostMutation(editTarget.residentId);
      setEditTarget(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.topHeader}>
          <View style={styles.headerTitleGroup}>
            <Text style={typography.h2}>Residents</Text>
            <Text style={styles.subtitle}>Directory, stays and operational management.</Text>
          </View>
          <Button
            title="+ Resident"
            size="small"
            icon={<Ionicons name="person-add-outline" size={16} color={colors.surface} />}
            onPress={() => router.push('/(owner)/residents/register')}
          />
        </View>

        {/* Dashboard Summary Cards */}
        <ResidentOperationalSummaryCards summary={summary} isLoading={isLoadingSummary} />

        {/* Search & Filter Launcher Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <TextInput
              placeholder="Search by name, code, phone..."
              value={searchInput}
              onChangeText={setSearchInput}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
            onPress={() => setFilterModalVisible(true)}
            accessibilityRole="button"
          >
            <Ionicons
              name="funnel-outline"
              size={16}
              color={activeFilterCount > 0 ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <SkeletonLoader height={140} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={140} style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={140} style={{ marginBottom: spacing.sm }} />
          </View>
        ) : isError ? (
          <ErrorState
            title="Couldn't load residents"
            error={error}
            onRetry={refetch}
          />
        ) : residentItems.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Residents Found"
            description={
              debouncedSearch
                ? `No resident records match "${debouncedSearch}".`
                : activeFilterCount > 0
                ? 'No residents match the selected operational filters.'
                : 'No resident records found. Add your first resident to get started.'
            }
            actionTitle={activeFilterCount > 0 ? 'Clear Filters' : '+ Add Resident'}
            onAction={activeFilterCount > 0 ? handleResetFilters : () => router.push('/(owner)/residents/register')}
          />
        ) : (
          <FlatList
            data={residentItems}
            keyExtractor={(item) => item.residentId}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ResidentCard
                item={item}
                onTransfer={(resItem) => setTransferTarget(resItem)}
                onCheckOut={(resItem) => setCheckOutTarget(resItem)}
                onCheckIn={() => router.push('/(owner)/residents/register')}
                onEdit={(resItem) => setEditTarget(resItem)}
              />
            )}
            ListFooterComponent={
              totalPages > 1 ? (
                <View style={styles.paginationRow}>
                  <Button
                    title="← Prev"
                    size="small"
                    disabled={page <= 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    variant="outline"
                  />
                  <Text style={styles.pageText}>
                    Page {page} of {totalPages}
                  </Text>
                  <Button
                    title="Next →"
                    size="small"
                    disabled={page >= totalPages}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                    variant="outline"
                  />
                </View>
              ) : null
            }
          />
        )}

        {/* Filter Sheet Modal */}
        <ResidentOperationalFilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          stayStatus={stayStatus}
          setStayStatus={(val) => {
            setStayStatus(val);
            setPage(1);
          }}
          propertyId={propertyId}
          setPropertyId={(val) => {
            setPropertyId(val);
            setPage(1);
          }}
          buildingId={buildingId}
          setBuildingId={(val) => {
            setBuildingId(val);
            setPage(1);
          }}
          floorId={floorId}
          setFloorId={(val) => {
            setFloorId(val);
            setPage(1);
          }}
          messStatus={messStatus}
          setMessStatus={(val) => {
            setMessStatus(val);
            setPage(1);
          }}
          billingStatus={billingStatus}
          setBillingStatus={(val) => {
            setBillingStatus(val);
            setPage(1);
          }}
          onResetAll={handleResetFilters}
        />

        {/* Action Modals */}
        <ResidentActionModals
          transferTarget={transferTarget}
          onCloseTransfer={() => setTransferTarget(null)}
          onConfirmTransfer={handleConfirmTransfer}
          isTransferring={isTransferring}
          checkOutTarget={checkOutTarget}
          onCloseCheckOut={() => setCheckOutTarget(null)}
          onConfirmCheckOut={handleConfirmCheckOut}
          isCheckingOut={isCheckingOut}
          editTarget={editTarget}
          onCloseEdit={() => setEditTarget(null)}
          onSaveEdit={handleSaveEdit}
          isSavingEdit={isSavingEdit}
        />
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  searchInputWrapper: {
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  filterButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  loadingWrap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: 72,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  pageText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
