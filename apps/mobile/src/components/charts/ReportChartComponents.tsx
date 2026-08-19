import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../design-system';

// ── 1. VERTICAL COLUMN / BAR CHART ──
export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
  subLabel?: string;
}

interface VerticalBarChartProps {
  title?: string;
  subtitle?: string;
  data: BarChartItem[];
  height?: number;
  formatValue?: (val: number) => string;
}

export const VerticalBarChart: React.FC<VerticalBarChartProps> = ({
  title,
  subtitle,
  data,
  height = 140,
  formatValue = (v) => v.toString(),
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.chartContainer}>
      {title && (
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{title}</Text>
          {subtitle && <Text style={styles.chartSubtitle}>{subtitle}</Text>}
        </View>
      )}

      <View style={[styles.barPlotArea, { height }]}>
        {/* Background Guide Lines */}
        <View style={styles.gridLine} />
        <View style={[styles.gridLine, { top: '50%' }]} />

        {data.map((item, index) => {
          const barHeightPercent = Math.min(100, Math.max(8, (item.value / maxValue) * 100));
          const barColor = item.color || colors.primary;

          return (
            <View key={`${item.label}-${index}`} style={styles.barColumn}>
              <Text style={styles.barTopValue} numberOfLines={1}>
                {formatValue(item.value)}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${barHeightPercent}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barBottomLabel} numberOfLines={1}>
                {item.label}
              </Text>
              {item.subLabel && (
                <Text style={styles.barSubLabel} numberOfLines={1}>
                  {item.subLabel}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ── 2. MULTI-SEGMENT PROPORTIONAL DISTRIBUTION BAR ──
export interface SegmentItem {
  label: string;
  value: number;
  color: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

interface MultiSegmentBarProps {
  title?: string;
  segments: SegmentItem[];
  totalLabel?: string;
  formatValue?: (val: number) => string;
}

export const MultiSegmentBar: React.FC<MultiSegmentBarProps> = ({
  title,
  segments,
  totalLabel,
  formatValue = (v) => v.toString(),
}) => {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.segmentHeaderRow}>
        {title && <Text style={styles.chartTitle}>{title}</Text>}
        {totalLabel && <Text style={styles.totalBadge}>{totalLabel}: {formatValue(total)}</Text>}
      </View>

      {/* Segmented Bar Track */}
      <View style={styles.multiTrack}>
        {total === 0 ? (
          <View style={[styles.singleSegment, { flex: 1, backgroundColor: colors.secondaryLight }]} />
        ) : (
          segments.map((seg, idx) => {
            if (seg.value <= 0) return null;
            const flexVal = seg.value / total;
            return (
              <View
                key={`${seg.label}-${idx}`}
                style={[
                  styles.singleSegment,
                  {
                    flex: flexVal,
                    backgroundColor: seg.color,
                  },
                ]}
              />
            );
          })
        )}
      </View>

      {/* Legend Grid */}
      <View style={styles.legendGrid}>
        {segments.map((seg, idx) => {
          const percent = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <View key={`${seg.label}-${idx}`} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
              <Text style={styles.legendLabel} numberOfLines={1}>
                {seg.label}
              </Text>
              <Text style={styles.legendValue}>
                {formatValue(seg.value)} <Text style={styles.legendPercent}>({percent}%)</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ── 3. HORIZONTAL PROGRESS BARS WITH CATEGORY ICON & VALUE ──
export interface HorizontalProgressItem {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  badgeText?: string;
  subText?: string;
}

interface HorizontalBarListProps {
  title?: string;
  items: HorizontalProgressItem[];
  formatValue?: (val: number) => string;
}

export const HorizontalBarList: React.FC<HorizontalBarListProps> = ({
  title,
  items,
  formatValue = (v) => v.toString(),
}) => {
  const maxVal = Math.max(...items.map((i) => i.maxValue || i.value), 1);

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={[styles.chartTitle, { marginBottom: spacing.sm }]}>{title}</Text>}
      {items.map((item, idx) => {
        const percent = Math.min(100, Math.round((item.value / (item.maxValue || maxVal)) * 100));
        const barColor = item.color || colors.primary;

        return (
          <View key={`${item.label}-${idx}`} style={styles.hBarRow}>
            <View style={styles.hBarHeader}>
              <View style={styles.hBarTitleGroup}>
                {item.icon && (
                  <View style={[styles.hBarIconWrap, { backgroundColor: barColor + '18' }]}>
                    <Ionicons name={item.icon} size={14} color={barColor} />
                  </View>
                )}
                <View>
                  <Text style={styles.hBarLabel}>{item.label}</Text>
                  {item.subText && <Text style={styles.hBarSubText}>{item.subText}</Text>}
                </View>
              </View>

              <View style={styles.hBarValues}>
                <Text style={styles.hBarValue}>{formatValue(item.value)}</Text>
                {item.badgeText ? (
                  <Text style={[styles.hBarBadge, { color: barColor }]}>{item.badgeText}</Text>
                ) : (
                  <Text style={styles.hBarPercent}>{percent}%</Text>
                )}
              </View>
            </View>

            <View style={styles.hBarTrack}>
              <View style={[styles.hBarFill, { width: `${percent}%`, backgroundColor: barColor }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ── 4. FINANCIAL COMPARISON CARD (PERIOD OVER PERIOD) ──
interface ComparisonChartProps {
  title: string;
  currentLabel: string;
  currentValue: number;
  previousLabel: string;
  previousValue: number;
  unitPrefix?: string;
  accentColor?: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  title,
  currentLabel,
  currentValue,
  previousLabel,
  previousValue,
  unitPrefix = '₹',
  accentColor = colors.primary,
}) => {
  const max = Math.max(currentValue, previousValue, 1);
  const currentPct = Math.round((currentValue / max) * 100);
  const prevPct = Math.round((previousValue / max) * 100);
  const diff = currentValue - previousValue;
  const isPositive = diff >= 0;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.comparisonHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View
          style={[
            styles.diffBadge,
            { backgroundColor: isPositive ? colors.successLight : colors.dangerLight },
          ]}
        >
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={12}
            color={isPositive ? colors.success : colors.danger}
          />
          <Text
            style={[
              styles.diffText,
              { color: isPositive ? colors.success : colors.danger },
            ]}
          >
            {isPositive ? '+' : ''}
            {unitPrefix}
            {Math.abs(diff).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Current Bar */}
      <View style={styles.compBarGroup}>
        <View style={styles.compLabelRow}>
          <Text style={styles.compLabel}>{currentLabel}</Text>
          <Text style={[styles.compValue, { color: accentColor }]}>
            {unitPrefix}
            {currentValue.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.hBarTrack}>
          <View
            style={[
              styles.hBarFill,
              { width: `${currentPct}%`, backgroundColor: accentColor },
            ]}
          />
        </View>
      </View>

      {/* Previous Bar */}
      <View style={[styles.compBarGroup, { marginTop: spacing.xs }]}>
        <View style={styles.compLabelRow}>
          <Text style={styles.compLabel}>{previousLabel}</Text>
          <Text style={[styles.compValue, { color: colors.textSecondary }]}>
            {unitPrefix}
            {previousValue.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.hBarTrack}>
          <View
            style={[
              styles.hBarFill,
              { width: `${prevPct}%`, backgroundColor: colors.textMuted },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  chartHeader: {
    marginBottom: spacing.sm,
  },
  chartTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chartSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  barPlotArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    position: 'relative',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  barTopValue: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    flex: 1,
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.pill,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: radius.pill,
  },
  barBottomLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },
  barSubLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
  segmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalBadge: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  multiTrack: {
    height: 14,
    borderRadius: radius.pill,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: colors.secondaryLight,
    gap: 2,
    marginBottom: spacing.md,
  },
  singleSegment: {
    height: '100%',
    borderRadius: 2,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
    gap: 6,
    marginVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  legendValue: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  legendPercent: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  hBarRow: {
    marginBottom: spacing.sm,
  },
  hBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hBarTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  hBarIconWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hBarLabel: {
    ...typography.bodyBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  hBarSubText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  hBarValues: {
    alignItems: 'flex-end',
  },
  hBarValue: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hBarPercent: {
    fontSize: 10,
    color: colors.textMuted,
  },
  hBarBadge: {
    fontSize: 10,
    fontWeight: '700',
  },
  hBarTrack: {
    height: 8,
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  hBarFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '800',
  },
  compBarGroup: {
    marginBottom: 2,
  },
  compLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  compLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  compValue: {
    ...typography.caption,
    fontWeight: '700',
  },
});
