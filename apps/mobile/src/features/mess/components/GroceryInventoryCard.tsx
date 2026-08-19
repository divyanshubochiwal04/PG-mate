import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../../design-system';

export interface GroceryStockItem {
  id: string;
  name: string;
  category: string;
  currentQty: number;
  minThreshold: number;
  unit: string;
  lastRestocked?: string;
}

interface GroceryInventoryCardProps {
  initialItems?: GroceryStockItem[];
  onLowStockAlert?: (itemName: string, currentQty: number, unit: string) => void;
}

export function GroceryInventoryCard({
  initialItems,
  onLowStockAlert,
}: GroceryInventoryCardProps): React.JSX.Element {
  const [items, setItems] = useState<GroceryStockItem[]>(
    initialItems || [
      {
        id: '1',
        name: 'Wheat Aata (Flour)',
        category: 'GRAINS',
        currentQty: 45,
        minThreshold: 20,
        unit: 'Kg',
        lastRestocked: '12 Aug',
      },
      {
        id: '2',
        name: 'Basmati Rice',
        category: 'GRAINS',
        currentQty: 12,
        minThreshold: 25,
        unit: 'Kg',
        lastRestocked: '08 Aug',
      },
      {
        id: '3',
        name: 'Mustard Cooking Oil',
        category: 'OILS',
        currentQty: 5,
        minThreshold: 10,
        unit: 'Litre',
        lastRestocked: '05 Aug',
      },
      {
        id: '4',
        name: 'Commercial LPG Cylinder',
        category: 'FUEL',
        currentQty: 1,
        minThreshold: 2,
        unit: 'Cylinder',
        lastRestocked: '01 Aug',
      },
      {
        id: '5',
        name: 'Fresh Paneer / Dairy',
        category: 'DAIRY',
        currentQty: 8,
        minThreshold: 4,
        unit: 'Kg',
        lastRestocked: 'Today',
      },
    ]
  );

  const [activeItemForAdjust, setActiveItemForAdjust] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('5');

  const handleAdjust = (itemId: string, type: 'ADD' | 'SUB') => {
    const qty = parseFloat(adjustAmount) || 0;
    if (qty <= 0) return;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const newQty = type === 'ADD' ? it.currentQty + qty : Math.max(0, it.currentQty - qty);

        // Check for low stock trigger
        if (newQty <= it.minThreshold && onLowStockAlert) {
          onLowStockAlert(it.name, newQty, it.unit);
        }

        return { ...it, currentQty: newQty };
      })
    );

    setActiveItemForAdjust(null);
    setAdjustAmount('5');
  };

  const lowStockCount = items.filter((it) => it.currentQty <= it.minThreshold).length;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="cart" size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>Kitchen & Ration Stock</Text>
        </View>

        {lowStockCount > 0 && (
          <View style={styles.alertPill}>
            <Ionicons name="warning" size={12} color="#991B1B" />
            <Text style={styles.alertPillText}>{lowStockCount} Low Stock</Text>
          </View>
        )}
      </View>

      {/* Stock Items List */}
      <View style={styles.itemsList}>
        {items.map((item) => {
          const isLow = item.currentQty <= item.minThreshold;
          const isAdjusting = activeItemForAdjust === item.id;

          return (
            <View key={item.id} style={[styles.stockRow, isLow && styles.stockRowLow]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {isLow && (
                    <View style={styles.lowBadge}>
                      <Text style={styles.lowBadgeText}>⚠️ RESTOCK NEEDED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.itemMeta}>
                  Min Alert: {item.minThreshold} {item.unit} • Last restocked {item.lastRestocked}
                </Text>
              </View>

              {/* Qty & Actions */}
              <View style={styles.rightActions}>
                <View style={[styles.qtyBox, isLow ? styles.qtyBoxRed : styles.qtyBoxGreen]}>
                  <Text style={[styles.qtyNum, isLow ? styles.textRed : styles.textGreen]}>
                    {item.currentQty}
                  </Text>
                  <Text style={[styles.qtyUnit, isLow ? styles.textRed : styles.textGreen]}>
                    {item.unit}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => setActiveItemForAdjust(isAdjusting ? null : item.id)}
                >
                  <Ionicons
                    name={isAdjusting ? 'close-circle' : 'create-outline'}
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* Expandable Adjust Box */}
              {isAdjusting && (
                <View style={styles.adjustTray}>
                  <Text style={styles.adjustLabel}>QUICK UPDATE ({item.unit}):</Text>
                  <TextInput
                    style={styles.adjustInput}
                    keyboardType="numeric"
                    value={adjustAmount}
                    onChangeText={setAdjustAmount}
                  />
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAdjust(item.id, 'ADD')}
                  >
                    <Text style={styles.btnText}>+ Restock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.subBtn}
                    onPress={() => handleAdjust(item.id, 'SUB')}
                  >
                    <Text style={styles.btnText}>- Used</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  alertPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
  },
  itemsList: {
    gap: 8,
  },
  stockRow: {
    backgroundColor: colors.mutedBackground,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stockRowLow: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  lowBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  qtyBoxGreen: { backgroundColor: '#DCFCE7' },
  qtyBoxRed: { backgroundColor: '#FEE2E2' },
  qtyNum: { fontSize: 14, fontWeight: '800' },
  qtyUnit: { fontSize: 10, fontWeight: '700' },
  textGreen: { color: '#166534' },
  textRed: { color: '#DC2626' },
  quickBtn: {
    padding: 4,
  },
  adjustTray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  adjustLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  adjustInput: {
    width: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  subBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
