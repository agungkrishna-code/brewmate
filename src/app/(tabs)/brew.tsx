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
import { BrandSurface, Radius, Spacing } from '@/constants/theme';
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
import {
  clicksForSetting,
  referenceRangeLabel,
  referenceStatus,
  settingDetail,
  unitLabel,
} from '@/utils/grinder';
import { Ionicons } from '@/components/common/icon';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function BrewScreen() {
  const theme = useTheme();
  const plan = useBrewPlan();
  const { beginBrew } = useBrewDraft();
  const { preferences, setLastGrinderId } = useSettings();

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
  const rangeState = grinder ? referenceStatus(grinder, grindSetting) : 'none';
  const rangeStatusText =
    rangeState === 'inside'
      ? 'Within V60 range'
      : rangeState === 'below'
        ? 'Finer than V60 range'
        : rangeState === 'above'
          ? 'Coarser than V60 range'
          : null;

  const start = () => {
    if (grinderId) {
      setLastGrinderId(grinderId).catch(() => undefined);
    }
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
        <View style={styles.headerActions}>
          <IconButton
            icon="refresh"
            label="Reset calculator"
            onPress={() => {
              plan.reset();
              setGrindSetting(null);
            }}
          />
          <IconButton
            icon="bookmark-outline"
            label="Save this plan as a recipe"
            onPress={saveAsRecipe}
          />
        </View>
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
                    : 'No published reference. Record your own.',
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Pick a grinder to see its click maths.'
          }
        />
        {grinder && grindSetting != null ? (
          <View style={styles.grindMetaRow}>
            <AppText variant="caption" tone="muted" style={styles.flex}>
              {[
                `${clicksForSetting(grinder, grindSetting)} clicks on ${grinder.name}`,
                rangeStatusText,
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear the grind setting"
              hitSlop={8}
              onPress={() => setGrindSetting(null)}
              style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.6 : 1 }]}>
              <Ionicons name="close-circle-outline" size={14} color={theme.primary} />
              <AppText variant="caption" tone="primary">
                Clear
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Reading the numbers"
          subtitle="What each control changes"
          actionLabel="Guide"
          onAction={() => router.push('/guide/water-and-ratio')}
        />
        <View style={[styles.tipCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TipRow
            label="Ratio"
            text="Sets strength. 1:15 is heavier, 1:17 is lighter. It is not the tool for fixing sour or bitter coffee."
          />
          <TipRow
            label="Temperature"
            text="Sets extraction speed. Light roasts are happier at 94 to 96°C; dark roasts at 88 to 92°C."
          />
          <TipRow
            label="Grind"
            text="Sets flow and extraction. Change it one click at a time, with everything else held still."
          />
        </View>
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
          setLastGrinderId(value).catch(() => undefined);
        }}
      />
    </Screen>
  );
}

function TipRow({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.tipRow}>
      <AppText variant="caption" tone="faint">
        {label}
      </AppText>
      <AppText variant="small">{text}</AppText>
    </View>
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
    paddingVertical: 2,
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
  tipCard: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tipRow: { gap: 2 },
  flex: { flex: 1 },
});
