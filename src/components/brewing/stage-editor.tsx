import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { MAX_POUR_STAGES } from '@/constants/defaults';
import { FontFamily, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import type { BrewPlan } from '@/hooks/use-brew-plan';
import { AppIcon } from '../common/icon';
import { AppText } from '../common/text';

interface MiniStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  decimals?: number;
  min?: number;
  max?: number;
}

/** Compact +/- control used inside pour schedule rows. */
function MiniStepper({
  label,
  value,
  onChange,
  step = 1,
  suffix,
  decimals = 0,
  min = 0,
  max,
}: MiniStepperProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const factor = 10 ** decimals;

  const nudge = (direction: 1 | -1) => {
    const next = Math.round((value + direction * step) * factor) / factor;
    const bounded = max != null ? Math.min(max, next) : next;
    onChange(Math.max(min, bounded));
  };

  const display = Number.isInteger(value) ? String(value) : value.toFixed(decimals);

  return (
    <View style={styles.stepperBlock}>
      <AppText variant="fieldLabel" tone="muted">
        {label}
      </AppText>
      <View
        style={[
          styles.stepper,
          { backgroundColor: theme.surfaceSunken, borderColor: theme.border },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.decrease(label)}
          hitSlop={4}
          onPress={() => nudge(-1)}
          style={({ pressed }) => [
            styles.stepperButton,
            {
              borderRightColor: theme.border,
              backgroundColor: pressed ? theme.border : 'transparent',
            },
          ]}>
          <AppIcon name="minus" size={14} color={theme.textMuted} />
        </Pressable>
        <View style={styles.stepperCenter}>
          <AppText variant="metricSmall" style={styles.stepperValue}>
            {display}
          </AppText>
          {suffix ? (
            <AppText variant="caption" tone="faint" tabular>
              {suffix}
            </AppText>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.increase(label)}
          hitSlop={4}
          onPress={() => nudge(1)}
          style={({ pressed }) => [
            styles.stepperButton,
            styles.stepperButtonRight,
            {
              borderLeftColor: theme.border,
              backgroundColor: pressed ? theme.border : 'transparent',
            },
          ]}>
          <AppIcon name="plus" size={14} color={theme.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

interface StageEditorProps {
  plan: BrewPlan;
  /** Hides per-stage durations (used when the plan is generated automatically). */
  compact?: boolean;
}

export function StageEditor({ plan, compact }: StageEditorProps) {
  const theme = useTheme();
  const { lang, t } = useTranslation();
  const secSuffix = lang === 'id' ? 'dtk' : 's';

  return (
    <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Bloom */}
      <View style={[styles.stageRow, { borderBottomColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.index, { backgroundColor: theme.accentSoft }]}>
            <AppText variant="caption" tabular color={theme.accent} style={styles.indexLabel}>
              1
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{t.stageEditor.bloom}</AppText>
            <AppText variant="caption" tone="muted" tabular>
              {t.stageEditor.bloomMeta(plan.bloomWaterG, plan.bloomMultiplier)}
            </AppText>
          </View>
        </View>
        <View style={styles.controls}>
          <MiniStepper
            label={t.stageEditor.bloomWater}
            value={plan.bloomWaterG}
            onChange={(water) => plan.setBloomMultiplier(water / Math.max(0.1, plan.doseG))}
            step={0.5}
            decimals={1}
            min={Math.max(0.1, plan.doseG)}
            max={Math.round(plan.doseG * 6 * 10) / 10}
            suffix="g"
          />
          <MiniStepper
            label={t.stageEditor.duration}
            value={plan.bloomDurationS}
            onChange={plan.setBloomDuration}
            step={5}
            min={10}
            max={120}
            suffix={secSuffix}
          />
        </View>
      </View>

      {/* Pours */}
      {plan.pours.map((pour, index) => {
        let cumulative = plan.bloomWaterG;
        for (let position = 0; position <= index; position += 1) {
          cumulative += plan.pours[position].amountG;
        }
        // Every other pour keeps at least 0.1 g, so this is the largest value
        // this stage can take without pushing the schedule off its total.
        const maxAmount = Math.max(
          0.1,
          Math.round((plan.remainingWaterG - 0.1 * (plan.pours.length - 1)) * 10) / 10
        );
        return (
          <View
            key={`pour-${index}`}
            style={[styles.stageRow, { borderBottomColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.index, { backgroundColor: theme.surfaceSunken }]}>
                <AppText variant="caption" tabular tone="muted" style={styles.indexLabel}>
                  {index + 2}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{pour.label}</AppText>
                <AppText variant="caption" tone="muted" tabular>
                  {t.stageEditor.pourMeta(pour.amountG, Math.round(cumulative * 10) / 10)}
                </AppText>
              </View>
              {plan.pours.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.stageEditor.removeStage(pour.label)}
                  hitSlop={6}
                  onPress={() => plan.removePour(index)}
                  style={({ pressed }) => [styles.removeButton, { opacity: pressed ? 0.55 : 1 }]}>
                  <AppIcon name="close" size={16} color={theme.textFaint} />
                </Pressable>
              ) : null}
            </View>
            {!compact ? (
              <View style={styles.controls}>
                <MiniStepper
                  label={t.stageEditor.water}
                  value={pour.amountG}
                  onChange={(amount) => plan.setPourAmount(index, amount)}
                  step={5}
                  decimals={1}
                  min={0.1}
                  max={maxAmount}
                  suffix="g"
                />
                <MiniStepper
                  label={t.stageEditor.duration}
                  value={pour.durationS}
                  onChange={(seconds) => plan.setPourDuration(index, seconds)}
                  step={5}
                  min={5}
                  suffix={secSuffix}
                />
              </View>
            ) : null}
          </View>
        );
      })}

      {/* Add pour action row */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.stageEditor.addPour}
        accessibilityState={{ disabled: plan.pours.length >= MAX_POUR_STAGES }}
        disabled={plan.pours.length >= MAX_POUR_STAGES}
        onPress={plan.addPour}
        style={({ pressed }) => [
          styles.addRow,
          {
            borderBottomColor: theme.border,
            backgroundColor: pressed ? theme.surfaceSunken : 'transparent',
            opacity: plan.pours.length >= MAX_POUR_STAGES ? 0.45 : 1,
          },
        ]}>
        <AppIcon name="plus" size={16} color={theme.accent} />
        <AppText variant="small" color={theme.accent} style={styles.addLabel}>
          {plan.pours.length >= MAX_POUR_STAGES
            ? t.stageEditor.maxPoursReached
            : t.stageEditor.addPour}
        </AppText>
      </Pressable>

      {/* Drawdown */}
      <View style={styles.drawdownRow}>
        <View style={styles.cardHeader}>
          <View style={[styles.index, { backgroundColor: theme.surfaceSunken }]}>
            <AppIcon name="droplets" size={13} color={theme.textMuted} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{t.stageEditor.drawdown}</AppText>
            <AppText variant="caption" tone="muted">
              {plan.drawdownEnabled
                ? t.stageEditor.drawdownEnabled
                : t.stageEditor.drawdownDisabled}
            </AppText>
          </View>
          <Switch
            accessibilityLabel={t.stageEditor.drawdownSwitchA11y}
            value={plan.drawdownEnabled}
            onValueChange={plan.setDrawdownEnabled}
            trackColor={{ false: theme.borderStrong, true: theme.accent }}
            thumbColor={theme.switchThumb}
          />
        </View>
        {plan.drawdownEnabled && !compact ? (
          <View style={styles.controls}>
            <MiniStepper
              label={t.stageEditor.duration}
              value={plan.drawdownDurationS}
              onChange={plan.setDrawdownDuration}
              step={5}
              min={5}
              suffix={secSuffix}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stageRow: {
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  drawdownRow: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  index: {
    width: 26,
    height: 26,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexLabel: { fontSize: 11, fontFamily: FontFamily.sansMedium },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: { flexDirection: 'row', gap: Spacing.sm },
  stepperBlock: { flex: 1, gap: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Radius.sm,
    borderWidth: 1,
    minHeight: 42,
    overflow: 'hidden',
  },
  stepperButton: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  stepperButtonRight: {
    borderRightWidth: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  stepperCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  stepperValue: {
    textAlign: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: TouchTarget,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  addLabel: { fontFamily: FontFamily.sansMedium },
  flex: { flex: 1 },
});
