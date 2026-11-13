import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from './icon';
import { AppText } from './text';

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  size?: number;
  /** Allows clearing the rating by tapping the active star again. */
  clearable?: boolean;
  label?: string;
}

export function StarRating({
  value,
  onChange,
  size = 26,
  clearable,
  label,
}: StarRatingProps) {
  const theme = useTheme();
  const interactive = Boolean(onChange);

  return (
    <View
      style={styles.stars}
      accessibilityRole={interactive ? 'adjustable' : 'text'}
      accessibilityLabel={label ?? `Rating ${value ?? 0} of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value != null && star <= value;
        const icon = filled ? 'star' : 'star-outline';
        const content = (
          <Ionicons
            name={icon}
            size={size}
            color={filled ? theme.gold : theme.borderStrong}
          />
        );
        if (!interactive) return <View key={star}>{content}</View>;
        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
            hitSlop={6}
            onPress={() => {
              if (clearable && value === star) onChange?.(0);
              else onChange?.(star);
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}

interface RatingBarProps {
  label: string;
  value: number | null;
  max?: number;
  hint?: string;
}

export function RatingBar({ label, value, max = 5, hint }: RatingBarProps) {
  const theme = useTheme();
  const ratio = value == null ? 0 : Math.min(1, Math.max(0, value / max));

  return (
    <View style={styles.barRow}>
      <View style={styles.barLabel}>
        <AppText variant="small">{label}</AppText>
        {hint ? (
          <AppText variant="caption" tone="faint">
            {hint}
          </AppText>
        ) : null}
      </View>
      <View style={styles.barRight}>
        <View style={[styles.barTrack, { backgroundColor: theme.surfaceSunken }]}>
          <View
            style={[
              styles.barFill,
              { width: `${ratio * 100}%`, backgroundColor: theme.gold },
            ]}
          />
        </View>
        <AppText variant="caption" tone={value == null ? 'faint' : 'default'} style={styles.barValue}>
          {value == null ? '—' : `${value}`}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  barLabel: { width: 92 },
  barRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  barTrack: { flex: 1, height: 6, borderRadius: Radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.pill },
  barValue: { width: 16, textAlign: 'right' },
});
