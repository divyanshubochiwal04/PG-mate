import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../../../theme';

interface RegistrationProgressProps {
  currentStep: number; // 1 to 8
  onSelectStep?: (step: number) => void;
}

const STEPS = [
  { num: 1, label: 'Personal' },
  { num: 2, label: 'Emergency' },
  { num: 3, label: 'Location' },
  { num: 4, label: 'Stay' },
  { num: 5, label: 'Facilities' },
  { num: 6, label: 'Pricing' },
  { num: 7, label: 'Mess' },
  { num: 8, label: 'Review' },
];

export const RegistrationProgress: React.FC<RegistrationProgressProps> = ({
  currentStep,
  onSelectStep,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>
        Step {currentStep} of 8 — {STEPS[currentStep - 1]?.label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {STEPS.map((s) => {
          const isActive = s.num === currentStep;
          const isCompleted = s.num < currentStep;

          return (
            <TouchableOpacity
              key={s.num}
              disabled={!onSelectStep || s.num > currentStep}
              onPress={() => onSelectStep && onSelectStep(s.num)}
              style={[
                styles.stepChip,
                isActive && styles.activeChip,
                isCompleted && styles.completedChip,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Step ${s.num} ${s.label}, ${isActive ? 'current step' : isCompleted ? 'completed' : ''}`}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.activeText,
                  isCompleted && styles.completedText,
                ]}
              >
                {s.num}. {s.label} {isCompleted ? '✓' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  stepChip: {
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.mutedBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  completedChip: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  chipText: {
    fontSize: typography.fontSize.xs - 1,
    color: colors.muted,
  },
  activeText: {
    color: colors.primaryForeground,
    fontWeight: typography.fontWeight.bold,
  },
  completedText: {
    color: colors.success,
    fontWeight: typography.fontWeight.bold,
  },
});
