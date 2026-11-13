import { Facts } from '@/components/brewing/facts';
import { PlanInputs } from '@/components/brewing/plan-inputs';
import { StageEditor } from '@/components/brewing/stage-editor';
import { BrandCard, BrandLabel } from '@/components/common/brand-card';
import { Button, IconButton } from '@/components/common/button';
import { NumberField, SelectField } from '@/components/common/field';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { OptionSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { BrandSurface, Spacing } from '@/constants/theme';
import { useBrewDraft } from '@/contexts/brew-draft-context';
import { useSettings } from '@/contexts/settings-context';
import { useFocusedQuery } from '@/hooks/use-database';
import { useBrewPlan } from '@/hooks/use-brew-plan';
import { useTheme } from '@/hooks/use-theme';
import { listGrinders } from '@/services/grinders';
import {
  formatDuration,
  formatRatio,
  formatWeight,
} from '@/utils/formatting';
import { clicksForSetting, referenceRangeLabel, settingDetail, unitLabel } from '@/utils/grinder';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function BrewScreen() {
  const theme = useTheme();
  const plan = useBrewPlan();
  const { beginBrew } = useBrewDraft();
  const { preferences } = useSettings();

  const { data } = useFocusedQuery(async (db) => ({ grinders: await listGrinders(db) }));
  const grinders = useMemo(() => data?.grinders ?? [], [data]);

  const [selectedGrinderId, setSelectedGrinderId] = useState<string | null>(null);
  const [grindSetting, setGrindSetting] = useState<number | null>(null);
  const [grinderSheetOpen, setGrinderSheetOpen] = useState(false);

  // Derived rather than synced in an effect: fall back to the last used grinder,
  // then to the first profile in the database.
  const grinderId = useMemo(() => {
    if (selectedGrinderId) return selectedGrinderId;
    const preferred = grinders.find((item) => item.id === preferences.lastGrinderId);
    return (preferred ?? grinders[0])?.id ?? null;
  }, [grinders, preferences.lastGrinderId, selectedGrinderId]);

  const grinder = grinders.find((item) => item.id === grinderId) ?? null;
  const pourCount = plan.pours.length;

  const start = () => {
    beginBrew({
      recipeId: null,
      recipeName: 'Calculator brew',
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
            <AppText variant="label" tone="faint">
              Total time
            </AppText>
            <AppText variant="h3">{formatDuration(plan.totalTimeS)}</AppText>
          </View>
          <Button
            label="Start brewing"
            icon="play"
            size="lg"
            onPress={start}
            style={styles.footerButton}
          />
        </View>
      }>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <AppText variant="display">Brew</AppText>
          <AppText variant="small" tone="muted" style={styles.subtitle}>
            Dial in your V60, then follow it step by step.
          </AppText>
        </View>
        <IconButton
          icon="bookmark-outline"
          label="Save this plan as a recipe"
          onPress={saveAsRecipe}
        />
      </View>

      <BrandCard style={styles.summary}>
        <BrandLabel>Your brew</BrandLabel>
        <AppText variant="h1" color={BrandSurface.text} style={styles.summaryTitle}>
          {formatWeight(plan.totalWaterG, true)} water
        </AppText>
        <AppText variant="small" color={BrandSurface.muted}>
          {formatWeight(plan.doseG, true)} coffee · {formatRatio(plan.ratio)} · bloom{' '}
          {formatWeight(plan.bloomWaterG, true)} · {pourCount}{' '}
          {pourCount === 1 ? 'pour' : 'pours'}
        </AppText>
        <View style={[styles.divider, { backgroundColor: BrandSurface.line }]} />
        <Facts
          tone="brand"
          items={[
            { label: 'Dose', value: formatWeight(plan.doseG), unit: 'g' },
            { label: 'Water', value: formatWeight(plan.totalWaterG), unit: 'g' },
            { label: 'Ratio', value: formatRatio(plan.ratio) },
            { label: 'Time', value: formatDuration(plan.totalTimeS) },
          ]}
        />
      </BrandCard>

      <View style={styles.section}>
        <SectionHeader title="Coffee & water" subtitle="All weights in grams" />
        <PlanInputs plan={plan} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Bloom & pours"
          subtitle="Every stage is editable and always adds up"
        />
        <StageEditor plan={plan} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Grinder" subtitle="Saved with the brew you log" />
        <SelectField
          label="Grinder model"
          value={grinder?.name ?? 'Choose a grinder'}
          icon="disc-outline"
          onPress={() => setGrinderSheetOpen(true)}
        />
        <View style={styles.grinderSpacer} />
        <NumberField
          label="Grind setting"
          value={grindSetting}
          onChange={setGrindSetting}
          suffix={grinder ? unitLabel(grinder, grindSetting) : undefined}
          step={0.5}
          decimals={2}
          placeholder="e.g. 6.5"
          hint={
            grinder
              ? [
                  grindSetting != null ? settingDetail(grinder, grindSetting) : null,
                  referenceRangeLabel(grinder)
                    ? `Published reference: ${referenceRangeLabel(grinder)}`
                    : 'No published reference — record your own.',
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Pick a grinder to see its click maths.'
          }
        />
        {grinder && grindSetting != null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear the grind setting"
            onPress={() => setGrindSetting(null)}
            style={({ pressed }) => [styles.clearRow, { opacity: pressed ? 0.6 : 1 }]}>
            <AppText variant="caption" tone="faint">
              {clicksForSetting(grinder, grindSetting)} clicks on the {grinder.name}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <OptionSheet
        visible={grinderSheetOpen}
        onClose={() => setGrinderSheetOpen(false)}
        title="Grinder model"
        subtitle="Settings are never converted between models."
        options={grinders.map((item) => ({
          label: item.name,
          value: item.id,
          detail: `${item.brand} · ${item.clicksPerRotation} clicks/rotation`,
        }))}
        selected={grinderId}
        onSelect={(value) => {
          setSelectedGrinderId(value);
          setGrindSetting(null);
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
  subtitle: { marginTop: Spacing.xs },
  summary: { marginTop: Spacing.xl, gap: Spacing.xs },
  summaryTitle: { marginTop: Spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.md },
  section: { marginTop: Spacing.xxl },
  grinderSpacer: { height: Spacing.md },
  clearRow: { paddingTop: Spacing.sm, alignSelf: 'flex-start' },
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
  flex: { flex: 1 },
});
