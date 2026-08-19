import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateBuildingSetupDataDto, FacilityDto } from '@m-square/contracts';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Loading } from '@/components/ui/Loading';
import { getErrorMessage } from '@/api/error';
import { createBuildingSetupApi } from '@/features/buildings/api/buildings.api';
import { getFacilitiesApi } from '@/features/facilities/api/facilities.api';
import { colors, spacing, typography } from '@/theme';

interface FloorFormConfig {
  name: string;
  floorNumber: number;
  roomCount: number;
  startingRoomNumber: number;
}

export default function BuildingSetupWizardScreen(): React.JSX.Element {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1 State: Building Details
  const [buildingName, setBuildingName] = useState('');
  const [buildingCode, setBuildingCode] = useState('');

  // Step 2 State: Floors Configuration
  const [floorCount, setFloorCount] = useState(4);
  const [floorConfigs, setFloorConfigs] = useState<FloorFormConfig[]>([
    { name: 'Ground Floor', floorNumber: 0, roomCount: 10, startingRoomNumber: 101 },
    { name: '1st Floor', floorNumber: 1, roomCount: 10, startingRoomNumber: 201 },
    { name: '2nd Floor', floorNumber: 2, roomCount: 8, startingRoomNumber: 301 },
    { name: '3rd Floor', floorNumber: 3, roomCount: 8, startingRoomNumber: 401 },
  ]);

  // Step 3 State: Room Defaults
  const [defaultBeds, setDefaultBeds] = useState(2);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);

  // Query Facilities
  const facilitiesQuery = useQuery({
    queryKey: ['facilities'],
    queryFn: () => getFacilitiesApi({ pageSize: 50 }),
  });

  // Step 4 State: Custom Preview Overrides (map of floorNumber -> array of roomNumbers)
  const [customRoomNumbers, setCustomRoomNumbers] = useState<Record<number, string[]>>({});

  // Helper to sync floor count
  const handleFloorCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(20, count));
    setFloorCount(newCount);

    const newConfigs: FloorFormConfig[] = [];
    for (let f = 0; f < newCount; f++) {
      const existing = floorConfigs[f];
      if (existing) {
        newConfigs.push(existing);
      } else {
        const fName =
          f === 0
            ? 'Ground Floor'
            : `${f}${f === 1 ? 'st' : f === 2 ? 'nd' : f === 3 ? 'rd' : 'th'} Floor`;
        const startNo = (f + 1) * 100 + 1;
        newConfigs.push({
          name: fName,
          floorNumber: f,
          roomCount: 10,
          startingRoomNumber: startNo,
        });
      }
    }
    setFloorConfigs(newConfigs);
  };

  // Helper to generate room list per floor
  const getGeneratedRoomsForFloor = (floor: FloorFormConfig): string[] => {
    if (customRoomNumbers[floor.floorNumber]) {
      return customRoomNumbers[floor.floorNumber];
    }
    const rooms: string[] = [];
    for (let r = 0; r < floor.roomCount; r++) {
      rooms.push(String(floor.startingRoomNumber + r));
    }
    return rooms;
  };

  // Setup Mutation
  const setupMutation = useMutation({
    mutationFn: (payload: CreateBuildingSetupDataDto) => createBuildingSetupApi(payload),
    onSuccess: (res) => {
      // Query Invalidation
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['buildings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['building', res.building.id] });
      queryClient.invalidateQueries({ queryKey: ['floors', res.building.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-tree'] });

      Alert.alert(
        'Building Setup Complete!',
        `Successfully created ${res.building.name} with ${res.floorsCount} floors, ${res.roomsCount} rooms, and ${res.bedsCount} beds.`,
        [
          {
            text: 'Open Building Dashboard',
            onPress: () => {
              router.replace(
                `/(owner)/properties/${propertyId}/buildings/${res.building.id}` as `/properties/${string}`
              );
            },
          },
        ]
      );
    },
    onError: (err) => {
      Alert.alert('Setup Failed', getErrorMessage(err, 'Failed to create building setup.'));
      setStep(4);
    },
  });

  const handleSubmit = () => {
    setStep(5);
    const payload: CreateBuildingSetupDataDto = {
      propertyId: propertyId ?? '',
      building: {
        name: buildingName.trim(),
        code: buildingCode.trim().toUpperCase(),
      },
      floors: floorConfigs.map((fc) => ({
        name: fc.name.trim(),
        floorNumber: fc.floorNumber,
        rooms: getGeneratedRoomsForFloor(fc).map((rNo) => ({
          roomNumber: rNo.trim(),
          roomType:
            defaultBeds === 1
              ? 'SINGLE'
              : defaultBeds === 2
                ? 'DOUBLE'
                : defaultBeds === 3
                  ? 'TRIPLE'
                  : 'CUSTOM',
          capacity: defaultBeds,
          facilityIds: selectedFacilityIds,
        })),
      })),
    };

    setupMutation.mutate(payload);
  };

  const toggleFacility = (id: string) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <Screen style={styles.screen}>
      <Header
        title="Building Setup Wizard"
        subtitle={`Step ${step} of 5 — ${getStepTitle(step)}`}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Step Indicator */}
        <View style={styles.stepProgressContainer}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.stepCircle,
                s === step
                  ? styles.stepActive
                  : s < step
                    ? styles.stepCompleted
                    : styles.stepInactive,
              ]}
            >
              <Text
                style={[styles.stepText, s === step || s < step ? styles.stepTextActive : null]}
              >
                {s}
              </Text>
            </View>
          ))}
        </View>

        {/* STEP 1: Building Details */}
        {step === 1 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Step 1: Building Header Details</Text>
            <Text style={styles.cardSubtitle}>
              Enter the name and code for this building/block.
            </Text>

            <TextInput
              label="Building / Block Name *"
              placeholder="e.g. Block A, Tower 1"
              value={buildingName}
              onChangeText={setBuildingName}
            />

            <TextInput
              label="Building Code *"
              placeholder="e.g. BLK-A"
              value={buildingCode}
              onChangeText={(val) => setBuildingCode(val.toUpperCase())}
            />

            <Button
              title="Next: Configure Floors →"
              disabled={!buildingName.trim() || !buildingCode.trim()}
              onPress={() => setStep(2)}
              style={styles.nextBtn}
            />
          </Card>
        )}

        {/* STEP 2: Floor Configurations */}
        {step === 2 && (
          <View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Step 2: Floor & Room Numbers</Text>
              <Text style={styles.cardSubtitle}>
                Configure floors, room counts, and starting room numbers.
              </Text>

              <View style={styles.countSelectorRow}>
                <Text style={styles.label}>Number of Floors:</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleFloorCountChange(floorCount - 1)}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.countValue}>{floorCount}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleFloorCountChange(floorCount + 1)}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>

            {floorConfigs.map((fc, index) => (
              <Card key={index} style={styles.card}>
                <Text style={styles.floorCardTitle}>
                  🧱 {fc.name} (Level {fc.floorNumber})
                </Text>

                <View style={styles.formRow}>
                  <View style={{ flex: 1, marginRight: spacing.xs }}>
                    <TextInput
                      label="Rooms Count"
                      keyboardType="numeric"
                      value={String(fc.roomCount)}
                      onChangeText={(val) => {
                        const num = parseInt(val, 10) || 1;
                        const updated = [...floorConfigs];
                        updated[index].roomCount = num;
                        setFloorConfigs(updated);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.xs }}>
                    <TextInput
                      label="Start Room #"
                      keyboardType="numeric"
                      value={String(fc.startingRoomNumber)}
                      onChangeText={(val) => {
                        const num = parseInt(val, 10) || 101;
                        const updated = [...floorConfigs];
                        updated[index].startingRoomNumber = num;
                        setFloorConfigs(updated);
                      }}
                    />
                  </View>
                </View>
              </Card>
            ))}

            <View style={styles.btnRow}>
              <Button
                title="← Back"
                variant="outline"
                onPress={() => setStep(1)}
                style={styles.halfBtn}
              />
              <Button
                title="Next: Room Defaults →"
                onPress={() => setStep(3)}
                style={styles.halfBtn}
              />
            </View>
          </View>
        )}

        {/* STEP 3: Room Defaults */}
        {step === 3 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Step 3: Default Beds & Facilities</Text>
            <Text style={styles.cardSubtitle}>
              Default beds per room and facilities will be auto-assigned to every generated room.
            </Text>

            <View style={styles.countSelectorRow}>
              <Text style={styles.label}>Default Beds per Room:</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setDefaultBeds(Math.max(1, defaultBeds - 1))}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.countValue}>{defaultBeds}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setDefaultBeds(Math.min(10, defaultBeds + 1))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.label, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
              Default Facilities to Include:
            </Text>

            {facilitiesQuery.isLoading ? (
              <Loading message="Loading facilities..." />
            ) : !facilitiesQuery.data || facilitiesQuery.data.items.length === 0 ? (
              <Text style={styles.mutedText}>No facilities available in organization.</Text>
            ) : (
              <View style={styles.facilitiesGrid}>
                {facilitiesQuery.data.items.map((fac: FacilityDto) => {
                  const isSelected = selectedFacilityIds.includes(fac.id);
                  return (
                    <TouchableOpacity
                      key={fac.id}
                      style={[styles.facilityChip, isSelected ? styles.facilityChipSelected : null]}
                      onPress={() => toggleFacility(fac.id)}
                    >
                      <Text
                        style={[
                          styles.facilityChipText,
                          isSelected ? styles.facilityChipTextSelected : null,
                        ]}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {fac.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.btnRow}>
              <Button
                title="← Back"
                variant="outline"
                onPress={() => setStep(2)}
                style={styles.halfBtn}
              />
              <Button
                title="Next: Final Preview →"
                onPress={() => setStep(4)}
                style={styles.halfBtn}
              />
            </View>
          </Card>
        )}

        {/* STEP 4: Final Hierarchy Preview */}
        {step === 4 && (
          <View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Step 4: Final Hierarchy Preview</Text>
              <Text style={styles.cardSubtitle}>
                Review generated structure before writing to PostgreSQL.
              </Text>

              <View style={styles.summaryBadgeRow}>
                <View style={styles.badgeItem}>
                  <Text style={styles.badgeNumber}>{floorConfigs.length}</Text>
                  <Text style={styles.badgeLabel}>Floors</Text>
                </View>
                <View style={styles.badgeItem}>
                  <Text style={styles.badgeNumber}>
                    {floorConfigs.reduce((sum, fc) => sum + fc.roomCount, 0)}
                  </Text>
                  <Text style={styles.badgeLabel}>Rooms</Text>
                </View>
                <View style={styles.badgeItem}>
                  <Text style={styles.badgeNumber}>
                    {floorConfigs.reduce((sum, fc) => sum + fc.roomCount * defaultBeds, 0)}
                  </Text>
                  <Text style={styles.badgeLabel}>Total Beds</Text>
                </View>
              </View>
            </Card>

            {floorConfigs.map((fc) => {
              const rooms = getGeneratedRoomsForFloor(fc);
              return (
                <Card key={fc.floorNumber} style={styles.card}>
                  <Text style={styles.floorCardTitle}>
                    🧱 {fc.name} ({rooms.length} Rooms)
                  </Text>

                  <View style={styles.roomBadgeContainer}>
                    {rooms.map((rNo, idx) => (
                      <View key={idx} style={styles.roomTag}>
                        <Text style={styles.roomTagText}>
                          Room {rNo} ({defaultBeds} Beds)
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card>
              );
            })}

            <View style={styles.btnRow}>
              <Button
                title="← Back"
                variant="outline"
                onPress={() => setStep(3)}
                style={styles.halfBtn}
              />
              <Button
                title="🚀 Create Building Setup"
                variant="primary"
                onPress={handleSubmit}
                style={styles.halfBtn}
              />
            </View>
          </View>
        )}

        {/* STEP 5: Creation Progress */}
        {step === 5 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Creating Building Hierarchy...</Text>
            <Text style={styles.cardSubtitle}>Executing atomic transaction in PostgreSQL.</Text>

            <Loading message="Writing Building, Floors, Rooms, Beds & Facilities..." />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return 'Building Details';
    case 2:
      return 'Floor Configurations';
    case 3:
      return 'Room Defaults';
    case 4:
      return 'Final Preview';
    case 5:
      return 'Creating';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
  },
  stepProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  stepInactive: {
    borderColor: colors.border,
    backgroundColor: colors.mutedBackground,
  },
  stepText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.muted,
  },
  stepTextActive: {
    color: colors.primaryForeground,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  floorCardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  nextBtn: {
    marginTop: spacing.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  halfBtn: {
    flex: 1,
  },
  countSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
  },
  stepBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mutedBackground,
  },
  stepBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  countValue: {
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  formRow: {
    flexDirection: 'row',
  },
  mutedText: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
    fontStyle: 'italic',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  facilityChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mutedBackground,
  },
  facilityChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  facilityChipText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },
  facilityChipTextSelected: {
    color: colors.primaryForeground,
    fontWeight: typography.fontWeight.bold,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.sm,
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  badgeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.muted,
  },
  roomBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  roomTag: {
    backgroundColor: colors.mutedBackground,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomTagText: {
    fontSize: 11,
    color: colors.text,
  },
});
