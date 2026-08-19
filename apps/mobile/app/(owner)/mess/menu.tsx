import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { TextInput } from '../../../src/components/ui/TextInput';
import { GlobalHeader } from '../../../src/components/common/GlobalHeader';
import { useMealTypes, useMesses } from '../../../src/features/mess/hooks/useMess';
import { upsertMenuApi } from '../../../src/features/mess/api/mess.api';
import { SpecialMenuBroadcastModal } from '../../../src/features/mess/components/SpecialMenuBroadcastModal';
import { getErrorMessage } from '../../../src/api/error';
import { colors, radius, spacing, typography } from '../../../src/design-system';

// ── Types ──
export interface MealBlockData {
  items: string[];
  notes?: string;
  isSpecial?: boolean;
}

export interface DayWeeklyMenu {
  date: string; // YYYY-MM-DD
  dayName: string; // Monday, Tuesday...
  dayShort: string; // Mon, Tue...
  isToday: boolean;
  meals: Record<string, MealBlockData>; // mealTypeId -> MealBlockData
}

// ── Quick Presets by Category ──
const DISH_PRESETS = [
  'Paneer Butter Masala',
  'Dal Makhani',
  'Dal Tadka',
  'Roti / Phulka',
  'Butter Naan',
  'Puri',
  'Jeera Rice',
  'Veg Pulao',
  'Veg Biryani',
  'Chole Bhature',
  'Rajma Chawal',
  'Aloo Paratha',
  'Idli Sambar',
  'Masala Dosa',
  'Poha',
  'Upma',
  'Puri Bhaji',
  'Pav Bhaji',
  'Samosa',
  'Bread Pakoda',
  'Chai / Tea',
  'Coffee',
  'Gulab Jamun',
  'Kheer',
  'Suji Halwa',
  'Rasgulla',
  'Salad & Raita',
  'Papad & Pickle',
];

// ── Default Sample Full Week Timetable ──
const DEFAULT_WEEK_MENU_TEMPLATE: Record<string, Record<string, MealBlockData>> = {
  Mon: {
    BREAKFAST: { items: ['Poha', 'Boiled Eggs / Sprouts', 'Chai'], notes: 'Healthy start' },
    LUNCH: { items: ['Rajma Masala', 'Steamed Rice', 'Tawa Roti', 'Boondi Raita', 'Salad'] },
    SNACKS: { items: ['Biscuits / Rusk', 'Masala Tea'] },
    DINNER: { items: ['Aloo Gobi Matar', 'Dal Tadka', 'Phulka Roti', 'Jeera Rice'] },
  },
  Tue: {
    BREAKFAST: { items: ['Idli Sambar', 'Coconut Chutney', 'Filter Coffee'] },
    LUNCH: { items: ['Kadhi Pakoda', 'Steamed Rice', 'Phulka Roti', 'Aloo Bhujia'] },
    SNACKS: { items: ['Veg Puffs', 'Tea'] },
    DINNER: {
      items: ['Shahi Paneer', 'Butter Roti', 'Dal Makhani', 'Pulao', 'Gulab Jamun'],
      isSpecial: true,
      notes: 'Paneer Feast Tuesday',
    },
  },
  Wed: {
    BREAKFAST: { items: ['Methi Paratha', 'Curd', 'Mango Pickle', 'Chai'] },
    LUNCH: { items: ['Chole Masala', 'Bhature / Roti', 'Jeera Rice', 'Onion Salad'] },
    SNACKS: { items: ['Sweet Corn', 'Masala Tea'] },
    DINNER: { items: ['Mix Veg Curry', 'Yellow Moong Dal', 'Roti', 'Steamed Rice'] },
  },
  Thu: {
    BREAKFAST: { items: ['Upma & Coconut Chutney', 'Banana', 'Chai'] },
    LUNCH: { items: ['Dal Palak', 'Jeera Aloo', 'Tawa Roti', 'Rice', 'Cucumber Raita'] },
    SNACKS: { items: ['Bread Pakoda', 'Mint Chutney', 'Chai'] },
    DINNER: { items: ['Paneer Do Pyaza', 'Phulka Roti', 'Rice', 'Rice Kheer'], notes: 'Kheer Night' },
  },
  Fri: {
    BREAKFAST: { items: ['Aloo Paratha', 'Amul Butter', 'Pickle', 'Tea'] },
    LUNCH: { items: ['Dum Veg Biryani', 'Mirchi Ka Salan', 'Veg Raita', 'Papad'] },
    SNACKS: { items: ['Samosa', 'Chai'] },
    DINNER: { items: ['Matar Paneer', 'Tawa Roti', 'Dal Fry', 'Jeera Rice'] },
  },
  Sat: {
    BREAKFAST: { items: ['Puri Bhaji', 'Suji Halwa', 'Chai'] },
    LUNCH: { items: ['Dal Baati Churma', 'Gatta Curry', 'Papad', 'Pickle'], isSpecial: true },
    SNACKS: { items: ['Poha Cutlet', 'Chai'] },
    DINNER: { items: ['Pav Bhaji', 'Butter Pav', 'Tawa Pulao', 'Ice Cream'] },
  },
  Sun: {
    BREAKFAST: { items: ['Masala Dosa', 'Sambar', 'Coconut Chutney', 'Filter Coffee'], isSpecial: true },
    LUNCH: {
      items: ['Paneer Butter Masala', 'Butter Naan / Puri', 'Dal Makhani', 'Kashmiri Pulao', 'Rasgulla'],
      isSpecial: true,
      notes: '⭐ Alt Weeks: Week 1 Paneer Butter Masala / Week 2 Shahi Kheer & Puri',
    },
    SNACKS: { items: ['Cookies & Chai'] },
    DINNER: { items: ['Chinese Fried Rice', 'Veg Manchurian', 'Soup'], notes: 'Light Indo-Chinese' },
  },
};

const DEFAULT_MEAL_SESSIONS = [
  { id: 'BREAKFAST', name: 'Breakfast', startTime: '07:30', endTime: '09:30', icon: 'sunny-outline', color: '#F59E0B' },
  { id: 'LUNCH', name: 'Lunch', startTime: '12:30', endTime: '14:30', icon: 'restaurant-outline', color: '#10B981' },
  { id: 'SNACKS', name: 'Evening Snacks', startTime: '17:00', endTime: '18:30', icon: 'cafe-outline', color: '#8B5CF6' },
  { id: 'DINNER', name: 'Dinner', startTime: '20:00', endTime: '22:00', icon: 'moon-outline', color: '#3B82F6' },
];

export default function MenuManagementScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: messes } = useMesses();
  const activeMess = (messes || [])[0];
  const { data: configuredMealTypes } = useMealTypes(activeMess?.id);

  // Active Meal Sessions List
  const mealSessions = useMemo(() => {
    if (configuredMealTypes && configuredMealTypes.length > 0) {
      return configuredMealTypes.map((mt, idx) => ({
        id: mt.id,
        name: mt.name,
        startTime: mt.startTime,
        endTime: mt.endTime,
        icon: idx === 0 ? 'sunny-outline' : idx === 1 ? 'restaurant-outline' : idx === 2 ? 'cafe-outline' : 'moon-outline',
        color: idx === 0 ? '#F59E0B' : idx === 1 ? '#10B981' : idx === 2 ? '#8B5CF6' : '#3B82F6',
      }));
    }
    return DEFAULT_MEAL_SESSIONS;
  }, [configuredMealTypes]);

  // Week offset state (0 = current week, -1 = prev, +1 = next)
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'GRID' | 'DAY_LIST'>('GRID');
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Full Weekly Schedule Store: dayShort -> Record<mealTypeId, MealBlockData>
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, Record<string, MealBlockData>>>(
    DEFAULT_WEEK_MENU_TEMPLATE
  );

  // Edit Modal State
  const [editingCell, setEditingCell] = useState<{
    dayShort: string;
    dayName: string;
    dateStr: string;
    mealSession: { id: string; name: string; startTime: string; endTime: string; color: string };
    data: MealBlockData;
  } | null>(null);

  const [dishInput, setDishInput] = useState('');
  const [tempItems, setTempItems] = useState<string[]>([]);
  const [tempNotes, setTempNotes] = useState('');
  const [tempIsSpecial, setTempIsSpecial] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [specialMenuModalVisible, setSpecialMenuModalVisible] = useState(false);

  // Calculate Dates for the 7 days of the selected week (Monday to Sunday)
  const weekDays: DayWeeklyMenu[] = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon ...
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + weekOffset * 7);

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayShorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return dayNames.map((dName, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isToday = d.toDateString() === today.toDateString();

      const dayShort = dayShorts[i];
      const meals = weeklySchedule[dayShort] || {};

      return {
        date: dateStr,
        dayName: dName,
        dayShort,
        isToday,
        meals,
      };
    });
  }, [weekOffset, weeklySchedule]);

  // Open Edit Modal for a cell
  const handleOpenBlockEdit = (
    day: DayWeeklyMenu,
    session: { id: string; name: string; startTime: string; endTime: string; color: string }
  ) => {
    const currentData = day.meals[session.id] || { items: [], notes: '', isSpecial: false };
    setTempItems([...(currentData.items || [])]);
    setTempNotes(currentData.notes || '');
    setTempIsSpecial(!!currentData.isSpecial);
    setDishInput('');

    setEditingCell({
      dayShort: day.dayShort,
      dayName: day.dayName,
      dateStr: day.date,
      mealSession: session,
      data: currentData,
    });
  };

  const handleAddDish = (dish: string) => {
    const trimmed = dish.trim();
    if (!trimmed) return;
    if (!tempItems.includes(trimmed)) {
      setTempItems([...tempItems, trimmed]);
    }
    setDishInput('');
  };

  const handleRemoveDish = (index: number) => {
    setTempItems(tempItems.filter((_, idx) => idx !== index));
  };

  // Save Modal Changes
  const handleSaveModal = async (scope: 'SINGLE' | 'WEEKDAYS' | 'WEEKEND') => {
    if (!editingCell) return;

    const newBlockData: MealBlockData = {
      items: tempItems,
      notes: tempNotes.trim() || undefined,
      isSpecial: tempIsSpecial,
    };

    setIsSaving(true);
    try {
      const updatedSchedule = { ...weeklySchedule };

      if (scope === 'SINGLE') {
        updatedSchedule[editingCell.dayShort] = {
          ...(updatedSchedule[editingCell.dayShort] || {}),
          [editingCell.mealSession.id]: newBlockData,
        };
      } else if (scope === 'WEEKDAYS') {
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        weekdays.forEach((dayShort) => {
          updatedSchedule[dayShort] = {
            ...(updatedSchedule[dayShort] || {}),
            [editingCell.mealSession.id]: newBlockData,
          };
        });
      } else if (scope === 'WEEKEND') {
        const weekends = ['Sat', 'Sun'];
        weekends.forEach((dayShort) => {
          updatedSchedule[dayShort] = {
            ...(updatedSchedule[dayShort] || {}),
            [editingCell.mealSession.id]: newBlockData,
          };
        });
      }

      setWeeklySchedule(updatedSchedule);

      // Attempt backend upsert if mess is configured
      if (activeMess && editingCell.mealSession.id) {
        try {
          await upsertMenuApi({
            messId: activeMess.id,
            menuDate: editingCell.dateStr,
            mealTypeId: editingCell.mealSession.id,
            notes: tempNotes.trim() || undefined,
            items: tempItems.map((item, idx) => ({
              itemName: item,
              category: 'MAIN_COURSE',
              displayOrder: idx + 1,
            })),
          });
        } catch {
          // Keep local state persisted even if remote sync fails
        }
      }

      setEditingCell(null);
    } catch (err: unknown) {
      Alert.alert('Save Failed', getErrorMessage(err, 'Could not save menu block'));
    } finally {
      setIsSaving(false);
    }
  };

  // Share formatted timetable
  const handleShareTimetable = async () => {
    try {
      let message = `🍽️ *WEEKLY MESS MENU TIMETABLE*\n`;
      message += `📅 Week of ${weekDays[0].date} to ${weekDays[6].date}\n\n`;

      weekDays.forEach((day) => {
        message += `👉 *${day.dayName.toUpperCase()}* (${day.date}):\n`;
        mealSessions.forEach((session) => {
          const block = day.meals[session.id];
          const itemsList = block?.items && block.items.length > 0 ? block.items.join(', ') : 'As per schedule';
          const notesText = block?.notes ? ` _(${block.notes})_` : '';
          message += `  • *${session.name}* (${session.startTime}-${session.endTime}): ${itemsList}${notesText}\n`;
        });
        message += `\n`;
      });

      message += `⚡ Managed via M-Square Smart Hostel Management`;

      await Share.share({
        message,
        title: 'Weekly Mess Menu Timetable',
      });
    } catch (err) {
      Alert.alert('Share Error', 'Failed to open sharing sheet');
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <GlobalHeader title="Weekly Mess Timetable" />

      {/* ── TOP CONTROLS & WEEK NAVIGATOR ── */}
      <View style={styles.topBar}>
        {/* Week Navigator */}
        <View style={styles.weekNav}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => setWeekOffset(weekOffset - 1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setWeekOffset(0)} style={styles.weekTitleWrap}>
            <Text style={styles.weekTitle}>
              {weekDays[0].dayShort} {weekDays[0].date.slice(5)} – {weekDays[6].dayShort} {weekDays[6].date.slice(5)}
            </Text>
            {weekOffset === 0 && (
              <View style={styles.currentWeekBadge}>
                <Text style={styles.currentWeekText}>Current Week</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => setWeekOffset(weekOffset + 1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* View Toggle & Share */}
        <View style={styles.actionRow}>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'GRID' && styles.toggleBtnActive]}
              onPress={() => setViewMode('GRID')}
            >
              <Ionicons
                name="grid-outline"
                size={14}
                color={viewMode === 'GRID' ? colors.primaryForeground : colors.textSecondary}
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  viewMode === 'GRID' && styles.toggleBtnTextActive,
                ]}
              >
                Timetable Grid
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'DAY_LIST' && styles.toggleBtnActive]}
              onPress={() => setViewMode('DAY_LIST')}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={viewMode === 'DAY_LIST' ? colors.primaryForeground : colors.textSecondary}
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  viewMode === 'DAY_LIST' && styles.toggleBtnTextActive,
                ]}
              >
                Day Cards
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.broadcastFeastBtn}
            onPress={() => setSpecialMenuModalVisible(true)}
            accessibilityRole="button"
          >
            <Ionicons name="sparkles" size={14} color="#EA580C" />
            <Text style={styles.broadcastFeastBtnText}>Feast Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShareTimetable}>
            <Ionicons name="share-social-outline" size={16} color={colors.primary} />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 1. TIMETABLE MATRIX / GRID VIEW ── */}
      {viewMode === 'GRID' ? (
        <ScrollView contentContainerStyle={styles.gridScrollContent}>
          <Text style={styles.tipText}>
            💡 Tap on any meal cell/block to edit dishes, rotation notes (e.g. Sunday Kheer vs Paneer), or meal timings!
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.matrixHorizontal}>
            <View style={styles.matrixContainer}>
              {/* HEADER ROW: Days of Week */}
              <View style={styles.matrixHeaderRow}>
                <View style={styles.cornerHeaderCell}>
                  <Text style={styles.cornerHeaderText}>MEAL / DAY</Text>
                </View>
                {weekDays.map((day) => (
                  <View
                    key={day.dayShort}
                    style={[styles.dayHeaderCell, day.isToday && styles.dayHeaderCellToday]}
                  >
                    <Text style={[styles.dayHeaderShort, day.isToday && styles.dayHeaderShortToday]}>
                      {day.dayShort.toUpperCase()}
                    </Text>
                    <Text style={[styles.dayHeaderDate, day.isToday && styles.dayHeaderDateToday]}>
                      {day.date.slice(8)}
                    </Text>
                    {day.isToday && <View style={styles.todayDot} />}
                  </View>
                ))}
              </View>

              {/* ROWS: Meal Sessions (Breakfast, Lunch, Snacks, Dinner) */}
              {mealSessions.map((session) => (
                <View key={session.id} style={styles.matrixRow}>
                  {/* Left Column: Meal Session Header */}
                  <View style={[styles.mealSessionCell, { borderLeftColor: session.color }]}>
                    <Ionicons name={session.icon as any} size={16} color={session.color} />
                    <Text style={styles.sessionName}>{session.name}</Text>
                    <Text style={styles.sessionTime}>
                      {session.startTime}-{session.endTime}
                    </Text>
                  </View>

                  {/* Day Columns for this Meal Session */}
                  {weekDays.map((day) => {
                    const block = day.meals[session.id] || { items: [] };
                    const hasItems = block.items && block.items.length > 0;

                    return (
                      <TouchableOpacity
                        key={`${day.dayShort}-${session.id}`}
                        style={[
                          styles.matrixBlockCell,
                          day.isToday && styles.matrixBlockCellToday,
                          block.isSpecial && styles.matrixBlockCellSpecial,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleOpenBlockEdit(day, session)}
                      >
                        {block.isSpecial && (
                          <View style={styles.specialBadge}>
                            <Ionicons name="star" size={9} color="#B45309" />
                            <Text style={styles.specialBadgeText}>Special</Text>
                          </View>
                        )}

                        {hasItems ? (
                          <View style={styles.blockItemList}>
                            {block.items.map((dish, dIdx) => (
                              <View key={dIdx} style={styles.dishPill}>
                                <Text style={styles.dishPillText} numberOfLines={1}>
                                  {dish}
                                </Text>
                              </View>
                            ))}
                            {block.notes ? (
                              <Text style={styles.blockNotesText} numberOfLines={2}>
                                📝 {block.notes}
                              </Text>
                            ) : null}
                          </View>
                        ) : (
                          <View style={styles.emptyBlockWrap}>
                            <Ionicons name="add-circle-outline" size={18} color={colors.textMuted} />
                            <Text style={styles.emptyBlockText}>+ Tap to Add</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      ) : (
        /* ── 2. DAY-BY-DAY CAROUSEL / LIST VIEW ── */
        <ScrollView contentContainerStyle={styles.dayListContent}>
          {/* Day Selector Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayChipScroll}
          >
            {weekDays.map((day, idx) => {
              const isSelected = idx === activeDayIndex;
              return (
                <TouchableOpacity
                  key={day.dayShort}
                  style={[
                    styles.dayTabChip,
                    isSelected && styles.dayTabChipSelected,
                    day.isToday && styles.dayTabChipToday,
                  ]}
                  onPress={() => setActiveDayIndex(idx)}
                >
                  <Text style={[styles.dayTabShort, isSelected && styles.dayTabShortSelected]}>
                    {day.dayShort}
                  </Text>
                  <Text style={[styles.dayTabNum, isSelected && styles.dayTabNumSelected]}>
                    {day.date.slice(8)}
                  </Text>
                  {day.isToday && <View style={styles.dayTabDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Day Cards */}
          <View style={styles.dayHeaderBanner}>
            <Text style={styles.dayBannerTitle}>{weekDays[activeDayIndex].dayName}</Text>
            <Text style={styles.dayBannerDate}>{weekDays[activeDayIndex].date}</Text>
          </View>

          {mealSessions.map((session) => {
            const currentDay = weekDays[activeDayIndex];
            const block = currentDay.meals[session.id] || { items: [] };

            return (
              <Card key={session.id} style={styles.dayCard}>
                <View style={styles.dayCardHeader}>
                  <View style={styles.dayCardTitleGroup}>
                    <View style={[styles.sessionIconBox, { backgroundColor: session.color + '15' }]}>
                      <Ionicons name={session.icon as any} size={18} color={session.color} />
                    </View>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.dayCardSessionName}>{session.name}</Text>
                        {block.isSpecial && (
                          <View style={styles.specialBadge}>
                            <Ionicons name="star" size={10} color="#B45309" />
                            <Text style={styles.specialBadgeText}>Special Feast</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.dayCardTimeText}>
                        🕒 {session.startTime} – {session.endTime}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.editCardBtn}
                    onPress={() => handleOpenBlockEdit(currentDay, session)}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <Text style={styles.editCardBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {/* Dishes tags */}
                <View style={styles.dayCardBody}>
                  {block.items && block.items.length > 0 ? (
                    <View style={styles.dishesWrap}>
                      {block.items.map((dish, dIdx) => (
                        <View key={dIdx} style={styles.dishTag}>
                          <Ionicons name="restaurant" size={11} color={colors.primary} />
                          <Text style={styles.dishTagText}>{dish}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.emptyCardPrompt}
                      onPress={() => handleOpenBlockEdit(currentDay, session)}
                    >
                      <Text style={styles.emptyPromptText}>+ Add dishes for {session.name}</Text>
                    </TouchableOpacity>
                  )}

                  {block.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesBoxText}>📝 {block.notes}</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}

      {/* ── 3. INTERACTIVE MEAL BLOCK EDIT MODAL ── */}
      <Modal
        visible={!!editingCell}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingCell(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.modalTitle}>
                    {editingCell?.dayName} • {editingCell?.mealSession.name}
                  </Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  📅 {editingCell?.dateStr} • 🕒 {editingCell?.mealSession.startTime} – {editingCell?.mealSession.endTime}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingCell(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Special Feast Toggle */}
              <TouchableOpacity
                style={[styles.specialToggle, tempIsSpecial && styles.specialToggleActive]}
                onPress={() => setTempIsSpecial(!tempIsSpecial)}
              >
                <Ionicons
                  name={tempIsSpecial ? 'star' : 'star-outline'}
                  size={18}
                  color={tempIsSpecial ? '#B45309' : colors.textSecondary}
                />
                <Text style={[styles.specialToggleText, tempIsSpecial && styles.specialToggleTextActive]}>
                  Mark as Special / Feast Meal (e.g. Sunday Feast, Festival)
                </Text>
              </TouchableOpacity>

              {/* CURRENT DISHES LIST */}
              <Text style={styles.formSectionTitle}>
                DISHES & MENU ITEMS ({tempItems.length})
              </Text>

              {tempItems.length > 0 ? (
                <View style={styles.selectedDishesWrap}>
                  {tempItems.map((item, idx) => (
                    <View key={idx} style={styles.selectedDishChip}>
                      <Text style={styles.selectedDishText}>{item}</Text>
                      <TouchableOpacity onPress={() => handleRemoveDish(idx)} style={styles.removeChipBtn}>
                        <Ionicons name="close-circle" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDishesText}>No dishes added yet. Type below or pick presets.</Text>
              )}

              {/* ADD CUSTOM DISH INPUT */}
              <View style={styles.addDishRow}>
                <TextInput
                  placeholder="Type dish (e.g. Paneer, Roti...)"
                  value={dishInput}
                  onChangeText={setDishInput}
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                  returnKeyType="done"
                  onSubmitEditing={() => handleAddDish(dishInput)}
                />
                <TouchableOpacity
                  style={styles.addDishBtn}
                  onPress={() => handleAddDish(dishInput)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addDishBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* ONE-TAP QUICK DISH PRESETS */}
              <Text style={[styles.formSectionTitle, { marginTop: spacing.md }]}>
                ⚡ ONE-TAP DISH PRESETS
              </Text>
              <View style={styles.presetChipsWrap}>
                {DISH_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      tempItems.includes(preset) && styles.presetChipAdded,
                    ]}
                    onPress={() => handleAddDish(preset)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        tempItems.includes(preset) && styles.presetChipTextAdded,
                      ]}
                    >
                      {tempItems.includes(preset) ? '✓ ' : '+ '}
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ROTATION & SPECIAL NOTES */}
              <Text style={[styles.formSectionTitle, { marginTop: spacing.md }]}>
                ROTATION & SPECIAL NOTES
              </Text>
              <TextInput
                placeholder="e.g. Alt Sunday: Week 1 Paneer / Week 2 Kheer & Puri..."
                value={tempNotes}
                onChangeText={setTempNotes}
                multiline
                numberOfLines={2}
              />

              {/* SAVE BUTTONS */}
              <View style={styles.modalActionGroup}>
                <Button
                  title={isSaving ? 'Saving...' : `Save for ${editingCell?.dayName}`}
                  onPress={() => handleSaveModal('SINGLE')}
                  disabled={isSaving}
                  style={{ marginBottom: spacing.xs }}
                />

                <View style={styles.bulkButtonRow}>
                  <Button
                    title="Apply Mon-Fri (Weekdays)"
                    variant="outline"
                    onPress={() => handleSaveModal('WEEKDAYS')}
                    disabled={isSaving}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Apply Sat-Sun (Weekend)"
                    variant="outline"
                    onPress={() => handleSaveModal('WEEKEND')}
                    disabled={isSaving}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Special Feast Broadcast Modal */}
      <SpecialMenuBroadcastModal
        visible={specialMenuModalVisible}
        propertyName={activeMess?.name || 'M Square PG'}
        onClose={() => setSpecialMenuModalVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekTitleWrap: {
    alignItems: 'center',
  },
  weekTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  currentWeekBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  currentWeekText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.pill,
    padding: 2,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleBtnText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: colors.primaryForeground,
  },
  broadcastFeastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  broadcastFeastBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C2410C',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  tipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    backgroundColor: colors.infoLight,
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  gridScrollContent: {
    padding: spacing.md,
    paddingBottom: 64,
  },
  matrixHorizontal: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matrixContainer: {
    paddingBottom: spacing.sm,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.secondaryLight,
  },
  cornerHeaderCell: {
    width: 100,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  cornerHeaderText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  dayHeaderCell: {
    width: 140,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    position: 'relative',
  },
  dayHeaderCellToday: {
    backgroundColor: colors.primaryLight + '50',
  },
  dayHeaderShort: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dayHeaderShortToday: {
    color: colors.primary,
  },
  dayHeaderDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  dayHeaderDateToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  todayDot: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  matrixRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 110,
  },
  mealSessionCell: {
    width: 100,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderLeftWidth: 4,
    backgroundColor: colors.surface,
  },
  sessionName: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  sessionTime: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  matrixBlockCell: {
    width: 140,
    padding: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'flex-start',
  },
  matrixBlockCellToday: {
    backgroundColor: colors.primaryLight + '15',
  },
  matrixBlockCellSpecial: {
    backgroundColor: '#FEF3C720',
  },
  specialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  specialBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  blockItemList: {
    gap: 3,
  },
  dishPill: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
  },
  dishPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  blockNotesText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyBlockWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  emptyBlockText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  dayListContent: {
    padding: spacing.md,
    paddingBottom: 64,
  },
  dayChipScroll: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  dayTabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 54,
    position: 'relative',
  },
  dayTabChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayTabChipToday: {
    borderColor: colors.primary,
  },
  dayTabShort: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayTabShortSelected: {
    color: colors.primaryForeground,
  },
  dayTabNum: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  dayTabNumSelected: {
    color: colors.primaryForeground,
  },
  dayTabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.warning,
    position: 'absolute',
    top: 4,
    right: 4,
  },
  dayHeaderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dayBannerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  dayBannerDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dayCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  dayCardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCardSessionName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  dayCardTimeText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  editCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  editCardBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  dayCardBody: {
    paddingTop: 4,
  },
  dishesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dishTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dishTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyCardPrompt: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  emptyPromptText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  notesBox: {
    backgroundColor: colors.secondaryLight,
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  notesBoxText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '92%',
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  specialToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  specialToggleActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  specialToggleText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    fontWeight: '600',
  },
  specialToggleTextActive: {
    color: '#B45309',
    fontWeight: '700',
  },
  formSectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  selectedDishesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  selectedDishChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  selectedDishText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  removeChipBtn: {
    padding: 2,
  },
  noDishesText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  addDishRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    marginBottom: spacing.xs,
    width: '100%',
  },
  addDishBtn: {
    height: 48,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addDishBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  presetChip: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipAdded: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetChipTextAdded: {
    color: colors.success,
    fontWeight: '700',
  },
  modalActionGroup: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  bulkButtonRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
