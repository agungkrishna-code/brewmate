import { StyleSheet, View } from 'react-native';
import { RATIO_PRESETS, TEMPERATURE_PRESETS } from '@/constants/defaults';
import { Spacing } from '@/constants/theme';
import type { BrewPlan } from '@/hooks/use-brew-plan';
import { useTranslation } from '@/hooks/use-language';
import { Chip, ChipRow } from '../common/chip';
import { NumberField } from '../common/field';

interface PlanInputsProps {
  plan: BrewPlan;
  errors?: Partial<Record<'coffeeDoseG' | 'ratio' | 'waterTempC', string>>;
}

export function PlanInputs({ plan, errors }: PlanInputsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <NumberField
          label={t.planInputs.coffeeDose}
          value={plan.doseG}
          onChange={(value) => {
            if (value != null) plan.setDose(value);
          }}
          suffix="g"
          step={0.5}
          min={5}
          max={60}
          stepper
          error={errors?.coffeeDoseG}
          style={styles.flex}
        />
        <NumberField
          label={t.planInputs.ratio}
          value={plan.ratio}
          onChange={(value) => {
            if (value != null) plan.setRatio(value);
          }}
          prefix="1:"
          step={0.5}
          decimals={2}
          min={5}
          max={30}
          stepper
          error={errors?.ratio}
          style={styles.flex}
        />
      </View>

      <ChipRow>
        {RATIO_PRESETS.map((preset) => (
          <Chip
            key={preset}
            label={`1:${preset}`}
            selected={Math.abs(plan.ratio - preset) < 0.005}
            onPress={() => plan.setRatio(preset)}
          />
        ))}
      </ChipRow>

      <View style={styles.row}>
        <NumberField
          label={t.planInputs.totalWater}
          value={plan.totalWaterG}
          onChange={(value) => {
            if (value != null) plan.setTotalWater(value);
          }}
          suffix="g"
          step={10}
          min={50}
          max={1000}
          stepper
          style={styles.flex}
        />
        <NumberField
          label={t.planInputs.waterTemp}
          value={plan.tempC}
          onChange={(value) => {
            if (value != null) plan.setTemp(value);
          }}
          suffix="°C"
          step={1}
          decimals={0}
          min={60}
          max={100}
          stepper
          error={errors?.waterTempC}
          style={styles.flex}
        />
      </View>

      <ChipRow>
        {TEMPERATURE_PRESETS.map((preset) => (
          <Chip
            key={preset}
            label={`${preset}°`}
            selected={plan.tempC === preset}
            onPress={() => plan.setTemp(preset)}
          />
        ))}
      </ChipRow>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
});
