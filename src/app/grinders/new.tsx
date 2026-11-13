import { Button } from '@/components/common/button';
import { NumberField, SelectField, TextField } from '@/components/common/field';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { OptionSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { EMPTY_GRINDER_DRAFT } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useDatabase } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { createGrinder } from '@/services/grinders';
import type { GrinderSettingUnit } from '@/types';
import { validateGrinder } from '@/utils/validation';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function NewGrinderScreen() {
  const theme = useTheme();
  const db = useDatabase();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('TIMEMORE');
  const [clicksPerRotation, setClicksPerRotation] = useState<number | null>(60);
  const [micronsPerClick, setMicronsPerClick] = useState<number | null>(20);
  const [macroSteps, setMacroSteps] = useState<number | null>(null);
  const [unit, setUnit] = useState<GrinderSettingUnit>('clicks');
  const [unitSheet, setUnitSheet] = useState(false);
  const [referenceMin, setReferenceMin] = useState<number | null>(null);
  const [referenceMax, setReferenceMax] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const errors = validateGrinder({
      ...EMPTY_GRINDER_DRAFT,
      name,
      clicksPerRotation: clicksPerRotation ?? 0,
      micronsPerClick: micronsPerClick ?? 0,
    });
    if (Object.values(errors).some(Boolean)) {
      setError(Object.values(errors).filter(Boolean).join(' '));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createGrinder(db, {
        name,
        brand,
        model: 'custom',
        clicksPerRotation: clicksPerRotation ?? 60,
        settingUnit: unit,
        micronsPerClick: micronsPerClick ?? 20,
        macroStepsPerRotation: macroSteps,
        referenceMin,
        referenceMax,
        referenceNote: null,
        preferredMin: null,
        preferredMax: null,
        notes: notes.trim() || null,
      });
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the grinder.');
      setSaving(false);
    }
  };

  return (
    <StackScreen
      title="Add a grinder"
      subtitle="Any hand grinder with a click or dial adjustment"
      footer={
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button label="Save grinder" onPress={save} loading={saving} size="lg" fullWidth />
        </View>
      }>
      {error ? (
        <View style={[styles.banner, { backgroundColor: theme.dangerSoft }]}>
          <AppText variant="small" tone="danger">
            {error}
          </AppText>
        </View>
      ) : null}

      <TextField
        label="Grinder name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. KINGrinder K6"
        required
        maxLength={60}
      />
      <View style={styles.gap} />
      <TextField
        label="Brand"
        value={brand}
        onChangeText={setBrand}
        placeholder="Manufacturer"
        maxLength={40}
      />

      <View style={styles.section}>
        <SectionHeader
          title="Adjustment"
          subtitle="These numbers define the click maths for this model"
        />
        <View style={styles.row}>
          <NumberField
            label="Clicks per rotation"
            value={clicksPerRotation}
            onChange={setClicksPerRotation}
            step={1}
            min={1}
            decimals={0}
            style={styles.flex}
          />
          <NumberField
            label="Microns per click"
            value={micronsPerClick}
            onChange={setMicronsPerClick}
            suffix="µm"
            step={1}
            min={1}
            decimals={0}
            style={styles.flex}
          />
        </View>
        <View style={styles.gap} />
        <SelectField
          label="How you enter settings"
          value={unit === 'rotations' ? 'Dial rotations (e.g. 6.5)' : 'Clicks from zero (e.g. 20)'}
          icon="options-outline"
          onPress={() => setUnitSheet(true)}
        />
        <View style={styles.gap} />
        <NumberField
          label="Macro steps per rotation"
          value={macroSteps}
          onChange={setMacroSteps}
          step={1}
          min={1}
          decimals={0}
          placeholder="Optional"
          hint="Only if the dial has numbered macro steps."
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Manufacturer reference"
          subtitle="Optional — leave empty if none is published"
        />
        <View style={styles.row}>
          <NumberField
            label="From"
            value={referenceMin}
            onChange={setReferenceMin}
            step={0.5}
            decimals={2}
            placeholder="—"
            style={styles.flex}
          />
          <NumberField
            label="To"
            value={referenceMax}
            onChange={setReferenceMax}
            step={0.5}
            decimals={2}
            placeholder="—"
            style={styles.flex}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Notes" />
        <TextField
          label="Anything worth remembering"
          value={notes}
          onChangeText={setNotes}
          placeholder="Zero point, alignment, quirks"
          multiline
          maxLength={400}
        />
      </View>

      <OptionSheet
        visible={unitSheet}
        onClose={() => setUnitSheet(false)}
        title="Setting unit"
        subtitle="Match how you actually read the dial."
        options={[
          {
            label: 'Dial rotations',
            value: 'rotations',
            detail: 'You say “6.5” and the app counts the clicks for you.',
          },
          {
            label: 'Clicks from zero',
            value: 'clicks',
            detail: 'You count individual clicks from the closed position.',
          },
        ]}
        selected={unit}
        onSelect={(value) => setUnit(value as GrinderSettingUnit)}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.xxl },
  row: { flexDirection: 'row', gap: Spacing.md },
  gap: { height: Spacing.md },
  banner: { padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.lg },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
