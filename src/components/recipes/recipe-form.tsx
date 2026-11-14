import { PlanInputs } from '@/components/brewing/plan-inputs';
import { StageEditor } from '@/components/brewing/stage-editor';
import { Button, IconButton } from '@/components/common/button';
import { NumberField, SelectField, SwitchRow, TextField } from '@/components/common/field';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { OptionSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { DISCLAIMERS } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useDatabase, useQuery } from '@/hooks/use-database';
import { useBrewPlan } from '@/hooks/use-brew-plan';
import { useTheme } from '@/hooks/use-theme';
import { createRecipe, updateRecipe } from '@/services/recipes';
import { listGrinders } from '@/services/grinders';
import type { BrewRecipe, PourStep, RecipeDraft } from '@/types';
import { formatDuration } from '@/utils/formatting';
import { referenceRangeLabel, unitLabel } from '@/utils/grinder';
import { validateRecipe, type RecipeErrorKey, type ValidationErrors } from '@/utils/validation';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export interface RecipePrefill {
  name?: string;
  description?: string;
  coffeeDoseG: number;
  ratio: number;
  waterTempC: number;
  bloomMultiplier: number;
  bloomDurationS: number;
  grinderProfileId: string | null;
  grindSetting: number | null;
  notes?: string;
  steps: PourStep[];
}

interface RecipeFormProps {
  initialRecipe?: BrewRecipe | null;
  prefill?: RecipePrefill | null;
}

function seedFromPrefill(prefill: RecipePrefill): BrewRecipe {
  const lastStep = prefill.steps[prefill.steps.length - 1];
  return {
    id: 'prefill',
    name: prefill.name ?? '',
    description: prefill.description ?? null,
    coffeeDoseG: prefill.coffeeDoseG,
    ratio: prefill.ratio,
    totalWaterG: lastStep?.targetWaterG ?? Math.round(prefill.coffeeDoseG * prefill.ratio * 10) / 10,
    waterTempC: prefill.waterTempC,
    bloomMultiplier: prefill.bloomMultiplier,
    bloomDurationS: prefill.bloomDurationS,
    grinderProfileId: prefill.grinderProfileId,
    grindSetting: prefill.grindSetting,
    targetTimeS: 0,
    notes: prefill.notes ?? null,
    isFavorite: false,
    isStarter: false,
    createdAt: '',
    updatedAt: '',
    steps: prefill.steps,
  };
}

export function RecipeForm({ initialRecipe, prefill }: RecipeFormProps) {
  const theme = useTheme();
  const db = useDatabase();

  const seed = useMemo(() => {
    if (initialRecipe) return initialRecipe;
    if (prefill) return seedFromPrefill(prefill);
    return null;
    // The seed is only read once; later edits live in the plan hook.
  }, [initialRecipe, prefill]);

  const plan = useBrewPlan(seed);
  const { data: grinders } = useQuery(async (database) => listGrinders(database));
  const grinderList = grinders ?? [];

  const [name, setName] = useState(initialRecipe?.name ?? prefill?.name ?? '');
  const [description, setDescription] = useState(
    initialRecipe?.description ?? prefill?.description ?? ''
  );
  const [notes, setNotes] = useState(initialRecipe?.notes ?? prefill?.notes ?? '');
  const [isFavorite, setIsFavorite] = useState(initialRecipe?.isFavorite ?? false);
  const [grinderId, setGrinderId] = useState<string | null>(
    initialRecipe?.grinderProfileId ?? prefill?.grinderProfileId ?? null
  );
  const [grindSetting, setGrindSetting] = useState<number | null>(
    initialRecipe?.grindSetting ?? prefill?.grindSetting ?? null
  );
  const [grinderSheetOpen, setGrinderSheetOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors<RecipeErrorKey>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const grinder = grinderList.find((item) => item.id === grinderId) ?? null;
  const isEditing = Boolean(initialRecipe);

  const save = async () => {
    const nextErrors = validateRecipe({
      name,
      coffeeDoseG: plan.doseG,
      ratio: plan.ratio,
      waterTempC: plan.tempC,
      bloomMultiplier: plan.bloomMultiplier,
      bloomDurationS: plan.bloomDurationS,
      steps: plan.steps,
      totalWaterG: plan.totalWaterG,
    });
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const draft: RecipeDraft = {
      name: name.trim(),
      description,
      coffeeDoseG: plan.doseG,
      ratio: plan.ratio,
      waterTempC: plan.tempC,
      bloomMultiplier: plan.bloomMultiplier,
      bloomDurationS: plan.bloomDurationS,
      grinderProfileId: grinderId,
      grindSetting,
      notes,
      isFavorite,
      steps: plan.steps,
    };

    setSaving(true);
    setSaveError(null);
    try {
      if (initialRecipe) {
        await updateRecipe(db, initialRecipe.id, draft);
        router.back();
      } else {
        const id = await createRecipe(db, draft);
        router.replace(`/recipes/${id}`);
      }
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not save the recipe.');
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            label={isEditing ? 'Save changes' : 'Create recipe'}
            onPress={save}
            loading={saving}
            size="lg"
            fullWidth
          />
        </View>
      }>
      <View style={styles.navRow}>
        <IconButton icon="close" label="Cancel" onPress={() => router.back()} />
      </View>

      <View style={styles.header}>
        <AppText variant="display">{isEditing ? 'Edit recipe' : 'New recipe'}</AppText>
        <AppText variant="small" tone="muted" style={styles.subtitle}>
          {formatDuration(plan.totalTimeS)} · {plan.pours.length}{' '}
          {plan.pours.length === 1 ? 'pour' : 'pours'} · bloom{' '}
          {Math.round(plan.bloomWaterG * 10) / 10} g
        </AppText>
      </View>

      {saveError || Object.values(errors).some(Boolean) ? (
        <View style={[styles.banner, { backgroundColor: theme.dangerSoft }]}>
          <AppText variant="small" tone="danger">
            {saveError ?? Object.values(errors).find(Boolean)}
          </AppText>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="The basics" />
        <TextField
          label="Recipe name"
          value={name}
          onChangeText={setName}
          placeholder="Morning V60"
          error={errors.name}
          required
          maxLength={60}
        />
        <View style={styles.gap} />
        <TextField
          label="Short description"
          value={description}
          onChangeText={setDescription}
          placeholder="What this recipe is for"
          maxLength={140}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Coffee & water" />
        <PlanInputs plan={plan} errors={errors} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Bloom & pours"
          subtitle="Water always adds up to the total above"
        />
        {errors.steps || errors.bloomMultiplier || errors.bloomDurationS ? (
          <AppText variant="caption" tone="danger" style={styles.stepError}>
            {[errors.steps, errors.bloomMultiplier, errors.bloomDurationS]
              .filter(Boolean)
              .join(' ')}
          </AppText>
        ) : null}
        <StageEditor plan={plan} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Grinder" subtitle="Stored per model, never converted" />
        <SelectField
          label="Grinder model"
          value={grinder?.name ?? 'No grinder selected'}
          icon="disc-outline"
          onPress={() => setGrinderSheetOpen(true)}
          hint="Optional. You can also record the grind when you brew."
        />
        <View style={styles.gap} />
        <NumberField
          label="Grind setting"
          value={grindSetting}
          onChange={setGrindSetting}
          suffix={grinder ? unitLabel(grinder, grindSetting) : undefined}
          step={0.5}
          decimals={2}
          placeholder="e.g. 6.5"
          hint={grinder ? referenceRangeLabel(grinder) ?? undefined : undefined}
        />
        {grinder ? (
          <Button
            label="Clear grinder"
            variant="ghost"
            size="sm"
            onPress={() => {
              setGrinderId(null);
              setGrindSetting(null);
            }}
            style={styles.clearButton}
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Notes" />
        <TextField
          label="Personal notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="What to remember next time"
          multiline
          maxLength={600}
        />
        <View style={styles.favoriteRow}>
          <SwitchRow
            label="Favourite recipe"
            description="Pin it to the dashboard and the top of the library."
            value={isFavorite}
            onValueChange={setIsFavorite}
          />
        </View>
        <AppText variant="caption" tone="faint" style={styles.disclaimer}>
          {DISCLAIMERS.starterRecipes}
        </AppText>
      </View>

      <OptionSheet
        visible={grinderSheetOpen}
        onClose={() => setGrinderSheetOpen(false)}
        title="Grinder model"
        options={[
          { label: 'No grinder', value: 'none', detail: 'Record the grind later' },
          ...grinderList.map((item) => ({
            label: item.name,
            value: item.id,
            detail: `${item.clicksPerRotation} clicks/rotation · ${item.micronsPerClick} µm/click`,
          })),
        ]}
        selected={grinderId ?? 'none'}
        onSelect={(value) => {
          if (value === 'none') {
            setGrinderId(null);
            setGrindSetting(null);
            return;
          }
          if (value !== grinderId) setGrindSetting(null);
          setGrinderId(value);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  navRow: { paddingTop: Spacing.md, alignItems: 'flex-start' },
  header: { paddingTop: Spacing.lg },
  subtitle: { marginTop: Spacing.xs },
  section: { marginTop: Spacing.xxl },
  gap: { height: Spacing.md },
  banner: { padding: Spacing.md, borderRadius: Radius.md, marginTop: Spacing.lg },
  stepError: { marginBottom: Spacing.sm },
  clearButton: { alignSelf: 'flex-start', marginTop: Spacing.sm },
  favoriteRow: { marginTop: Spacing.lg },
  disclaimer: { marginTop: Spacing.md },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
