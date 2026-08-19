import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { InvoiceDto } from '@m-square/contracts';
import { colors, radius, spacing, typography } from '../../../design-system';

export interface ReceiptData {
  invoiceId: string;
  invoiceNumber?: string;
  residentName: string;
  residentPhone?: string;
  roomNumber: string;
  bedNumber?: string;
  propertyName?: string;
  periodStart?: string;
  periodEnd?: string;
  lineItems: { description: string; amount: number }[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
}

interface InvoiceReceiptModalProps {
  visible: boolean;
  data: ReceiptData | null;
  onClose: () => void;
  onSendInAppNotification?: (title: string, message: string) => void;
}

export function InvoiceReceiptModal({
  visible,
  data,
  onClose,
  onSendInAppNotification,
}: InvoiceReceiptModalProps): React.JSX.Element {
  if (!data) return <></>;

  const property = data.propertyName || 'M Square PG & Co-Living';
  const invoiceNo = data.invoiceNumber || `INV-${data.invoiceId.slice(0, 8).toUpperCase()}`;
  const dateStr = data.paymentDate || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const getReceiptText = () => {
    return (
      `🧾 *PAYMENT RECEIPT / INVOICE*\n` +
      `🏢 *${property}*\n` +
      `--------------------------------\n` +
      `📄 *Receipt No*: ${invoiceNo}\n` +
      `📅 *Date*: ${dateStr}\n` +
      `👤 *Resident*: ${data.residentName}\n` +
      `🛏️ *Room / Bed*: Room ${data.roomNumber}${data.bedNumber ? ` (Bed ${data.bedNumber})` : ''}\n` +
      `--------------------------------\n` +
      `*BREAKDOWN*:\n` +
      data.lineItems.map((item) => `• ${item.description}: ₹${item.amount.toLocaleString('en-IN')}`).join('\n') +
      `\n--------------------------------\n` +
      `💰 *Total Billed*: ₹${data.totalAmount.toLocaleString('en-IN')}\n` +
      `✅ *Amount Paid*: ₹${data.paidAmount.toLocaleString('en-IN')}\n` +
      `⚠️ *Balance Due*: ₹${data.balanceAmount.toLocaleString('en-IN')}\n` +
      `📌 *Status*: ${data.status}\n` +
      (data.paymentMethod ? `💳 *Mode*: ${data.paymentMethod}\n` : '') +
      `--------------------------------\n` +
      `Thank you for staying with us!\n` +
      `*${property} Management*`
    );
  };

  const handleShareWhatsApp = async () => {
    const text = getReceiptText();
    let phone = data.residentPhone ? data.residentPhone.replace(/[^0-9]/g, '') : '';
    if (phone.length === 10) {
      phone = `91${phone}`;
    }

    const whatsappUrl = phone
      ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
        if (onSendInAppNotification) {
          onSendInAppNotification(
            `Receipt Shared with ${data.residentName}`,
            `Receipt for ₹${data.paidAmount.toLocaleString('en-IN')} was shared via WhatsApp.`
          );
        }
        onClose();
      } else {
        await Share.share({ message: text, title: `Receipt ${invoiceNo}` });
        onClose();
      }
    } catch {
      await Share.share({ message: text, title: `Receipt ${invoiceNo}` });
      onClose();
    }
  };

  const handleNativeShare = async () => {
    const text = getReceiptText();
    await Share.share({ message: text, title: `Receipt ${invoiceNo}` });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="receipt-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Payment Receipt</Text>
                <Text style={styles.modalSub}>{invoiceNo}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Styled Printable Receipt Paper */}
            <View style={styles.receiptPaper}>
              {/* Header inside paper */}
              <View style={styles.paperTop}>
                <Text style={styles.paperBrand}>{property}</Text>
                <Text style={styles.paperTagline}>OFFICIAL RENT & UTILITIES RECEIPT</Text>
                <View style={styles.statusBadgeWrap}>
                  <View
                    style={[
                      styles.statusPill,
                      data.status === 'PAID'
                        ? styles.pillGreen
                        : data.status === 'PARTIAL'
                        ? styles.pillAmber
                        : styles.pillRed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        data.status === 'PAID'
                          ? styles.textGreen
                          : data.status === 'PARTIAL'
                          ? styles.textAmber
                          : styles.textRed,
                      ]}
                    >
                      {data.status === 'PAID' ? '✓ FULLY PAID' : data.status}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.dividerDashed} />

              {/* Meta details */}
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>BILLED TO</Text>
                  <Text style={styles.metaValBold}>{data.residentName}</Text>
                  <Text style={styles.metaValSub}>
                    Room {data.roomNumber} {data.bedNumber ? `• Bed ${data.bedNumber}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabel}>RECEIPT DATE</Text>
                  <Text style={styles.metaVal}>{dateStr}</Text>
                  <Text style={styles.metaValSub}>No: {invoiceNo}</Text>
                </View>
              </View>

              <View style={styles.dividerDashed} />

              {/* Itemized list */}
              <Text style={styles.tableHeader}>CHARGES BREAKDOWN</Text>
              {data.lineItems.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <Text style={styles.itemAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
                </View>
              ))}

              <View style={styles.dividerSolid} />

              {/* Total Calculation */}
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Total Billed Amount</Text>
                <Text style={styles.calcVal}>₹{data.totalAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabelGreen}>Amount Received (Paid)</Text>
                <Text style={styles.calcValGreen}>₹{data.paidAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabelRed}>Remaining Balance</Text>
                <Text style={styles.calcValRed}>₹{data.balanceAmount.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.dividerDashed} />

              {/* Footer inside receipt */}
              <View style={styles.paperFooter}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.thankYouText}>Thank you for choosing our PG!</Text>
                  <Text style={styles.systemGenText}>Digitally generated receipt • M Square</Text>
                </View>
                <View style={styles.signBox}>
                  <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
                  <Text style={styles.signText}>VERIFIED</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleNativeShare}
              accessibilityRole="button"
            >
              <Ionicons name="share-social-outline" size={18} color={colors.primary} />
              <Text style={styles.shareBtnText}>Share / Print</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={handleShareWhatsApp}
              accessibilityRole="button"
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.whatsappBtnText}>Send on WhatsApp</Text>
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
    maxHeight: '92%',
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
    backgroundColor: colors.primaryLight,
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
    maxHeight: 480,
  },
  receiptPaper: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginVertical: spacing.xs,
  },
  paperTop: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  paperBrand: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  paperTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statusBadgeWrap: {
    marginTop: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pillGreen: { backgroundColor: '#DCFCE7' },
  pillAmber: { backgroundColor: '#FEF3C7' },
  pillRed: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  textGreen: { color: '#166534' },
  textAmber: { color: '#B45309' },
  textRed: { color: '#991B1B' },

  dividerDashed: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: spacing.sm,
  },
  dividerSolid: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    marginVertical: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metaValSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tableHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  itemDesc: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  itemAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  calcLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calcLabelGreen: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700',
  },
  calcValGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  calcLabelRed: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '700',
  },
  calcValRed: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  paperFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  thankYouText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  systemGenText: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  signBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  signText: {
    fontSize: 10,
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
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  whatsappBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#16A34A',
  },
  whatsappBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
