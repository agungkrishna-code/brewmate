import { Facts } from '@/components/brewing/facts';
import { PlanInputs } from '@/components/brewing/plan-inputs';
import { StageEditor } from '@/components/brewing/stage-editor';
import { BrandCard, BrandLabel } from '@/components/common/brand-card';
import { Button, IconButton } from '@/components/common/button';
import { ErrorState } from '@/components/common/empty-state';
import { NumberField, SelectField } from '@/components/common/field';
import { AppIcon } from '@/components/common/icon';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { OptionSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { BrandSurface, Radius, Spacing } from '@/constants/theme';
import { useBrewDraft } from '@/contexts/brew-draft-context';
import { useSettings } from '@/contexts/settings-context';
import { useFocusedQuery } from '@/hooks/use-database';
import { useBrewPlan } from '@/hooks/use-brew-plan';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { listGrinders } from '@/services/grinders';
import {
  formatDuration,
  formatRatio,
  formatWeight,
} from '@/utils/formatting';
import {
  clicksForSetting,
  referenceRangeLabel,
  referenceStatus,
  settingDetail,
  unitLabel,
} from '@/utils/grinder';
import { validateRecipe } from '@/utils/validation';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

export default function BrewScreen() {
  const theme = useTheme();
  const { lang, t } = useTranslation();
  const plan = useBrewPlan();
  const { beginBrew } = useBrewDraft();
  const { preferences, setLastGrinderId } = useSettings();

  const { data, error, reload } = useFocusedQuery(async (db) => ({
    grinders: await listGrinders(db),
  }));
  const grinders = useMemo(() => data?.grinders ?? [], [data]);

  const [selectedGrinderId, setSelectedGrinderId] = useState<string | null>(null);
  const [grindSetting, setGrindSetting] = useState<number | null>(null);
  const [grinderSheetOpen, setGrinderSheetOpen] = useState(false);

  const grinderId = useMemo(() => {
    if (selectedGrinderId) return selectedGrinderId;
    const preferred = grinders.find((item) => item.id === preferences.lastGrinderId);
    return (preferred ?? grinders[0])?.id ?? null;
  }, [grinders, preferences.lastGrinderId, selectedGrinderId]);

  const grinder = grinders.find((item) => item.id === grinderId) ?? null;
  const pourCount = plan.pours.length;
  const rangeState = grinder ? referenceStatus(grinder, grindSetting) : 'none';
  const rangeStatusText =
    rangeState === 'inside'
      ? t.brew.withinRange
      : rangeState === 'below'
        ? t.brew.finerThanRange
        : rangeState === 'above'
          ? t.brew.coarserThanRange
          : null;
  const publishedRef = grinder ? referenceRangeLabel(grinder, lang) : null;

  const start = () => {
    // Number fields commit what was typed before the blur clamps it, so the plan
    // has to be checked here: typing "1:400" and tapping Start used to log a
    // brew with an impossible water target.
    const blocking = Object.values(
      validateRecipe(
        {
          name: t.brew.calculatorBrewName,
          coffeeDoseG: plan.doseG,
          ratio: plan.ratio,
          waterTempC: plan.tempC,
          bloomMultiplier: plan.bloomMultiplier,
          bloomDurationS: plan.bloomDurationS,
          steps: plan.steps,
          totalWaterG: plan.totalWaterG,
        },
        lang
      )
    ).find(Boolean);
    if (blocking) {
      Alert.alert(t.brew.checkPlanTitle, blocking);
      return;
    }
    if (grinderId) {
      setLastGrinderId(grinderId).catch(() => undefined);
    }
    beginBrew({
      recipeId: null,
      recipeName: t.brew.calculatorBrewName,
      coffeeDoseG: plan.doseG,
      ratio: plan.ratio,
      waterTempC: plan.tempC,
      bloomMultiplier: plan.bloomMultiplier,
      bloomDurationS: plan.bloomDurationS,
      steps: plan.steps,
      grinderProfileId: grinderId,
      grindSetting,
      coffeeBeanId: null,
      notes: '',
      source: 'calculator',
    });
    router.push('/brewing/timer');
  };

  const saveAsRecipe = () => {
    const prefill = {
      name: '',
      description: '',
      coffeeDoseG: plan.doseG,
      ratio: plan.ratio,
      waterTempC: plan.tempC,
      bloomMultiplier: plan.bloomMultiplier,
      bloomDurationS: plan.bloomDurationS,
      grinderProfileId: grinderId,
      grindSetting,
      notes: '',
      steps: plan.steps,
    };
    router.push(`/recipes/new?prefill=${encodeURIComponent(JSON.stringify(prefill))}`);
  };

  return (
    <Screen
      footer={
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.bg, borderTopColor: theme.border },
          ]}>
          <View style={styles.footerText}>
            <AppText variant="caption" tone="faint">
              {t.brew.totalTime}
            </AppText>
            <AppText variant="metric">{formatDuration(plan.totalTimeS)}</AppText>
          </View>
          <Button
            label={t.brew.startBrewing}
            icon="play"
            variant="accent"
            size="lg"
            onPress={start}
            style={styles.footerButton}
          />
        </View>
      }>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <AppText variant="display">{t.brew.title}</AppText>
          <AppText variant="small" tone="muted" style={styles.subtitle}>
            {t.brew.subtitle}
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="reset"
            label={t.brew.resetA11y}
            onPress={() => {
              plan.reset();
              setGrindSetting(null);
            }}
          />
          <IconButton
            icon="book"
            label={t.brew.saveRecipeA11y}
            onPress={saveAsRecipe}
          />
        </View>
      </View>

      <BrandCard style={styles.summary}>
        <BrandLabel>{t.brew.livePlan}</BrandLabel>
        <AppText variant="metricHero" color={BrandSurface.text} style={styles.summaryTitle}>
          {formatWeight(plan.totalWaterG, true)}
        </AppText>
        <AppText variant="small" color={BrandSurface.muted} tabular>
          {t.brew.summaryLine(
            formatWeight(plan.doseG, true),
            formatRatio(plan.ratio),
            formatWeight(plan.bloomWaterG, true),
            pourCount
          )}
        </AppText>
        <View style={[styles.divider, { backgroundColor: BrandSurface.line }]} />
        <Facts
          tone="brand"
          items={[
            { label: t.common.dose, value: formatWeight(plan.doseG), unit: 'g' },
            { label: t.common.water, value: formatWeight(plan.totalWaterG), unit: 'g' },
            { label: t.common.ratio, value: formatRatio(plan.ratio) },
            { label: t.common.time, value: formatDuration(plan.totalTimeS) },
          ]}
        />
      </BrandCard>

      {error ? (
        <View style={styles.section}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={t.brew.coffeeAndWater} subtitle={t.brew.coffeeAndWaterSub} />
        <PlanInputs plan={plan} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title={t.brew.bloomAndPours}
          subtitle={t.brew.bloomAndPoursSub}
        />
        <StageEditor plan={plan} />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.brew.grinderSection} subtitle={t.brew.grinderSectionSub} />
        <SelectField
          label={t.brew.grinderModel}
          value={grinder?.name ?? t.brew.chooseGrinder}
          icon="disc"
          onPress={() => setGrinderSheetOpen(true)}
        />
        <View style={styles.grinderSpacer} />
        <NumberField
          label={t.brew.grindSetting}
          value={grindSetting}
          onChange={setGrindSetting}
          suffix={grinder ? unitLabel(grinder, grindSetting, lang) : undefined}
          step={0.5}
          decimals={2}
          stepper
          allowEmpty
          placeholder={t.brew.grindPlaceholder}
          hint={
            grinder
              ? [
                  grindSetting != null ? settingDetail(grinder, grindSetting, lang) : null,
                  publishedRef
                    ? t.brew.publishedReference(publishedRef)
                    : t.brew.noPublishedReference,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : t.brew.pickGrinderHint
          }
        />
        {grinder && grindSetting != null ? (
          <View style={styles.grindMetaRow}>
            <AppText variant="caption" tone="muted" tabular style={styles.flex}>
              {[
                t.brew.clicksOnGrinder(clicksForSetting(grinder, grindSetting), grinder.name),
                rangeStatusText,
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.brew.clearGrindA11y}
              hitSlop={8}
              onPress={() => setGrindSetting(null)}
              style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.6 : 1 }]}>
              <AppIcon name="x-circle" size={14} color={theme.accent} />
              <AppText variant="caption" tone="accent">
                {t.common.clear}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.brew.guideA11y}
        onPress={() => router.push('/guide/water-and-ratio')}
        style={({ pressed }) => [
          styles.guideLink,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <AppIcon name="book-open" size={17} color={theme.accent} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{t.brew.guideTitle}</AppText>
          <AppText variant="caption" tone="muted">
            {t.brew.guideSubtitle}
          </AppText>
        </View>
        <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
      </Pressable>

      <OptionSheet
        visible={grinderSheetOpen}
        onClose={() => setGrinderSheetOpen(false)}
        title={t.brew.grinderModel}
        subtitle={t.brew.grinderSheetSub}
        options={grinders.map((item) => ({
          label: item.name,
          value: item.id,
          detail: `${item.brand} · ${t.brew.clicksPerRotation(item.clicksPerRotation)}`,
        }))}
        selected={grinderId}
        onSelect={(value) => {
          setSelectedGrinderId(value);
          setGrindSetting(null);
          setLastGrinderId(value).catch(() => undefined);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subtitle: { marginTop: Spacing.xs },
  summary: { marginTop: Spacing.xl, gap: Spacing.xs },
  summaryTitle: { marginTop: Spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.md },
  section: { marginTop: Spacing.xxl },
  grinderSpacer: { height: Spacing.md },
  grindMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: { gap: 1 },
  footerButton: { flex: 1 },
  guideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  flex: { flex: 1 },
});
