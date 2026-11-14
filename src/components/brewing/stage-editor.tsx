import { Pressable, StyleSheet, View } from 'react-native';
import { MAX_POUR_STAGES } from '@/constants/defaults';
import { FontFamily, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BrewPlan } from '@/hooks/use-brew-plan';
import { Ionicons } from '../common/icon';
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

/** Compact +/- control used inside pour cards where a full field is too wide. */
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
  const factor = 10 ** decimals;

  const nudge = (direction: 1 | -1) => {
    const next = Math.round((value + direction * step) * factor) / factor;
    const bounded = max != null ? Math.min(max, next) : next;
    onChange(Math.max(min, bounded));
  };

  const display = Number.isInteger(value) ? String(value) : value.toFixed(decimals);

  return (
    <View style={styles.stepperBlock}>
      <AppText variant="label" tone="faint">
        {label}
      </AppText>
      <View
        style={[
          styles.stepper,
          { backgroundColor: theme.surfaceSunken, borderColor: theme.border },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          hitSlop={4}
          onPress={() => nudge(-1)}
          style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.5 : 1 }]}>
          <Ionicons name="remove" size={14} color={theme.textMuted} />
        </Pressable>
        <AppText variant="bodyStrong" style={styles.stepperValue}>
          {display}
          {suffix ? <AppText variant="caption" tone="faint"> {suffix}</AppText> : null}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          hitSlop={4}
          onPress={() => nudge(1)}
          style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.5 : 1 }]}>
          <Ionicons name="add" size={14} color={theme.textMuted} />
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

  return (
    <View style={styles.root}>
      {/* Bloom */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.index, { backgroundColor: theme.primarySoft }]}>
            <AppText variant="caption" color={theme.primary} style={styles.indexLabel}>
              1
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Bloom</AppText>
            <AppText variant="caption" tone="muted">
              {plan.bloomWaterG} g · {plan.bloomMultiplier}× dose
            </AppText>
          </View>
        </View>
        <View style={styles.controls}>
          <MiniStepper
            label="Bloom water"
            value={plan.bloomWaterG}
            onChange={(water) => plan.setBloomMultiplier(water / Math.max(0.1, plan.doseG))}
            step={0.5}
            decimals={1}
            min={1}
            suffix="g"
          />
          <MiniStepper
            label="Duration"
            value={plan.bloomDurationS}
            onChange={plan.setBloomDuration}
            step={5}
            min={10}
            max={120}
            suffix="s"
          />
        </View>
      </View>

      {/* Pours */}
      {plan.pours.map((pour, index) => {
        let cumulative = plan.bloomWaterG;
        for (let position = 0; position <= index; position += 1) {
          cumulative += plan.pours[position].amountG;
        }
        return (
          <View
            key={`pour-${index}`}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.index, { backgroundColor: theme.surfaceSunken }]}>
                <AppText variant="caption" tone="muted" style={styles.indexLabel}>
                  {index + 2}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{pour.label}</AppText>
                <AppText variant="caption" tone="muted">
                  +{pour.amountG} g → {Math.round(cumulative * 10) / 10} g total
                </AppText>
              </View>
              {plan.pours.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${pour.label}`}
                  hitSlop={8}
                  onPress={() => plan.removePour(index)}
                  style={({ pressed }) => [styles.removeButton, { opacity: pressed ? 0.5 : 1 }]}>
                  <Ionicons name="close" size={16} color={theme.textFaint} />
                </Pressable>
              ) : null}
            </View>
            {!compact ? (
              <View style={styles.controls}>
                <MiniStepper
                  label="Water"
                  value={pour.amountG}
                  onChange={(amount) => plan.setPourAmount(index, amount)}
                  step={5}
                  decimals={1}
                  min={0.1}
                  suffix="g"
                />
                <MiniStepper
                  label="Duration"
                  value={pour.durationS}
                  onChange={(seconds) => plan.setPourDuration(index, seconds)}
                  step={5}
                  min={5}
                  suffix="s"
                />
              </View>
            ) : null}
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a pouring stage"
        accessibilityState={{ disabled: plan.pours.length >= MAX_POUR_STAGES }}
        disabled={plan.pours.length >= MAX_POUR_STAGES}
        onPress={plan.addPour}
        style={({ pressed }) => [
          styles.addButton,
          {
            borderColor: theme.borderStrong,
            backgroundColor: pressed ? theme.surfaceSunken : 'transparent',
            opacity: plan.pours.length >= MAX_POUR_STAGES ? 0.4 : 1,
          },
        ]}>
        <Ionicons name="add" size={16} color={theme.textMuted} />
        <AppText variant="small" tone="muted">
          {plan.pours.length >= MAX_POUR_STAGES ? 'Six pours is plenty' : 'Add a pouring stage'}
        </AppText>
      </Pressable>

      {/* Drawdown */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.index, { backgroundColor: theme.surfaceSunken }]}>
            <Ionicons name="water-outline" size={13} color={theme.textMuted} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Drawdown</AppText>
            <AppText variant="caption" tone="muted">
              {plan.drawdownEnabled ? 'Wait for the bed to drain' : 'Not included in this brew'}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: plan.drawdownEnabled }}
            accessibilityLabel="Include a drawdown stage"
            onPress={() => plan.setDrawdownEnabled(!plan.drawdownEnabled)}
            style={({ pressed }) => [
              styles.toggle,
              {
                backgroundColor: plan.drawdownEnabled ? theme.primary : theme.surfaceSunken,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <AppText
              variant="caption"
              color={plan.drawdownEnabled ? theme.onPrimary : theme.textMuted}>
              {plan.drawdownEnabled ? 'On' : 'Off'}
            </AppText>
          </Pressable>
        </View>
        {plan.drawdownEnabled && !compact ? (
          <View style={styles.controls}>
            <MiniStepper
              label="Duration"
              value={plan.drawdownDurationS}
              onChange={plan.setDrawdownDuration}
              step={5}
              min={5}
              suffix="s"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.sm },
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  index: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexLabel: { fontSize: 11 },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: { flexDirection: 'row', gap: Spacing.sm },
  stepperBlock: { flex: 1, gap: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 38,
    paddingHorizontal: 2,
  },
  stepperButton: {
    width: 32,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: TouchTarget,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  toggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    minWidth: 48,
    alignItems: 'center',
  },
  flex: { flex: 1 },
});
