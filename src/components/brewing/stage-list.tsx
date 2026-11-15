import { StyleSheet, View } from 'react-native';
import { localizeStepLabel } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import type { TimelineStage } from '@/types';
import { formatDuration, formatWeight } from '@/utils/formatting';
import { AppIcon } from '../common/icon';
import { AppText } from '../common/text';

interface StageListProps {
  stages: TimelineStage[];
  activeIndex?: number;
  /** Marks stages before `activeIndex` as done. */
  showState?: boolean;
}

export function StageList({ stages, activeIndex, showState }: StageListProps) {
  const theme = useTheme();
  const { lang, t } = useTranslation();

  return (
    <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {stages.map((stage, index) => {
        const isActive = index === activeIndex;
        const isDone = showState && activeIndex != null && index < activeIndex;
        const isLast = index === stages.length - 1;
        const stageLabel = localizeStepLabel(stage.label, stage.kind, lang);

        return (
          <View
            key={`${stage.stepOrder}-${stage.label}`}
            style={[
              styles.row,
              !isLast && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.border,
              },
              isActive && { backgroundColor: theme.accentSoft },
            ]}>
            <View
              style={[
                styles.index,
                {
                  backgroundColor: isDone || isActive ? theme.accent : theme.surfaceSunken,
                },
              ]}>
              {isDone ? (
                <AppIcon name="check" size={12} color={theme.onAccent} strokeWidth={2.2} />
              ) : (
                <AppText
                  variant="caption"
                  tabular
                  color={isActive ? theme.onAccent : theme.textMuted}
                  style={styles.indexLabel}>
                  {index + 1}
                </AppText>
              )}
            </View>

            <View style={styles.body}>
              <AppText variant="bodyStrong">{stageLabel}</AppText>
              <AppText variant="caption" tone="muted" tabular>
                {t.stageList.toTarget(
                  formatWeight(stage.targetWaterG, true),
                  formatDuration(stage.durationS)
                )}
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
  list: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  index: {
    width: 24,
    height: 24,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexLabel: { fontSize: 11 },
  body: { flex: 1, gap: 1 },
  time: { alignItems: 'flex-end' },
  timeText: { fontSize: 13 },
});
