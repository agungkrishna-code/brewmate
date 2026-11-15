import { BrandSurface, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useBrewDraft } from '@/contexts/brew-draft-context';
import { useSettings } from '@/contexts/settings-context';
import { useDatabase, useQuery } from '@/hooks/use-database';
import { useBrewingTimer } from '@/hooks/use-brewing-timer';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { buildTimeline } from '@/services/brewing/timeline';
import { StatusBar } from 'expo-status-bar';
import { listBeans } from '@/services/beans';
import { listGrinders } from '@/services/grinders';
import { createSession } from '@/services/journal';
import type { BrewRatings, BrewDraft, RatingKey } from '@/types';
import {
  EMPTY_RATINGS,
  getRatingCategories,
  getStageInstructions,
  localizeProcessMethod,
  localizeRoastLevel,
  localizeStepLabel,
} from '@/constants/defaults';
import { formatDuration, formatStopwatch, formatWeight } from '@/utils/formatting';
import { unitLabel, referenceRangeLabel } from '@/utils/grinder';
import { AppIcon } from '@/components/common/icon';
import { Button } from '@/components/common/button';
import { NumberField, SelectField, TextField } from '@/components/common/field';
import { StarRating } from '@/components/common/rating';
import { BottomSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { TimerRing } from '@/components/brewing/timer-ring';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KEEP_AWAKE_TAG = 'brewmate-brewing';

export default function BrewingTimerScreen() {
  const { draft, clearBrew } = useBrewDraft();

  if (!draft) {
    return <EmptyTimer onBack={() => router.back()} />;
  }

  return <BrewingTimer draft={draft} onLeave={clearBrew} />;
}

function EmptyTimer({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + Spacing.xxl,
          paddingHorizontal: Spacing.xl,
          justifyContent: 'center',
        },
      ]}>
      <StatusBar style="light" />
      <AppText variant="h1" color={BrandSurface.text}>
        {t.timer.emptyTitle}
      </AppText>
      <AppText variant="small" color={BrandSurface.muted} style={styles.emptyText}>
        {t.timer.emptyDesc}
      </AppText>
      <Button
        label={t.timer.goToCalculator}
        variant="accent"
        size="lg"
        onPress={() => router.replace('/brew')}
        style={styles.emptyButton}
      />
      <Button label={t.common.back} variant="inverseSecondary" onPress={onBack} />
    </View>
  );
}

function BrewingTimer({ draft, onLeave }: { draft: BrewDraft; onLeave: () => void }) {
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const theme = useTheme();
  const { lang, t } = useTranslation();
  const { preferences, setLastGrinderId } = useSettings();
  const hapticsEnabled = preferences.haptics;
  const stageInstructions = getStageInstructions(lang);
  const ratingCategories = getRatingCategories(lang);

  const stages = useMemo(() => buildTimeline(draft.steps), [draft.steps]);

  const timer = useBrewingTimer({
    stages,
    hapticsEnabled,
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [beanId, setBeanId] = useState<string | null>(draft.coffeeBeanId);
  const [grinderId, setGrinderId] = useState<string | null>(draft.grinderProfileId);
  const [grindSetting, setGrindSetting] = useState<number | null>(draft.grindSetting);
  const [ratings, setRatings] = useState<BrewRatings>(EMPTY_RATINGS);
  const [notes, setNotes] = useState('');
  const [picker, setPicker] = useState<'bean' | 'grinder' | null>(null);

  const { data: library } = useQuery(async (database) => {
    const [beans, grinders] = await Promise.all([listBeans(database), listGrinders(database)]);
    return { beans, grinders };
  });

  const beans = library?.beans ?? [];
  const grinders = library?.grinders ?? [];
  const grinder = grinders.find((item) => item.id === grinderId) ?? null;
  const bean = beans.find((item) => item.id === beanId) ?? null;

  useEffect(() => {
    if (!preferences.keepAwake) return;
    if (timer.status !== 'running' && timer.status !== 'paused') return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [preferences.keepAwake, timer.status]);

  const activeStage = timer.activeStage;
  const stageTarget = activeStage?.targetWaterG ?? 0;
  const instruction = activeStage
    ? stageInstructions[activeStage.kind]
    : t.timer.defaultInstruction;

  const exit = useCallback(() => {
    if (timer.status === 'idle') {
      onLeave();
      router.back();
      return;
    }
    Alert.alert(
      timer.isFinished ? t.timer.discardTitle : t.timer.leaveTitle,
      timer.isFinished ? t.timer.discardMsg : t.timer.leaveMsg,
      [
        { text: t.timer.keepBrewing, style: 'cancel' },
        {
          text: t.timer.leave,
          style: 'destructive',
          onPress: () => {
            onLeave();
            router.back();
          },
        },
      ]
    );
  }, [onLeave, t, timer.isFinished, timer.status]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      exit();
      return true;
    });
    return () => subscription.remove();
  }, [exit]);

  const saveSession = useCallback(async () => {
    setSaving(true);
    try {
      const id = await createSession(db, {
        brewedAt: new Date().toISOString(),
        coffeeBeanId: beanId,
        recipeId: draft.recipeId,
        recipeNameFallback: draft.recipeName,
        grinderProfileId: grinderId,
        grindSetting,
        coffeeDoseG: draft.coffeeDoseG,
        ratio: draft.ratio,
        waterTempC: draft.waterTempC,
        totalWaterG: draft.steps[draft.steps.length - 1]?.targetWaterG ?? draft.coffeeDoseG * draft.ratio,
        bloomWaterG:
          draft.steps.find((step) => step.kind === 'bloom')?.targetWaterG ?? null,
        totalTimeS: Math.round(timer.elapsedS || timer.totalDurationS),
        notes,
        ratings,
        steps: draft.steps,
      });
      if (grinderId) {
        await setLastGrinderId(grinderId);
      }
      setSheetOpen(false);
      onLeave();
      router.replace(`/journal/${id}`);
    } catch (caught) {
      Alert.alert(
        t.timer.saveErrorTitle,
        caught instanceof Error ? caught.message : t.timer.tryAgain
      );
    } finally {
      setSaving(false);
    }
  }, [
    beanId,
    db,
    draft,
    grinderId,
    grindSetting,
    notes,
    onLeave,
    ratings,
    setLastGrinderId,
    t,
    timer.elapsedS,
    timer.totalDurationS,
  ]);

  const setRating = (key: RatingKey, value: number) =>
    setRatings((current) => ({ ...current, [key]: value === 0 ? null : value }));

  const statusLabel =
    timer.status === 'idle'
      ? t.timer.readyWhenYouAre
      : timer.status === 'paused'
        ? t.timer.paused
        : timer.status === 'finished'
          ? t.timer.brewComplete
          : t.timer.stageOf(timer.activeIndex + 1, stages.length);

  const activeStageLabel = activeStage
    ? localizeStepLabel(activeStage.label, activeStage.kind, lang)
    : t.timer.readyLabel;
  const nextStageLabel = timer.nextStage
    ? localizeStepLabel(timer.nextStage.label, timer.nextStage.kind, lang)
    : '';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={{ height: insets.top }} />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.timer.leaveA11y}
          hitSlop={6}
          onPress={exit}
          style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.6 : 1 }]}>
          <AppIcon name="chevron-down" size={22} color={BrandSurface.muted} />
        </Pressable>
        <View style={styles.headerCenter}>
          <AppText variant="label" color={BrandSurface.accent}>
            {t.timer.activeBrew}
          </AppText>
          <AppText variant="caption" color={BrandSurface.muted} numberOfLines={1}>
            {draft.recipeName}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.timer.resetA11y}
          accessibilityState={{ disabled: timer.status === 'idle' }}
          disabled={timer.status === 'idle'}
          hitSlop={6}
          onPress={timer.reset}
          style={({ pressed }) => [
            styles.headerButton,
            { opacity: timer.status === 'idle' ? 0.35 : pressed ? 0.6 : 1 },
          ]}>
          <AppIcon name="reset" size={19} color={BrandSurface.muted} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.xl }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.ringWrap}>
          <TimerRing
            progress={timer.progress}
            size={248}
            strokeWidth={7}
            color={BrandSurface.accent}
            trackColor="rgba(245, 242, 236, 0.1)">
            <AppText variant="monoLarge" color={BrandSurface.text}>
              {formatStopwatch(timer.elapsedMs)}
            </AppText>
            <AppText variant="label" color={BrandSurface.accent} style={styles.ringLabel}>
              {activeStageLabel}
            </AppText>
            <AppText variant="caption" color={BrandSurface.muted} tabular>
              {statusLabel}
            </AppText>
          </TimerRing>
        </View>

        <View style={styles.stageCard}>
          <View style={styles.stageTop}>
            <View style={styles.flex}>
              <AppText variant="label" color={BrandSurface.muted}>
                {timer.isFinished ? t.timer.finalWeight : t.timer.pourTo}
              </AppText>
              <View style={styles.targetRow}>
                <AppText variant="metricHero" color={BrandSurface.text} style={styles.target}>
                  {formatWeight(timer.isFinished ? draft.coffeeDoseG * draft.ratio : stageTarget)}
                </AppText>
                <AppText variant="body" color={BrandSurface.muted}>
                  g
                </AppText>
              </View>
            </View>
            <View style={styles.stageTimerBox}>
              <AppText variant="label" color={BrandSurface.muted}>
                {timer.nextStage ? t.timer.nextIn : t.timer.remaining}
              </AppText>
              <AppText variant="mono" color={BrandSurface.text} style={styles.stageTimer}>
                {formatDuration(timer.stageRemainingS)}
              </AppText>
            </View>
          </View>

          <AppText variant="small" color={BrandSurface.muted} style={styles.instruction}>
            {timer.isFinished ? t.timer.finishedInstruction : instruction}
          </AppText>

          {!timer.isFinished && timer.nextStage ? (
            <View style={[styles.nextPreview, { borderTopColor: BrandSurface.line }]}>
              <AppText variant="caption" color={BrandSurface.faint}>
                {t.timer.nextStage}
              </AppText>
              <AppText variant="small" color={BrandSurface.text} tabular style={styles.flex}>
                {t.timer.nextStageDetail(
                  nextStageLabel,
                  formatWeight(timer.nextStage.targetWaterG, true)
                )}
              </AppText>
            </View>
          ) : null}

          <View style={styles.rail}>
            {stages.map((stage, index) => {
              const done = index < timer.activeIndex || timer.isFinished;
              const active = index === timer.activeIndex && !timer.isFinished;
              return (
                <View
                  key={`${stage.label}-${index}`}
                  style={[
                    styles.railSegment,
                    {
                      backgroundColor: done
                        ? BrandSurface.accent
                        : active
                          ? BrandSurface.text
                          : 'rgba(245, 242, 236, 0.16)',
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.railLabels}>
            <AppText variant="caption" color={BrandSurface.faint} tabular>
              {stages.length > 0 ? formatDuration(stages[0].startS) : '0:00'}
            </AppText>
            <AppText variant="caption" color={BrandSurface.faint} tabular>
              {formatDuration(timer.totalDurationS)}
            </AppText>
          </View>
        </View>

        {timer.isFinished ? (
          <View style={styles.completeCard}>
            <AppIcon name="check-circle" size={20} color={BrandSurface.accent} />
            <View style={styles.flex}>
              <AppText variant="bodyStrong" color={BrandSurface.text}>
                {t.timer.brewComplete}
              </AppText>
              <AppText variant="caption" color={BrandSurface.muted} tabular>
                {t.timer.completeMeta(
                  formatDuration(timer.elapsedS || timer.totalDurationS),
                  formatWeight(draft.coffeeDoseG * draft.ratio, true),
                  formatWeight(draft.coffeeDoseG, true)
                )}
              </AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        {timer.isFinished ? (
          <>
            <Button
              label={t.timer.saveToJournal}
              icon="book"
              variant="accent"
              size="lg"
              fullWidth
              onPress={() => setSheetOpen(true)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.timer.discardBrewA11y}
              onPress={exit}
              style={({ pressed }) => [styles.textButton, { opacity: pressed ? 0.65 : 1 }]}>
              <AppText variant="small" color={BrandSurface.muted}>
                {t.timer.discardBrew}
              </AppText>
            </Pressable>
          </>
        ) : (
          <>
            <Button
              label={
                timer.status === 'idle'
                  ? t.timer.startBrewing
                  : timer.isRunning
                    ? t.timer.pause
                    : t.timer.resume
              }
              icon={timer.status === 'idle' ? 'play' : timer.isRunning ? 'pause' : 'play'}
              variant="accent"
              size="lg"
              fullWidth
              onPress={timer.status === 'idle' ? timer.start : timer.toggle}
            />
            <View style={styles.secondaryRow}>
              <Button
                label={t.timer.skipStage}
                icon="skip-forward"
                variant="inverseSecondary"
                disabled={timer.status === 'idle'}
                onPress={timer.skipStage}
                style={styles.flex}
              />
              <Button
                label={t.timer.reset}
                icon="reset"
                variant="inverseSecondary"
                disabled={timer.status === 'idle'}
                onPress={timer.reset}
                style={styles.flex}
              />
            </View>
            {timer.status !== 'idle' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.timer.finishEarlyA11y}
                onPress={timer.finish}
                style={({ pressed }) => [styles.textButton, { opacity: pressed ? 0.65 : 1 }]}>
                <AppText variant="small" color={BrandSurface.muted}>
                  {t.timer.finishEarly}
                </AppText>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => {
          setPicker(null);
          setSheetOpen(false);
        }}
        title={t.timer.saveSheetTitle}
        subtitle={t.timer.saveSheetSub}
        footer={
          picker === null ? (
            <Button
              label={t.timer.saveToJournal}
              variant="accent"
              onPress={saveSession}
              loading={saving}
              size="lg"
              fullWidth
            />
          ) : undefined
        }>
        {picker === null ? (
          <View style={styles.form}>
            <SelectField
              label={t.timer.coffeeLabel}
              value={bean?.name ?? t.timer.noCoffeeSelected}
              icon="coffee"
              onPress={() => setPicker('bean')}
            />
            <SelectField
              label={t.timer.grinderLabel}
              value={grinder?.name ?? t.timer.noGrinderSelected}
              icon="disc"
              onPress={() => setPicker('grinder')}
            />
            <NumberField
              label={t.timer.grindSettingLabel}
              value={grindSetting}
              onChange={setGrindSetting}
              suffix={grinder ? unitLabel(grinder, grindSetting, lang) : undefined}
              step={0.5}
              decimals={2}
              stepper
              allowEmpty
              placeholder={t.timer.grindPlaceholder}
              hint={grinder ? referenceRangeLabel(grinder, lang) ?? undefined : undefined}
            />
            <View style={styles.ratingBlock}>
              {ratingCategories.map((category) => (
                <View key={category.key} style={styles.ratingRow}>
                  <AppText variant="small" style={styles.flex}>
                    {category.label}
                  </AppText>
                  <StarRating
                    value={ratings[category.key]}
                    onChange={(value) => setRating(category.key, value)}
                    clearable
                    size={20}
                  />
                </View>
              ))}
            </View>
            <TextField
              label={t.timer.notesLabel}
              value={notes}
              onChangeText={setNotes}
              placeholder={t.timer.notesPlaceholder}
              multiline
              maxLength={600}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.common.back}
              hitSlop={6}
              onPress={() => setPicker(null)}
              style={({ pressed }) => [styles.pickerBack, { opacity: pressed ? 0.6 : 1 }]}>
              <AppIcon name="chevron-left" size={16} color={theme.textMuted} />
              <AppText variant="small" tone="muted">
                {t.common.back}
              </AppText>
            </Pressable>
            {picker === 'bean' ? (
              <>
                <PickerOption
                  label={t.timer.noCoffeeOption}
                  detail={t.timer.noCoffeeDetail}
                  selected={beanId == null}
                  onPress={() => {
                    setBeanId(null);
                    setPicker(null);
                  }}
                />
                {beans.map((item) => (
                  <PickerOption
                    key={item.id}
                    label={item.name}
                    detail={[
                      localizeProcessMethod(item.process, lang),
                      localizeRoastLevel(item.roastLevel, lang),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    selected={beanId === item.id}
                    onPress={() => {
                      setBeanId(item.id);
                      setPicker(null);
                    }}
                  />
                ))}
              </>
            ) : (
              <>
                <PickerOption
                  label={t.timer.noGrinderOption}
                  detail={t.timer.noGrinderDetail}
                  selected={grinderId == null}
                  onPress={() => {
                    setGrinderId(null);
                    setGrindSetting(null);
                    setPicker(null);
                  }}
                />
                {grinders.map((item) => (
                  <PickerOption
                    key={item.id}
                    label={item.name}
                    detail={t.brew.clicksPerRotation(item.clicksPerRotation)}
                    selected={grinderId === item.id}
                    onPress={() => {
                      setGrinderId(item.id);
                      setGrindSetting(null);
                      setPicker(null);
                    }}
                  />
                ))}
              </>
            )}
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

function PickerOption({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pickerOption,
        {
          backgroundColor: selected ? theme.accentSoft : 'transparent',
          borderColor: selected ? theme.accent : theme.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}>
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        {detail ? (
          <AppText variant="caption" tone="muted">
            {detail}
          </AppText>
        ) : null}
      </View>
      {selected ? <AppIcon name="check" size={18} color={theme.accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BrandSurface.bg },
  emptyText: { marginTop: Spacing.sm },
  emptyButton: { marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    flexGrow: 1,
    justifyContent: 'center',
  },
  ringWrap: { alignItems: 'center', marginTop: Spacing.xs, marginBottom: Spacing.lg },
  ringLabel: { marginTop: Spacing.xs },
  stageCard: {
    backgroundColor: BrandSurface.bgDeep,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: BrandSurface.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  stageTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  targetRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  target: { fontSize: 40, lineHeight: 44 },
  stageTimerBox: { alignItems: 'flex-end', gap: 2 },
  stageTimer: { fontSize: 20, lineHeight: 26 },
  instruction: { lineHeight: 20 },
  nextPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rail: { flexDirection: 'row', gap: 4, marginTop: Spacing.xs },
  railSegment: { flex: 1, height: 4, borderRadius: 2 },
  railLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  completeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: BrandSurface.border,
    backgroundColor: BrandSurface.bgDeep,
  },
  controls: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  secondaryRow: { flexDirection: 'row', gap: Spacing.sm },
  textButton: {
    minHeight: TouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { gap: Spacing.md },
  ratingBlock: { gap: Spacing.xs, paddingVertical: Spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  pickerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingBottom: Spacing.xs,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 52,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  flex: { flex: 1 },
});
