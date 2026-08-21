import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CreateTaskDto, TaskPriority } from '@m-square/contracts';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { useOperationalResidents } from '../../residents/hooks/useOperationalResidents';
import { getErrorMessage } from '../../../api/error';
import { colors, radius, spacing, typography } from '../../../design-system';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (dto: CreateTaskDto) => Promise<void>;
  isSubmitting?: boolean;
}

const CATEGORY_PRESETS = [
  '⚡ Electricity / AC',
  '🚰 Plumbing & Water',
  '🧹 Cleaning & Room',
  '💰 Rent & Dues',
  '🍲 Mess & Dining',
  '🔑 Check-In / Out',
  '📋 General Follow-Up',
];

export function CreateTaskModal({
  visible,
  onClose,
  onCreate,
  isSubmitting = false,
}: CreateTaskModalProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDateDays, setDueDateDays] = useState<number | null>(null);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [showResidentPicker, setShowResidentPicker] = useState(false);

  const { data: residentsData } = useOperationalResidents({ page: 1, pageSize: 50 });
  const residents = residentsData?.items || [];

  const handleApplyPreset = (preset: string) => {
    if (!title) {
      setTitle(preset);
    } else {
      setTitle(`${title} — ${preset}`);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a task title.');
      return;
    }

    let dueDateStr: string | undefined = undefined;
    if (dueDateDays !== null) {
      const d = new Date();
      d.setDate(d.getDate() + dueDateDays);
      dueDateStr = d.toISOString();
    }

    const payload: CreateTaskDto = {
      title: title.trim(),
      priority,
    };
    if (description.trim()) {
      payload.description = description.trim();
    }
    if (dueDateStr) {
      payload.dueDate = dueDateStr;
    }
    if (selectedResidentId) {
      payload.residentId = selectedResidentId;
    }

    try {
      await onCreate(payload);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDateDays(null);
      setSelectedResidentId(null);
      onClose();
      Alert.alert('Success', 'Task created successfully.');
    } catch (err: unknown) {
      console.error('🚨 [CreateTaskModal] Error creating task:', err);
      Alert.alert('Error', getErrorMessage(err, 'Failed to create task'));
    }
  };

  const selectedResident = residents.find((r) => r.residentId === selectedResidentId);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="clipboard" size={18} color={colors.primary} />
              </View>
              <Text style={typography.h3}>Create Operational Task</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Category Quick Tags */}
            <Text style={styles.sectionLabel}>Quick Suggestion</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {CATEGORY_PRESETS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(cat)}
                >
                  <Text style={styles.presetText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              label="Task Title *"
              placeholder="e.g. Repair Geyser in Room 204"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              label="Description (Optional)"
              placeholder="Provide context or instructions for staff..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Priority Selector */}
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.priorityGrid}>
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => {
                const isSelected = priority === p;
                const pColor =
                  p === 'CRITICAL'
                    ? colors.danger
                    : p === 'HIGH'
                    ? '#EA580C'
                    : p === 'MEDIUM'
                    ? colors.primary
                    : colors.textSecondary;

                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.pChip,
                      isSelected && { backgroundColor: pColor, borderColor: pColor },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.pChipText, isSelected && { color: '#FFFFFF' }]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Due Date Presets */}
            <Text style={styles.sectionLabel}>Due Date</Text>
            <View style={styles.dueDateGrid}>
              {[
                { label: 'Today', days: 0 },
                { label: 'Tomorrow', days: 1 },
                { label: 'In 3 Days', days: 3 },
                { label: 'In 1 Week', days: 7 },
              ].map((item) => {
                const isSelected = dueDateDays === item.days;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.dueChip, isSelected && styles.dueChipActive]}
                    onPress={() => setDueDateDays(isSelected ? null : item.days)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={13}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text style={[styles.dueChipText, isSelected && styles.dueChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Linked Resident Selector */}
            <Text style={styles.sectionLabel}>Link Resident (Optional)</Text>
            <TouchableOpacity
              style={styles.residentSelectBox}
              onPress={() => setShowResidentPicker(!showResidentPicker)}
            >
              <Ionicons name="person-outline" size={16} color={colors.primary} />
              <Text style={styles.residentSelectText}>
                {selectedResident
                  ? `${selectedResident.fullName} (Room ${selectedResident.roomNumber || 'N/A'})`
                  : 'Select Resident (Optional)'}
              </Text>
              <Ionicons
                name={showResidentPicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showResidentPicker && (
              <View style={styles.residentDropdown}>
                <TouchableOpacity
                  style={styles.residentItem}
                  onPress={() => {
                    setSelectedResidentId(null);
                    setShowResidentPicker(false);
                  }}
                >
                  <Text style={styles.residentItemName}>None (General Task)</Text>
                </TouchableOpacity>
                {residents.map((r) => (
                  <TouchableOpacity
                    key={r.residentId}
                    style={styles.residentItem}
                    onPress={() => {
                      setSelectedResidentId(r.residentId);
                      setShowResidentPicker(false);
                    }}
                  >
                    <Text style={styles.residentItemName}>{r.fullName}</Text>
                    <Text style={styles.residentItemSub}>Room {r.roomNumber || 'N/A'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button
              title="Create Task"
              loading={isSubmitting}
              onPress={handleCreateTask}
              style={{ flex: 1.5 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    marginVertical: spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  pChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  pChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dueDateGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  dueChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dueChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dueChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dueChipTextActive: {
    color: '#FFFFFF',
  },
  residentSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  residentSelectText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  residentDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    maxHeight: 160,
  },
  residentItem: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  residentItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  residentItemSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});
