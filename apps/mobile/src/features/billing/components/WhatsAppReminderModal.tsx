import React, { useState } from 'react';
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
import { Button } from '../../../components/ui/Button';
import { colors, radius, spacing, typography } from '../../../design-system';

export interface WhatsAppReminderData {
  residentName: string;
  residentPhone?: string;
  roomNumber: string;
  bedNumber?: string;
  amountDue: number;
  monthName?: string;
  dueDate?: string;
  ownerUpiId?: string;
  propertyName?: string;
}

interface WhatsAppReminderModalProps {
  visible: boolean;
  data: WhatsAppReminderData | null;
  onClose: () => void;
  onSendInAppNotification?: (title: string, message: string) => void;
}

export function WhatsAppReminderModal({
  visible,
  data,
  onClose,
  onSendInAppNotification,
}: WhatsAppReminderModalProps): React.JSX.Element {
  const [showQrModal, setShowQrModal] = useState(false);
  const [tone, setTone] = useState<'POLITE' | 'URGENT' | 'FINAL'>('POLITE');

  if (!data) return <></>;

  const defaultUpi = data.ownerUpiId || 'paytmqr.msquare@paytm';
  const month = data.monthName || 'Current Month';
  const dueDate = data.dueDate || 'Immediate';
  const property = data.propertyName || 'M Square PG';

  const getMessageText = () => {
    if (tone === 'URGENT') {
      return (
        `⚠️ *URGENT RENT OVERDUE NOTICE*\n\n` +
        `Dear *${data.residentName}* (Room ${data.roomNumber}),\n` +
        `Your rent payment of *₹${data.amountDue.toLocaleString('en-IN')}* for *${month}* is *OVERDUE*.\n\n` +
        `📍 *Property*: ${property}\n` +
        `💰 *Amount Due*: ₹${data.amountDue.toLocaleString('en-IN')}\n` +
        `📅 *Due Date*: ${dueDate}\n\n` +
        `👉 *Pay via UPI*: \`${defaultUpi}\`\n\n` +
        `Please clear your dues today to avoid late fee penalties and stay disruptions. Kindly share the payment screenshot once done.\n\n` +
        `— *${property} Management*`
      );
    }

    if (tone === 'FINAL') {
      return (
        `🚨 *FINAL REMINDER — RENT SETTLEMENT*\n\n` +
        `Dear *${data.residentName}*,\n` +
        `This is a final notice regarding your outstanding balance of *₹${data.amountDue.toLocaleString('en-IN')}* for Room ${data.roomNumber}.\n\n` +
        `Please settle the amount immediately via UPI: *${defaultUpi}*.\n\n` +
        `— *${property} Office*`
      );
    }

    return (
      `Namaste *${data.residentName}* 🙏,\n\n` +
      `This is a friendly reminder from *${property}* that your rent of *₹${data.amountDue.toLocaleString('en-IN')}* for *${month}* is due on *${dueDate}*.\n\n` +
      `🛏️ *Room / Bed*: Room ${data.roomNumber}${data.bedNumber ? ` (Bed ${data.bedNumber})` : ''}\n` +
      `💰 *Total Amount*: ₹${data.amountDue.toLocaleString('en-IN')}\n` +
      `📲 *Pay via UPI*: \`${defaultUpi}\`\n\n` +
      `You can pay directly using Google Pay / PhonePe / Paytm to the UPI ID above. Please share the screenshot once paid.\n\n` +
      `Thank you!\n` +
      `— *${property} Team*`
    );
  };

  const handleLaunchWhatsApp = async () => {
    const text = getMessageText();
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
        // Also trigger in-app notification record if provided
        if (onSendInAppNotification) {
          onSendInAppNotification(
            `Rent Reminder Sent to ${data.residentName}`,
            `Reminder for ₹${data.amountDue.toLocaleString('en-IN')} was dispatched via WhatsApp.`
          );
        }
        onClose();
      } else {
        // Fallback to Native Share Sheet
        await Share.share({ message: text, title: 'Rent Payment Reminder' });
        onClose();
      }
    } catch {
      await Share.share({ message: text, title: 'Rent Payment Reminder' });
      onClose();
    }
  };

  const handleSendInAppOnly = () => {
    if (onSendInAppNotification) {
      onSendInAppNotification(
        `Rent Due: ₹${data.amountDue.toLocaleString('en-IN')}`,
        `Your rent for Room ${data.roomNumber} is due. Please pay to UPI: ${defaultUpi}`
      );
    }
    Alert.alert('In-App Notification Sent', `Reminder alert created for ${data.residentName}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Rent Reminder</Text>
                <Text style={styles.modalSub}>1-Click In-App & WhatsApp dispatch</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Resident Highlight Card */}
            <View style={styles.residentHighlight}>
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightName}>{data.residentName}</Text>
                <Text style={styles.highlightDetails}>
                  Room {data.roomNumber} • {data.residentPhone || 'No phone'}
                </Text>
              </View>
              <View style={styles.amountPill}>
                <Text style={styles.amountPillLabel}>DUE AMOUNT</Text>
                <Text style={styles.amountPillVal}>₹{data.amountDue.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Tone Selector */}
            <Text style={styles.fieldLabel}>MESSAGE TONE / TEMPLATE</Text>
            <View style={styles.toneRow}>
              {[
                { id: 'POLITE', label: '🌸 Friendly Reminder' },
                { id: 'URGENT', label: '⚠️ Overdue Alert' },
                { id: 'FINAL', label: '🚨 Final Notice' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.toneChip, tone === item.id && styles.toneChipActive]}
                  onPress={() => setTone(item.id as any)}
                >
                  <Text style={[styles.toneChipText, tone === item.id && styles.toneChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview Box */}
            <Text style={styles.fieldLabel}>LIVE MESSAGE PREVIEW</Text>
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>{getMessageText()}</Text>
            </View>

            {/* In-Person UPI QR Code Trigger */}
            <TouchableOpacity
              style={styles.qrBanner}
              onPress={() => setShowQrModal(!showQrModal)}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.qrBannerTitle}>In-Person UPI QR Code</Text>
                <Text style={styles.qrBannerSub}>Tap to open scan & pay QR screen</Text>
              </View>
              <Ionicons
                name={showQrModal ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showQrModal && (
              <View style={styles.qrDisplayBox}>
                <View style={styles.qrMockPlaceholder}>
                  <Ionicons name="qr-code" size={140} color="#1E293B" />
                </View>
                <Text style={styles.qrUpiText}>UPI ID: {defaultUpi}</Text>
                <Text style={styles.qrAmountText}>Amount: ₹{data.amountDue.toLocaleString('en-IN')}</Text>
                <Text style={styles.qrHint}>Ask resident to scan using GPay / PhonePe / Paytm</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.inAppBtn}
              onPress={handleSendInAppOnly}
              accessibilityRole="button"
            >
              <Ionicons name="notifications-outline" size={16} color={colors.primary} />
              <Text style={styles.inAppBtnText}>Send In-App Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={handleLaunchWhatsApp}
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
    maxHeight: '90%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
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
  residentHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.mutedBackground,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlightName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  highlightDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountPill: {
    alignItems: 'flex-end',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  amountPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  amountPillVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  toneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  toneChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toneChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toneChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toneChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  previewText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  qrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  qrBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  qrBannerSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  qrDisplayBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  qrMockPlaceholder: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  qrUpiText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  qrAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 2,
  },
  qrHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inAppBtn: {
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
  inAppBtnText: {
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
