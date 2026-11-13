import { StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TimelineStage } from '@/types';
import { formatDuration, formatWeight } from '@/utils/formatting';
import { Ionicons } from '../common/icon';
import { AppText } from '../common/text';

interface StageListProps {
  stages: TimelineStage[];
  activeIndex?: number;
  /** Marks stages before `activeIndex` as done. */
  showState?: boolean;
}

export function StageList({ stages, activeIndex, showState }: StageListProps) {
  const theme = useTheme();

  return (
    <View style={styles.list}>
      {stages.map((stage, index) => {
        const isActive = index === activeIndex;
        const isDone = showState && activeIndex != null && index < activeIndex;
        return (
          <View
            key={`${stage.stepOrder}-${stage.label}`}
            style={[
              styles.row,
              {
                backgroundColor: isActive ? theme.primarySoft : 'transparent',
                borderColor: isActive ? theme.borderStrong : theme.border,
              },
            ]}>
            <View
              style={[
                styles.index,
                {
                  backgroundColor: isDone
                    ? theme.primary
                    : isActive
                      ? theme.gold
                      : theme.surfaceSunken,
                },
              ]}>
              {isDone ? (
                <Ionicons name="checkmark" size={12} color={theme.onPrimary} />
              ) : (
                <AppText
                  variant="caption"
                  color={isActive ? (theme.mode === 'dark' ? '#20160F' : '#2A1E17') : theme.textMuted}
                  style={styles.indexLabel}>
                  {index + 1}
                </AppText>
              )}
            </View>

            <View style={styles.body}>
              <AppText variant="bodyStrong">{stage.label}</AppText>
              <AppText variant="caption" tone="muted">
                to {formatWeight(stage.targetWaterG, true)} · {formatDuration(stage.durationS)}
              </AppText>
            </View>

            <View style={styles.time}>
              <AppText variant="mono" tone={isActive ? 'default' : 'faint'} style={styles.timeText}>
                {formatDuration(stage.startS)}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  index: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexLabel: { fontSize: 11 },
  body: { flex: 1, gap: 1 },
  time: { alignItems: 'flex-end' },
  timeText: { fontSize: 13 },
});
