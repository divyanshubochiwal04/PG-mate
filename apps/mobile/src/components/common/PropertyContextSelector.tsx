import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePropertyContext } from '../../context/property-context';
import { colors, spacing, typography } from '../../theme';

export const PropertyContextSelector: React.FC = () => {
  const {
    selectedProperty,
    selectedPropertyId,
    setSelectedPropertyId,
    properties,
    isLoading,
    refetchProperties,
  } = usePropertyContext();
  const [modalVisible, setModalVisible] = useState(false);

  const displayLabel = selectedProperty ? selectedProperty.name : 'All Properties';

  return (
    <View>
      <TouchableOpacity
        style={styles.selectorPill}
        onPress={() => {
          refetchProperties();
          setModalVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Selected Property: ${displayLabel}. Double tap to change.`}
      >
        <Text style={styles.selectorText} numberOfLines={1}>
          🏢 {displayLabel} ▾
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Operating Property</Text>
            <Text style={styles.modalSubtitle}>
              Filter occupancy, residents, and mess operations by property.
            </Text>

            <TouchableOpacity
              style={[styles.optionItem, selectedPropertyId === null && styles.optionSelected]}
              onPress={() => {
                setSelectedPropertyId(null);
                setModalVisible(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Select All Properties"
            >
              <Text
                style={[
                  styles.optionText,
                  selectedPropertyId === null && styles.optionTextSelected,
                ]}
              >
                🏢 All Properties (Global View)
              </Text>
              {selectedPropertyId === null && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            {isLoading ? (
              <View style={styles.loadingBox}>
                <Text style={styles.loadingText}>Loading properties...</Text>
              </View>
            ) : properties.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No properties available.</Text>
              </View>
            ) : (
              <FlatList
                data={properties}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = item.id === selectedPropertyId;
                  return (
                    <TouchableOpacity
                      style={[styles.optionItem, isSelected && styles.optionSelected]}
                      onPress={() => {
                        setSelectedPropertyId(item.id);
                        setModalVisible(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Select property ${item.name}`}
                    >
                      <View style={styles.itemInfo}>
                        <Text
                          style={[styles.optionText, isSelected && styles.optionTextSelected]}
                          numberOfLines={1}
                        >
                          📍 {item.name}
                        </Text>
                        <Text style={styles.itemSubtext}>Code: {item.code}</Text>
                      </View>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close selector"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorPill: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.mutedBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    maxWidth: 180,
  },
  selectorText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.md,
    marginTop: 2,
  },
  optionItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.mutedBackground,
  },
  optionText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  optionTextSelected: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  checkmark: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  loadingBox: {
    padding: spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.muted,
  },
  emptyBox: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
  },
  closeButton: {
    minHeight: 48,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeButtonText: {
    color: colors.primaryForeground,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.md,
  },
});
