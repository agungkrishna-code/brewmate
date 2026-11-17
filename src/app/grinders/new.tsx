import { Button } from '@/components/common/button';
import { NumberField, SelectField, TextField } from '@/components/common/field';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { OptionSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { EMPTY_GRINDER_DRAFT } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useDatabase } from '@/hooks/use-database';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { createGrinder } from '@/services/grinders';
import type { GrinderSettingUnit } from '@/types';
import {
  validateGrinder,
  type GrinderErrorKey,
  type ValidationErrors,
} from '@/utils/validation';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function NewGrinderScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const db = useDatabase();
  const { lang, t } = useTranslation();

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
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors<GrinderErrorKey>>({});
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const errors = validateGrinder(
      {
        ...EMPTY_GRINDER_DRAFT,
        name,
        clicksPerRotation: clicksPerRotation ?? 0,
        micronsPerClick: micronsPerClick ?? 0,
        referenceMin,
        referenceMax,
      },
      lang
    );
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      haptics.error();
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
      haptics.success();
      router.back();
    } catch (caught) {
      haptics.error();
      setError(caught instanceof Error ? caught.message : t.grinder.saveError);
      setSaving(false);
    }
  };

  return (
    <StackScreen
      title={t.grinder.newTitle}
      subtitle={t.grinder.newSubtitle}
      footer={
        <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <Button
            label={t.grinder.saveGrinder}
            variant="accent"
            onPress={save}
            loading={saving}
            size="lg"
            fullWidth
            // Result feedback comes from the save handler.
            haptic="none"
          />
        </View>
      }>
      {error ? (
        <View style={[styles.banner, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
          <AppText variant="small" tone="danger">
            {error}
          </AppText>
        </View>
      ) : null}

      <TextField
        label={t.grinder.grinderName}
        value={name}
        onChangeText={setName}
        placeholder={t.grinder.grinderNamePlaceholder}
        error={fieldErrors.name}
        required
        maxLength={60}
      />
      <View style={styles.gap} />
      <TextField
        label={t.grinder.brand}
        value={brand}
        onChangeText={setBrand}
        placeholder={t.grinder.brandPlaceholder}
        maxLength={40}
      />

      <View style={styles.section}>
        <SectionHeader
          title={t.grinder.adjustmentSection}
          subtitle={t.grinder.adjustmentSub}
        />
        <View style={styles.row}>
          <NumberField
            label={t.grinder.clicksPerRotation}
            value={clicksPerRotation}
            onChange={setClicksPerRotation}
            step={1}
            min={1}
            decimals={0}
            stepper
            error={fieldErrors.clicksPerRotation}
            style={styles.flex}
          />
          <NumberField
            label={t.grinder.micronsPerClick}
            value={micronsPerClick}
            onChange={setMicronsPerClick}
            suffix="µm"
            step={1}
            min={1}
            decimals={0}
            stepper
            error={fieldErrors.micronsPerClick}
            style={styles.flex}
          />
        </View>
        <View style={styles.gap} />
        <SelectField
          label={t.grinder.howYouEnter}
          value={unit === 'rotations' ? t.grinder.rotationsExample : t.grinder.clicksExample}
          icon="sliders"
          onPress={() => setUnitSheet(true)}
        />
        <View style={styles.gap} />
        <NumberField
          label={t.grinder.macroStepsLabel}
          value={macroSteps}
          onChange={setMacroSteps}
          step={1}
          min={1}
          decimals={0}
          stepper
          allowEmpty
          placeholder={t.common.optional}
          hint={t.grinder.macroStepsHint}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title={t.grinder.manufacturerRef}
          subtitle={t.grinder.manufacturerRefSub}
        />
        <View style={styles.row}>
          <NumberField
            label={t.grinder.from}
            value={referenceMin}
            onChange={setReferenceMin}
            step={0.5}
            min={0}
            decimals={2}
            stepper
            allowEmpty
            placeholder="–"
            error={fieldErrors.referenceRange}
            style={styles.flex}
          />
          <NumberField
            label={t.grinder.to}
            value={referenceMax}
            onChange={setReferenceMax}
            step={0.5}
            min={0}
            decimals={2}
            stepper
            allowEmpty
            placeholder="–"
            style={styles.flex}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.grinder.notesSection} />
        <TextField
          label={t.grinder.notesLabel}
          value={notes}
          onChangeText={setNotes}
          placeholder={t.grinder.notesPlaceholder}
          multiline
          maxLength={400}
        />
      </View>

      <OptionSheet
        visible={unitSheet}
        onClose={() => setUnitSheet(false)}
        title={t.grinder.settingUnitSheetTitle}
        subtitle={t.grinder.settingUnitSheetSub}
        options={[
          {
            label: t.grinder.dialRotations,
            value: 'rotations',
            detail: t.grinder.rotationsDetail,
          },
          {
            label: t.grinder.clicksFromZero,
            value: 'clicks',
            detail: t.grinder.clicksDetail,
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
  banner: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
