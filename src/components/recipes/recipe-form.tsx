import { PlanInputs } from '@/components/brewing/plan-inputs';
import { StageEditor } from '@/components/brewing/stage-editor';
import { Button, IconButton } from '@/components/common/button';
import { NumberField, SelectField, SwitchRow, TextField } from '@/components/common/field';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { OptionSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { getDisclaimers } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useDatabase, useQuery } from '@/hooks/use-database';
import { useBrewPlan } from '@/hooks/use-brew-plan';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
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
  const haptics = useHaptics();
  const db = useDatabase();
  const { lang, t } = useTranslation();
  const disclaimers = getDisclaimers(lang);

  const seed = useMemo(() => {
    if (initialRecipe) return initialRecipe;
    if (prefill) return seedFromPrefill(prefill);
    return null;
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
    const nextErrors = validateRecipe(
      {
        name,
        coffeeDoseG: plan.doseG,
        ratio: plan.ratio,
        waterTempC: plan.tempC,
        bloomMultiplier: plan.bloomMultiplier,
        bloomDurationS: plan.bloomDurationS,
        steps: plan.steps,
        totalWaterG: plan.totalWaterG,
      },
      lang
    );
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      // Validation failed: buzz distinct from the tap so the user looks up.
      haptics.error();
      return;
    }

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
        haptics.success();
        router.back();
      } else {
        const id = await createRecipe(db, draft);
        haptics.success();
        router.replace(`/recipes/${id}`);
      }
    } catch (caught) {
      haptics.error();
      setSaveError(caught instanceof Error ? caught.message : t.recipeForm.saveError);
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <Button
            label={isEditing ? t.recipeForm.saveChanges : t.recipeForm.createRecipe}
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
      <View style={styles.navRow}>
        <IconButton icon="close" label={t.common.cancel} onPress={() => router.back()} />
      </View>

      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <AppText variant="display">
          {isEditing ? t.recipeForm.editTitle : t.recipeForm.newTitle}
        </AppText>
        <AppText variant="small" tone="muted" tabular style={styles.subtitle}>
          {t.recipeForm.subtitle(
            formatDuration(plan.totalTimeS),
            plan.pours.length,
            Math.round(plan.bloomWaterG * 10) / 10
          )}
        </AppText>
      </View>

      {saveError || Object.values(errors).some(Boolean) ? (
        <View style={[styles.banner, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
          <AppText variant="small" tone="danger">
            {saveError ?? Object.values(errors).find(Boolean)}
          </AppText>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={t.recipeForm.basics} />
        <TextField
          label={t.recipeForm.recipeName}
          value={name}
          onChangeText={setName}
          placeholder={t.recipeForm.recipeNamePlaceholder}
          error={errors.name}
          required
          maxLength={60}
        />
        <View style={styles.gap} />
        <TextField
          label={t.recipeForm.shortDesc}
          value={description}
          onChangeText={setDescription}
          placeholder={t.recipeForm.shortDescPlaceholder}
          multiline
          maxLength={140}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.recipeForm.coffeeAndWater} />
        <PlanInputs plan={plan} errors={errors} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title={t.recipeForm.bloomAndPours}
          subtitle={t.recipeForm.bloomAndPoursSub}
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
        <SectionHeader title={t.recipeForm.grinder} subtitle={t.recipeForm.grinderSub} />
        <SelectField
          label={t.recipeForm.grinderModel}
          value={grinder?.name ?? t.recipeForm.noGrinderSelected}
          icon="disc"
          onPress={() => setGrinderSheetOpen(true)}
          hint={t.recipeForm.grinderHint}
        />
        <View style={styles.gap} />
        <NumberField
          label={t.recipeForm.grindSetting}
          value={grindSetting}
          onChange={setGrindSetting}
          suffix={grinder ? unitLabel(grinder, grindSetting, lang) : undefined}
          step={0.5}
          decimals={2}
          stepper
          allowEmpty
          placeholder={t.recipeForm.grindPlaceholder}
          hint={grinder ? referenceRangeLabel(grinder, lang) ?? undefined : undefined}
        />
        {grinder ? (
          <Button
            label={t.recipeForm.clearGrinder}
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
        <SectionHeader title={t.recipeForm.notes} />
        <TextField
          label={t.recipeForm.personalNotes}
          value={notes}
          onChangeText={setNotes}
          placeholder={t.recipeForm.personalNotesPlaceholder}
          multiline
          maxLength={600}
        />
        <View style={styles.favoriteRow}>
          <SwitchRow
            label={t.recipeForm.favouriteLabel}
            description={t.recipeForm.favouriteDesc}
            value={isFavorite}
            onValueChange={setIsFavorite}
          />
        </View>
        <AppText variant="caption" tone="faint" style={styles.disclaimer}>
          {disclaimers.starterRecipes}
        </AppText>
      </View>

      <OptionSheet
        visible={grinderSheetOpen}
        onClose={() => setGrinderSheetOpen(false)}
        title={t.recipeForm.grinderModel}
        options={[
          {
            label: t.recipeForm.noGrinderOption,
            value: 'none',
            detail: t.recipeForm.noGrinderOptionDetail,
          },
          ...grinderList.map((item) => ({
            label: item.name,
            value: item.id,
            detail: t.recipeForm.clicksAndMicrons(item.clicksPerRotation, item.micronsPerClick),
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
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subtitle: { marginTop: Spacing.xs },
  section: { marginTop: Spacing.xxl },
  gap: { height: Spacing.md },
  banner: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
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
