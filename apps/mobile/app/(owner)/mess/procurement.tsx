import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ProcurementCard } from '../../../src/features/mess/components/ProcurementCard';
import {
  useMesses,
  useMessInventory,
  useProcurement,
  useVendors,
} from '../../../src/features/mess/hooks/useMess';
import { getErrorMessage } from '../../../src/api/error';
import { colors, radius, spacing, typography } from '../../../src/design-system';

export default function MessProcurementScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: messes } = useMesses();
  const activeMess = (messes || [])[0];

  const [activeTab, setActiveTab] = useState<'PROCUREMENT' | 'VENDORS'>('PROCUREMENT');
  const [procSearch, setProcSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');

  const { data: vendorData, createVendor } = useVendors(1, 50, vendorSearch.trim() || undefined);
  const { data: procData, createProcurement, isCreating } = useProcurement(
    activeMess?.id,
    1,
    50,
    procSearch.trim() || undefined
  );
  const { data: invData } = useMessInventory(activeMess?.id, 1, 100);

  const vendors = vendorData?.items || [];
  const procurements = procData?.items || [];
  const inventoryItems = invData?.items || [];

  // Vendor Form
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');

  // Procurement Form
  const [showAddProc, setShowAddProc] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [qtyStr, setQtyStr] = useState('10');
  const [unitPriceStr, setUnitPriceStr] = useState('100');
  const [invoiceRefStr, setInvoiceRefStr] = useState('');

  const handleCreateVendor = async () => {
    if (!vendorName.trim()) {
      Alert.alert('Validation Error', 'Vendor Name is required');
      return;
    }
    try {
      await createVendor({
        name: vendorName.trim(),
        phone: vendorPhone.trim() || undefined,
        email: vendorEmail.trim() || undefined,
        address: vendorAddress.trim() || undefined,
      });
      setShowAddVendor(false);
      setVendorName('');
      setVendorPhone('');
      setVendorEmail('');
      setVendorAddress('');
      Alert.alert('Success', 'Vendor catalog entry created');
    } catch (err: unknown) {
      Alert.alert('Creation Failed', getErrorMessage(err, 'Failed to create vendor'));
    }
  };

  const handleCreateProcurement = async () => {
    if (!activeMess || !selectedVendorId || !selectedItemId) {
      Alert.alert('Validation Error', 'Please select Vendor and Kitchen Item');
      return;
    }
    const qty = parseFloat(qtyStr);
    const price = parseFloat(unitPriceStr);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      Alert.alert('Validation Error', 'Valid positive quantity and unit price required');
      return;
    }

    try {
      await createProcurement({
        messId: activeMess.id,
        vendorId: selectedVendorId,
        invoiceReference: invoiceRefStr.trim() || undefined,
        items: [{ inventoryItemId: selectedItemId, quantity: qty, unitPrice: price }],
      });
      setShowAddProc(false);
      setSelectedVendorId(null);
      setSelectedItemId(null);
      setInvoiceRefStr('');
      Alert.alert('Success', 'Procurement recorded and stock updated');
    } catch (err: unknown) {
      Alert.alert('Procurement Failed', getErrorMessage(err, 'Failed to record purchase'));
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h2}>Procurement & Vendors</Text>
          <Text style={styles.subtitle}>Manage kitchen bulk orders, invoices and approved suppliers.</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'PROCUREMENT' && styles.activeTab]}
            onPress={() => setActiveTab('PROCUREMENT')}
            accessibilityRole="button"
          >
            <Ionicons
              name="cart-outline"
              size={16}
              color={activeTab === 'PROCUREMENT' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'PROCUREMENT' && styles.activeTabText]}>
              Orders ({procurements.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'VENDORS' && styles.activeTab]}
            onPress={() => setActiveTab('VENDORS')}
            accessibilityRole="button"
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'VENDORS' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'VENDORS' && styles.activeTabText]}>
              Vendors ({vendors.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'PROCUREMENT' && (
          <View>
            <View style={styles.searchRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  placeholder="Search invoice #, vendor..."
                  value={procSearch}
                  onChangeText={setProcSearch}
                />
              </View>
              <Button
                title="+ Purchase"
                size="small"
                icon={<Ionicons name="add-circle-outline" size={16} color={colors.surface} />}
                onPress={() => setShowAddProc(true)}
              />
            </View>

            {/* Create Procurement Form */}
            {showAddProc && (
              <Card style={styles.formCard}>
                <Text style={typography.h3}>Record Kitchen Purchase Order</Text>

                <Text style={styles.fieldLabel}>Select Supplier / Vendor *</Text>
                <View style={styles.chipRow}>
                  {vendors.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.chip, selectedVendorId === v.id && styles.chipActive]}
                      onPress={() => setSelectedVendorId(v.id)}
                    >
                      <Text style={[styles.chipText, selectedVendorId === v.id && styles.chipTextActive]}>
                        {v.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Select Kitchen Stock Item *</Text>
                <View style={styles.chipRow}>
                  {inventoryItems.map((i) => (
                    <TouchableOpacity
                      key={i.id}
                      style={[styles.chip, selectedItemId === i.id && styles.chipActive]}
                      onPress={() => setSelectedItemId(i.id)}
                    >
                      <Text style={[styles.chipText, selectedItemId === i.id && styles.chipTextActive]}>
                        {i.name} ({i.unit})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput label="Quantity *" value={qtyStr} onChangeText={setQtyStr} keyboardType="numeric" />
                <TextInput label="Unit Price (₹) *" value={unitPriceStr} onChangeText={setUnitPriceStr} keyboardType="numeric" />
                <TextInput label="Vendor Invoice Ref #" placeholder="e.g. INV-9982" value={invoiceRefStr} onChangeText={setInvoiceRefStr} />

                <View style={styles.formActions}>
                  <Button title="Cancel" variant="outline" onPress={() => setShowAddProc(false)} style={{ flex: 1 }} />
                  <Button title="Save Order" loading={isCreating} onPress={handleCreateProcurement} style={{ flex: 1 }} />
                </View>
              </Card>
            )}

            {/* Procurements List */}
            {procurements.length === 0 ? (
              <EmptyState
                icon="cart-outline"
                title="No Purchases Recorded"
                description="Record supplier purchases to update kitchen inventory."
                actionTitle="+ Record Purchase"
                onAction={() => setShowAddProc(true)}
              />
            ) : (
              procurements.map((p) => (
                <ProcurementCard key={p.id} procurement={p} vendors={vendors} />
              ))
            )}
          </View>
        )}

        {activeTab === 'VENDORS' && (
          <View>
            <View style={styles.searchRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  placeholder="Search vendors by name..."
                  value={vendorSearch}
                  onChangeText={setVendorSearch}
                />
              </View>
              <Button
                title="+ Vendor"
                size="small"
                icon={<Ionicons name="person-add-outline" size={16} color={colors.surface} />}
                onPress={() => setShowAddVendor(true)}
              />
            </View>

            {/* Create Vendor Form */}
            {showAddVendor && (
              <Card style={styles.formCard}>
                <Text style={typography.h3}>Add Supplier / Vendor</Text>
                <TextInput label="Vendor / Company Name *" value={vendorName} onChangeText={setVendorName} placeholder="e.g. Sunrise Groceries" />
                <TextInput label="Phone Number" value={vendorPhone} onChangeText={setVendorPhone} placeholder="e.g. +91 9876543210" />
                <TextInput label="Email Address" value={vendorEmail} onChangeText={setVendorEmail} placeholder="e.g. vendor@supplier.com" />
                <TextInput label="Address" value={vendorAddress} onChangeText={setVendorAddress} placeholder="e.g. APMC Market Yard" />
                <View style={styles.formActions}>
                  <Button title="Cancel" variant="outline" onPress={() => setShowAddVendor(false)} style={{ flex: 1 }} />
                  <Button title="Save Vendor" onPress={handleCreateVendor} style={{ flex: 1 }} />
                </View>
              </Card>
            )}

            {/* Vendor List */}
            {vendors.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No Vendors Registered"
                description="Add suppliers to associate with procurement purchase orders."
                actionTitle="+ Add Vendor"
                onAction={() => setShowAddVendor(true)}
              />
            ) : (
              vendors.map((v) => (
                <Card key={v.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={typography.h3}>{v.name}</Text>
                      {Boolean(v.phone) && <Text style={styles.subText}>Phone: {v.phone}</Text>}
                    </View>
                    <StatusBadge status="ACTIVE" label="APPROVED" />
                  </View>
                  {Boolean(v.address) && (
                    <Text style={styles.addressText}>{v.address}</Text>
                  )}
                </Card>
              ))
            )}
          </View>
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
  },
  header: {
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  activeTab: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
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
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  subText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addressText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
