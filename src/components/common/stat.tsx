import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppText } from './text';

export interface MetricItem {
  value: string;
  label: string;
  unit?: string;
}

interface MetricStripProps {
  items: MetricItem[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Unified horizontal hairline metric strip replacing stacked 3-up StatTile cards.
 */
export function MetricStrip({ items, style }: MetricStripProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.strip,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View
            key={`${item.label}-${index}`}
            style={[
              styles.cell,
              !isLast && {
                borderRightWidth: StyleSheet.hairlineWidth,
                borderRightColor: theme.border,
              },
            ]}>
            <View style={styles.valueRow}>
              <AppText variant="metric">{item.value}</AppText>
              {item.unit ? (
                <AppText variant="caption" tone="faint" tabular>
                  {item.unit}
                </AppText>
              ) : null}
            </View>
            <AppText variant="caption" tone="muted">
              {item.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

interface StatTileProps {
  value: string;
  label: string;
  /** Small trailing unit, e.g. "sessions". */
  unit?: string;
  align?: 'left' | 'center';
}

export function StatTile({ value, label, unit, align = 'left' }: StatTileProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          alignItems: align === 'center' ? 'center' : 'flex-start',
        },
      ]}>
      <View style={styles.valueRow}>
        <AppText variant="metric">{value}</AppText>
        {unit ? (
          <AppText variant="caption" tone="faint" tabular style={styles.unit}>
            {unit}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
}

export function ProgressBar({ progress, height = 6, color, trackColor }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: trackColor ?? theme.surfaceSunken, borderRadius: height / 2 },
      ]}>
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: color ?? theme.accent,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 2,
  },
  tile: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 2,
    minHeight: 72,
    justifyContent: 'center',
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  unit: { fontSize: 11 },
  track: { width: '100%', overflow: 'hidden' },
});
