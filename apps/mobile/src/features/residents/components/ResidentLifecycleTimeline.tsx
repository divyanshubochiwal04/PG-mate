import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../../design-system';

export interface TimelineEvent {
  id: string;
  type: 'ONBOARDING' | 'BED_TRANSFER' | 'PAYMENT' | 'COMPLAINT' | 'REVISION' | 'CHECKOUT';
  title: string;
  description: string;
  timestamp: string;
  statusBadge?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'danger';
}

interface ResidentLifecycleTimelineProps {
  events?: TimelineEvent[];
}

export function ResidentLifecycleTimeline({
  events = [],
}: ResidentLifecycleTimelineProps): React.JSX.Element {
  // Default mock lifecycle events if none passed
  const displayEvents: TimelineEvent[] =
    events.length > 0
      ? events
      : [
          {
            id: '1',
            type: 'ONBOARDING',
            title: 'Resident Checked-In & Onboarded',
            description: 'Assigned to Room 101 (Bed 1). Security deposit of ₹5,000 received.',
            timestamp: '01 Jul 2026',
            statusBadge: 'CHECKED IN',
            badgeType: 'success',
          },
          {
            id: '2',
            type: 'PAYMENT',
            title: 'July Rent Cleared',
            description: '₹8,500 received via UPI (Ref #TXN8912). Receipt generated.',
            timestamp: '05 Jul 2026',
            statusBadge: 'PAID',
            badgeType: 'success',
          },
          {
            id: '3',
            type: 'COMPLAINT',
            title: 'AC Maintenance Ticket Resolved',
            description: 'Filter cleaning and gas top-up completed by technician.',
            timestamp: '18 Jul 2026',
            statusBadge: 'RESOLVED',
            badgeType: 'info',
          },
          {
            id: '4',
            type: 'BED_TRANSFER',
            title: 'Room Upgraded / Shifted',
            description: 'Transferred from Room 101 (Bed 1) to Room 102 (Bed 2 - AC Deluxe).',
            timestamp: '01 Aug 2026',
            statusBadge: 'TRANSFERRED',
            badgeType: 'warning',
          },
          {
            id: '5',
            type: 'PAYMENT',
            title: 'August Rent Cleared',
            description: '₹9,500 received via PhonePe. Invoice #INV-2026-08 settled.',
            timestamp: '06 Aug 2026',
            statusBadge: 'PAID',
            badgeType: 'success',
          },
        ];

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'ONBOARDING':
        return { name: 'person-add', color: '#16A34A', bg: '#DCFCE7' };
      case 'PAYMENT':
        return { name: 'card', color: '#0284C7', bg: '#E0F2FE' };
      case 'BED_TRANSFER':
        return { name: 'swap-horizontal', color: '#D97706', bg: '#FEF3C7' };
      case 'COMPLAINT':
        return { name: 'construct', color: '#9333EA', bg: '#F3E8FF' };
      case 'REVISION':
        return { name: 'document-text', color: '#4F46E5', bg: '#EEF2FF' };
      case 'CHECKOUT':
        return { name: 'exit', color: '#DC2626', bg: '#FEE2E2' };
      default:
        return { name: 'ellipse', color: colors.primary, bg: colors.primaryLight };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={styles.headerTitle}>Resident Lifecycle Timeline</Text>
      </View>

      <View style={styles.timelineList}>
        {displayEvents.map((evt, index) => {
          const isLast = index === displayEvents.length - 1;
          const iconInfo = getEventIcon(evt.type);

          return (
            <View key={evt.id} style={styles.timelineNode}>
              {/* Left Column: Icon & Connecting Line */}
              <View style={styles.leftCol}>
                <View style={[styles.iconCircle, { backgroundColor: iconInfo.bg }]}>
                  <Ionicons name={iconInfo.name as any} size={14} color={iconInfo.color} />
                </View>
                {!isLast && <View style={styles.verticalLine} />}
              </View>

              {/* Right Column: Event Content Card */}
              <View style={[styles.contentCard, isLast && { marginBottom: 0 }]}>
                <View style={styles.contentTop}>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                  {Boolean(evt.statusBadge) && (
                    <View
                      style={[
                        styles.badge,
                        evt.badgeType === 'success'
                          ? styles.badgeGreen
                          : evt.badgeType === 'warning'
                          ? styles.badgeAmber
                          : evt.badgeType === 'danger'
                          ? styles.badgeRed
                          : styles.badgeBlue,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          evt.badgeType === 'success'
                            ? styles.textGreen
                            : evt.badgeType === 'warning'
                            ? styles.textAmber
                            : evt.badgeType === 'danger'
                            ? styles.textRed
                            : styles.textBlue,
                        ]}
                      >
                        {evt.statusBadge}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.eventDesc}>{evt.description}</Text>
                <Text style={styles.eventTime}>{evt.timestamp}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineNode: {
    flexDirection: 'row',
    gap: 12,
  },
  leftCol: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  contentCard: {
    flex: 1,
    backgroundColor: colors.mutedBackground,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  badgeAmber: { backgroundColor: '#FEF3C7' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeBlue: { backgroundColor: '#E0F2FE' },

  badgeText: { fontSize: 9, fontWeight: '800' },
  textGreen: { color: '#166534' },
  textAmber: { color: '#B45309' },
  textRed: { color: '#991B1B' },
  textBlue: { color: '#0284C7' },

  eventDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
