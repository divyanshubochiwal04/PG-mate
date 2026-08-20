import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../../design-system';

export interface RoomOccupantInfo {
  residentId: string;
  residentName: string;
  bedNumber?: string;
  phone?: string;
}

interface ElectricityCalculatorModalProps {
  visible: boolean;
  roomNumber: string;
  occupants: RoomOccupantInfo[];
  propertyName?: string;
  onClose: () => void;
  onApplySplitCharges?: (perResidentAmount: number, units: number, notes: string) => Promise<void>;
  onSendInAppNotification?: (title: string, message: string) => void;
}

export function ElectricityCalculatorModal({
  visible,
  roomNumber,
  occupants = [],
  propertyName = 'PG.mate',
  onClose,
  onApplySplitCharges,
  onSendInAppNotification,
}: ElectricityCalculatorModalProps): React.JSX.Element {
  const [prevReading, setPrevReading] = useState('1200');
  const [currReading, setCurrReading] = useState('1350');
  const [unitRate, setUnitRate] = useState('10'); // Default ₹10 / unit
  const [isApplying, setIsApplying] = useState(false);

  const prev = parseFloat(prevReading) || 0;
  const curr = parseFloat(currReading) || 0;
  const rate = parseFloat(unitRate) || 0;

  const totalUnits = Math.max(0, curr - prev);
  const totalBill = totalUnits * rate;
  const activeCount = occupants.length > 0 ? occupants.length : 1;
  const perResidentShare = Math.round(totalBill / activeCount);

  const getNoticeText = () => {
    return (
      `⚡ *ELECTRICITY SUB-METER BILL NOTICE*\n` +
      `🏢 *${propertyName}* — *Room ${roomNumber}*\n` +
      `--------------------------------\n` +
      `📊 *Previous Reading*: ${prev} kWh\n` +
      `📈 *Current Reading*: ${curr} kWh\n` +
      `⚡ *Units Consumed*: *${totalUnits} Units*\n` +
      `💵 *Rate per Unit*: ₹${rate}/Unit\n` +
      `💰 *Total Room Bill*: *₹${totalBill.toLocaleString('en-IN')}*\n` +
      `👥 *Active Occupants*: ${activeCount} Residents\n` +
      `--------------------------------\n` +
      `👉 *Your Share per Bed*: *₹${perResidentShare.toLocaleString('en-IN')}*\n` +
      `--------------------------------\n` +
      `This amount is added to your current month billing. Kindly clear with your rent.\n\n` +
      `— *${propertyName} Office*`
    );
  };

  const handleApplyCharges = async () => {
    if (totalUnits <= 0 || totalBill <= 0) {
      Alert.alert('Invalid Readings', 'Current reading must be greater than previous reading.');
      return;
    }

    try {
      setIsApplying(true);
      if (onApplySplitCharges) {
        await onApplySplitCharges(
          perResidentShare,
          totalUnits,
          `Electricity: ${totalUnits} Units @ ₹${rate}/unit (Room ${roomNumber})`
        );
      }

      if (onSendInAppNotification) {
        onSendInAppNotification(
          `⚡ Electricity Bill Split: Room ${roomNumber}`,
          `Total ${totalUnits} units (₹${totalBill}). Per bed share: ₹${perResidentShare}.`
        );
      }

      Alert.alert(
        'Electricity Bill Added',
        `₹${perResidentShare} added to billing for ${activeCount} occupants in Room ${roomNumber}.`
      );
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to apply split charges');
    } finally {
      setIsApplying(false);
    }
  };

  const handleShareWhatsApp = async () => {
    const text = getNoticeText();
    try {
      await Share.share({ message: text, title: `Room ${roomNumber} Electricity Bill` });
    } catch {
      // ignore
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="flash" size={20} color="#EAB308" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Electricity Sub-Meter</Text>
                <Text style={styles.modalSub}>Room {roomNumber} • Auto Split Calculator</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Input Form Matrix */}
            <View style={styles.inputsCard}>
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>PREVIOUS READING (kWh)</Text>
                  <NativeTextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={prevReading}
                    onChangeText={setPrevReading}
                    placeholder="0"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>CURRENT READING (kWh)</Text>
                  <NativeTextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={currReading}
                    onChangeText={setCurrReading}
                    placeholder="0"
                  />
                </View>
              </View>

              <View style={{ marginTop: spacing.sm }}>
                <Text style={styles.inputLabel}>UNIT RATE (₹ PER kWh)</Text>
                <NativeTextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={unitRate}
                  onChangeText={setUnitRate}
                  placeholder="10"
                />
              </View>
            </View>

            {/* Live Calculation Results Card */}
            <View style={styles.resultsCard}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>UNITS CONSUMED</Text>
                <Text style={styles.resultValUnits}>{totalUnits} Units</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>TOTAL ROOM BILL</Text>
                <Text style={styles.resultValBill}>₹{totalBill.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Split Distribution Banner */}
            <View style={styles.splitBanner}>
              <View style={styles.splitBannerLeft}>
                <Ionicons name="people" size={24} color="#16A34A" />
                <View>
                  <Text style={styles.splitBannerTitle}>
                    Auto-Divided among {activeCount} {activeCount === 1 ? 'Resident' : 'Residents'}
                  </Text>
                  <Text style={styles.splitBannerSub}>
                    ₹{totalBill.toLocaleString('en-IN')} ÷ {activeCount} beds
                  </Text>
                </View>
              </View>
              <View style={styles.perShareBox}>
                <Text style={styles.perShareLabel}>PER BED</Text>
                <Text style={styles.perShareVal}>₹{perResidentShare}</Text>
              </View>
            </View>

            {/* Room Occupants Breakdown */}
            <Text style={styles.sectionTitle}>ROOM OCCUPANTS ({occupants.length})</Text>
            {occupants.length === 0 ? (
              <Text style={styles.emptyOccupants}>No active occupants detected in this room.</Text>
            ) : (
              occupants.map((occ, idx) => (
                <View key={occ.residentId || idx} style={styles.occupantItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                    <View>
                      <Text style={styles.occName}>{occ.residentName}</Text>
                      <Text style={styles.occBed}>
                        {occ.bedNumber ? `Bed ${occ.bedNumber}` : 'Bed Assigned'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.occShare}>+ ₹{perResidentShare}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareWhatsApp}
              accessibilityRole="button"
            >
              <Ionicons name="logo-whatsapp" size={18} color="#16A34A" />
              <Text style={styles.shareBtnText}>Share Notice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyBtn, isApplying && { opacity: 0.6 }]}
              onPress={handleApplyCharges}
              disabled={isApplying}
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>
                {isApplying ? 'Applying...' : 'Add to Invoices'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  modalSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    maxHeight: 460,
  },
  inputsCard: {
    backgroundColor: colors.mutedBackground,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resultsCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#334155',
  },
  resultLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  resultValUnits: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FACC15',
  },
  resultValBill: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4ADE80',
  },
  splitBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  splitBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  splitBannerSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  perShareBox: {
    alignItems: 'flex-end',
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  perShareLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#DCFCE7',
  },
  perShareVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  emptyOccupants: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    padding: spacing.xs,
  },
  occupantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  occName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  occBed: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  occShare: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    backgroundColor: colors.surface,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  applyBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
