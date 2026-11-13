import { StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppText } from './text';

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
        <AppText variant="h2" style={styles.value}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="caption" tone="faint" style={styles.unit}>
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
          backgroundColor: color ?? theme.gold,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 2,
    minHeight: 74,
    justifyContent: 'center',
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  value: { fontSize: 22, lineHeight: 28 },
  unit: { fontSize: 11 },
  track: { width: '100%', overflow: 'hidden' },
});
