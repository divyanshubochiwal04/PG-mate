import React, { useState } from 'react';
import {
  Alert,
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

interface SpecialMenuBroadcastModalProps {
  visible: boolean;
  propertyName?: string;
  onClose: () => void;
  onBroadcastInApp?: (title: string, message: string) => void;
}

export function SpecialMenuBroadcastModal({
  visible,
  propertyName = 'M Square PG',
  onClose,
  onBroadcastInApp,
}: SpecialMenuBroadcastModalProps): React.JSX.Element {
  const [occasion, setOccasion] = useState('👑 Sunday Royal Feast');
  const [mealType, setMealType] = useState<'LUNCH' | 'DINNER' | 'BREAKFAST'>('LUNCH');
  const [timing, setTiming] = useState('1:00 PM – 3:30 PM');
  const [dishesText, setDishesText] = useState(
    '• Shahi Paneer\n• Dal Makhani\n• Jeera Rice & Butter Naan\n• Boondi Raita & Salad\n• Hot Gulab Jamun 🍯'
  );

  const getBroadcastText = () => {
    return (
      `🎉 *SPECIAL MESS ANNOUNCEMENT* 🎉\n` +
      `🏢 *${propertyName} Mess*\n\n` +
      `🌟 *Occasion*: *${occasion}*\n` +
      `🍽️ *Meal*: ${mealType} (${timing})\n\n` +
      `🍲 *SPECIAL MENU*:\n` +
      `${dishesText}\n\n` +
      `✨ All residents are cordially invited to the dining hall. Please enjoy your meal on time!\n\n` +
      `— *${propertyName} Hospitality Team*`
    );
  };

  const handleBroadcastInApp = () => {
    if (onBroadcastInApp) {
      onBroadcastInApp(
        `🎉 ${occasion} (${mealType})`,
        `Special menu today: ${dishesText.replace(/\n/g, ', ')}. Timings: ${timing}.`
      );
    }
    Alert.alert('In-App Notification Broadcasted', `All residents will receive the special menu alert.`);
    onClose();
  };

  const handleShareWhatsApp = async () => {
    const text = getBroadcastText();
    try {
      await Share.share({ message: text, title: `${occasion} Announcement` });
      if (onBroadcastInApp) {
        onBroadcastInApp(
          `🎉 ${occasion} (${mealType})`,
          `Special menu today: ${dishesText.replace(/\n/g, ', ')}. Timings: ${timing}.`
        );
      }
      onClose();
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
                <Ionicons name="sparkles" size={20} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Special Menu Broadcast</Text>
                <Text style={styles.modalSub}>In-App & WhatsApp feast announcements</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Quick Preset Chips */}
            <Text style={styles.fieldLabel}>OCCASION PRESETS</Text>
            <View style={styles.presetsRow}>
              {[
                '👑 Sunday Royal Feast',
                '🍛 Weekend Special Biryani',
                '🪔 Festive Special Dinner',
                '🎉 Welcome Party Menu',
              ].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetChip, occasion === p && styles.presetChipActive]}
                  onPress={() => setOccasion(p)}
                >
                  <Text style={[styles.presetChipText, occasion === p && styles.presetChipTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Meal Type & Timings */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>MEAL TYPE</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {(['BREAKFAST', 'LUNCH', 'DINNER'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.mealChip, mealType === m && styles.mealChipActive]}
                      onPress={() => setMealType(m)}
                    >
                      <Text style={[styles.mealChipText, mealType === m && styles.mealChipTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>TIMINGS</Text>
                <NativeTextInput
                  style={styles.textInput}
                  value={timing}
                  onChangeText={setTiming}
                  placeholder="e.g. 1 PM - 3 PM"
                />
              </View>
            </View>

            {/* Special Dishes List */}
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.fieldLabel}>SPECIAL DISHES (1 PER LINE)</Text>
              <NativeTextInput
                style={[styles.textInput, styles.textArea]}
                multiline
                numberOfLines={5}
                value={dishesText}
                onChangeText={setDishesText}
                placeholder="• Special Dish 1..."
              />
            </View>

            {/* Live Card Preview */}
            <Text style={styles.fieldLabel}>PREVIEW POSTER</Text>
            <View style={styles.posterPreview}>
              <View style={styles.posterHeader}>
                <Ionicons name="restaurant" size={18} color="#EA580C" />
                <Text style={styles.posterTitle}>{occasion}</Text>
              </View>
              <Text style={styles.posterSub}>
                {mealType} • {timing} • {propertyName}
              </Text>
              <View style={styles.posterDivider} />
              <Text style={styles.posterDishes}>{dishesText}</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.inAppBtn}
              onPress={handleBroadcastInApp}
              accessibilityRole="button"
            >
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              <Text style={styles.inAppBtnText}>Send In-App Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={handleShareWhatsApp}
              accessibilityRole="button"
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.whatsappBtnText}>Share on WhatsApp</Text>
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
    backgroundColor: '#FFEDD5',
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
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.mutedBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  mealChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.mutedBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mealChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  mealChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: colors.mutedBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 18,
  },
  posterPreview: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  posterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  posterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9A3412',
  },
  posterSub: {
    fontSize: 11,
    color: '#C2410C',
    marginTop: 2,
    fontWeight: '600',
  },
  posterDivider: {
    height: 1,
    backgroundColor: '#FED7AA',
    marginVertical: spacing.xs + 2,
  },
  posterDishes: {
    fontSize: 12,
    color: '#7C2D12',
    lineHeight: 18,
    fontWeight: '500',
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
