import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
import { MetricCard } from '../../../src/components/ui/MetricCard';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { StockAdjustModal } from '../../../src/features/mess/components/StockAdjustModal';
import { StockLedgerCard } from '../../../src/features/mess/components/StockLedgerCard';
import { GroceryInventoryCard } from '../../../src/features/mess/components/GroceryInventoryCard';
import { useMesses, useMessInventory } from '../../../src/features/mess/hooks/useMess';
import { getErrorMessage } from '../../../src/api/error';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function KitchenInventoryScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: messes } = useMesses();
  const activeMess = (messes || [])[0];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  const { data, createItem, adjustItem } = useMessInventory(
    activeMess?.id,
    1,
    50,
    search.trim() || undefined,
    undefined,
    statusFilter === 'ALL' ? undefined : statusFilter
  );
  const items = data?.items || [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('GRAINS');
  const [unit, setUnit] = useState('kg');
  const [currentStockStr, setCurrentStockStr] = useState('');
  const [minimumStockStr, setMinimumStockStr] = useState('');
  const [reorderLevelStr, setReorderLevelStr] = useState('');

  // Modals
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<any | null>(null);
  const [selectedItemForLedger, setSelectedItemForLedger] = useState<any | null>(null);

  // Summary Counts
  const totalItems = items.length;
  const inStockCount = items.filter((i) => i.status === 'IN_STOCK').length;
  const lowStockCount = items.filter((i) => i.status === 'LOW_STOCK').length;
  const outOfStockCount = items.filter((i) => i.status === 'OUT_OF_STOCK').length;

  const handleCreateItem = async () => {
    if (!activeMess) return;
    if (!name.trim() || !unit.trim()) {
      Alert.alert('Validation Error', 'Item Name and Unit are required');
      return;
    }
    try {
      await createItem({
        messId: activeMess.id,
        name: name.trim(),
        category: category.trim(),
        unit: unit.trim(),
        currentStock: parseFloat(currentStockStr) || 0,
        minimumStock: parseFloat(minimumStockStr) || 0,
        reorderLevel: parseFloat(reorderLevelStr) || 0,
      });
      setShowAddModal(false);
      setName('');
      Alert.alert('Success', 'Inventory item added successfully');
    } catch (err: unknown) {
      Alert.alert('Creation Failed', getErrorMessage(err, 'Failed to add inventory item'));
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h2}>Kitchen Stock & Inventory</Text>
          <Text style={styles.subtitle}>Track raw materials, spoilage and reorder levels.</Text>
        </View>

        {/* Inventory Summary Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard label="Total Items" value={totalItems} color={colors.primary} style={styles.metricCard} />
          <MetricCard label="In Stock" value={inStockCount} color={colors.success} style={styles.metricCard} />
          <MetricCard label="Low Stock" value={lowStockCount} color={colors.warning} style={styles.metricCard} />
          <MetricCard label="Out of Stock" value={outOfStockCount} color={colors.danger} style={styles.metricCard} />
        </View>

        {/* Quick Kitchen & Ration Stock Manager with In-App Alert triggers */}
        <GroceryInventoryCard
          onLowStockAlert={(name, qty, unit) => {
            Alert.alert(
              '⚠️ In-App Low Stock Warning',
              `${name} is running low! Current stock: ${qty} ${unit}. Please restock.`
            );
          }}
        />

        {/* Search & Add Action */}
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <TextInput
              placeholder="Search ingredient or item..."
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Button
            title="+ Item"
            size="small"
            icon={<Ionicons name="add-circle-outline" size={16} color={colors.surface} />}
            onPress={() => setShowAddModal(true)}
          />
        </View>

        {/* Status Filter Chips */}
        <View style={styles.chipRow}>
          {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
                {s.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add Item Form */}
        {showAddModal && (
          <Card style={styles.formCard}>
            <Text style={typography.h3}>Add Kitchen Inventory Item</Text>
            <TextInput label="Item Name *" value={name} onChangeText={setName} placeholder="e.g. Basmati Rice" />
            <TextInput label="Category" value={category} onChangeText={setCategory} placeholder="e.g. GRAINS, DAIRY, VEGETABLES" />
            <TextInput label="Unit *" value={unit} onChangeText={setUnit} placeholder="e.g. kg, litre, pack" />
            <TextInput label="Initial Stock" value={currentStockStr} onChangeText={setCurrentStockStr} keyboardType="numeric" placeholder="e.g. 50" />
            <TextInput label="Reorder Threshold" value={reorderLevelStr} onChangeText={setReorderLevelStr} keyboardType="numeric" placeholder="e.g. 15" />
            <View style={styles.modalBtnRow}>
              <Button title="Cancel" variant="outline" onPress={() => setShowAddModal(false)} style={{ flex: 1 }} />
              <Button title="Save Item" onPress={handleCreateItem} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        {/* Adjust Stock Form Modal Component */}
        {selectedItemForAdjust && activeMess && (
          <StockAdjustModal
            item={selectedItemForAdjust}
            messId={activeMess.id}
            onClose={() => setSelectedItemForAdjust(null)}
            onAdjust={adjustItem}
          />
        )}

        {/* Stock Ledger History Card Component */}
        {selectedItemForLedger && (
          <StockLedgerCard
            item={selectedItemForLedger}
            onClose={() => setSelectedItemForLedger(null)}
          />
        )}

        {/* Inventory Item Cards */}
        {items.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No Inventory Items"
            description="Add kitchen ingredients to track stock and reorder thresholds."
            actionTitle="+ Add Item"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          items.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category || 'General'}</Text>
                </View>
                <StatusBadge status={item.status} label={item.status.replace('_', ' ')} />
              </View>

              <View style={styles.itemStockBox}>
                <View>
                  <Text style={styles.stockLabel}>Current Stock</Text>
                  <Text style={styles.stockValue}>
                    {item.currentStock} {item.unit}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.stockLabel}>Reorder Level</Text>
                  <Text style={styles.stockSub}>
                    {item.reorderLevel} {item.unit}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <Button
                  title="Adjust Stock"
                  size="small"
                  variant="outline"
                  icon={<Ionicons name="swap-vertical-outline" size={14} color={colors.primary} />}
                  onPress={() => setSelectedItemForAdjust(item)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Stock Ledger"
                  size="small"
                  variant="outline"
                  icon={<Ionicons name="list-outline" size={14} color={colors.textSecondary} />}
                  onPress={() => setSelectedItemForLedger(item)}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          ))
        )}

        <Button
          title="Back to Mess Operations"
          variant="outline"
          icon={<Ionicons name="arrow-back-outline" size={16} color={colors.primary} />}
          onPress={() => router.back()}
          style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
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
    paddingBottom: 64,
  },
  header: {
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  metricCard: {
    minWidth: '47%',
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  itemCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  itemStockBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginVertical: spacing.xs,
  },
  stockLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stockValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  stockSub: {
    ...typography.smallBold,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
