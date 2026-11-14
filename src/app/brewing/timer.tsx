import { BrandSurface, Radius, Spacing } from '@/constants/theme';
import { useBrewDraft } from '@/contexts/brew-draft-context';
import { useSettings } from '@/contexts/settings-context';
import { useDatabase, useQuery } from '@/hooks/use-database';
import { useBrewingTimer } from '@/hooks/use-brewing-timer';
import { useTheme } from '@/hooks/use-theme';
import { buildTimeline } from '@/services/brewing/timeline';
import { StatusBar } from 'expo-status-bar';
import { listBeans } from '@/services/beans';
import { listGrinders } from '@/services/grinders';
import { createSession } from '@/services/journal';
import type { BrewRatings, BrewDraft, RatingKey } from '@/types';
import { EMPTY_RATINGS, RATING_CATEGORIES, STAGE_INSTRUCTIONS } from '@/constants/defaults';
import { formatDuration, formatStopwatch, formatWeight } from '@/utils/formatting';
import { unitLabel, referenceRangeLabel } from '@/utils/grinder';
import { Ionicons } from '@/components/common/icon';
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
  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.xxl, paddingHorizontal: Spacing.xl }]}>
      <AppText variant="h1" color={BrandSurface.text}>
        Nothing brewing yet
      </AppText>
      <AppText variant="small" color={BrandSurface.muted} style={styles.emptyText}>
        Open the calculator or pick a recipe, then tap Start brewing.
      </AppText>
      <Button label="Go to calculator" onPress={() => router.replace('/brew')} style={styles.emptyButton} />
      <Button label="Back" variant="ghost" onPress={onBack} />
    </View>
  );
}

function BrewingTimer({ draft, onLeave }: { draft: BrewDraft; onLeave: () => void }) {
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const theme = useTheme();
  const { preferences, setLastGrinderId } = useSettings();
  const hapticsEnabled = preferences.haptics;

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

  // Keep the display awake only while the brew is actually running.
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
    ? STAGE_INSTRUCTIONS[activeStage.kind]
    : 'Pour with intention and keep the bed level.';

  const exit = useCallback(() => {
    if (timer.status === 'idle') {
      onLeave();
      router.back();
      return;
    }
    Alert.alert(
      timer.isFinished ? 'Discard this brew?' : 'Leave the brew?',
      timer.isFinished
        ? 'This brew has not been saved to your journal.'
        : 'The timer will stop and this plan will be cleared.',
      [
        { text: 'Keep brewing', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            onLeave();
            router.back();
          },
        },
      ]
    );
  }, [onLeave, timer.isFinished, timer.status]);

  // Android hardware back goes through the same confirmation as the chevron.
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
        'Could not save the brew',
        caught instanceof Error ? caught.message : 'Please try again.'
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
    timer.elapsedS,
    timer.totalDurationS,
  ]);

  const setRating = (key: RatingKey, value: number) =>
    setRatings((current) => ({ ...current, [key]: value === 0 ? null : value }));

  const statusLabel =
    timer.status === 'idle'
      ? 'Ready when you are'
      : timer.status === 'paused'
        ? 'Paused, take your time'
        : timer.status === 'finished'
          ? 'Brew complete'
          : `Stage ${timer.activeIndex + 1} of ${stages.length}`;
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={{ height: insets.top }} />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave the brewing screen"
          hitSlop={10}
          onPress={exit}
          style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons name="chevron-down" size={22} color={BrandSurface.muted} />
        </Pressable>
        <View style={styles.headerCenter}>
          <AppText variant="label" color={BrandSurface.accent}>
            Brewing
          </AppText>
          <AppText variant="caption" color={BrandSurface.muted} numberOfLines={1}>
            {draft.recipeName}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset the timer"
          accessibilityState={{ disabled: timer.status === 'idle' }}
          disabled={timer.status === 'idle'}
          hitSlop={10}
          onPress={timer.reset}
          style={({ pressed }) => [
            styles.headerButton,
            { opacity: timer.status === 'idle' ? 0.35 : pressed ? 0.6 : 1 },
          ]}>
          <Ionicons name="refresh" size={20} color={BrandSurface.muted} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.xl }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.ringWrap}>
          <TimerRing
            progress={timer.progress}
            size={252}
            strokeWidth={8}
            color={BrandSurface.accent}
            trackColor="rgba(255, 252, 247, 0.09)">
            <AppText variant="monoLarge" color={BrandSurface.text}>
              {formatStopwatch(timer.elapsedMs)}
            </AppText>
            <AppText variant="label" color={BrandSurface.accent} style={styles.ringLabel}>
              {activeStage?.label ?? 'Ready'}
            </AppText>
            <AppText variant="caption" color={BrandSurface.muted}>
              {statusLabel}
            </AppText>
          </TimerRing>
        </View>

        <View style={styles.stageCard}>
          <View style={styles.stageTop}>
            <View style={styles.flex}>
              <AppText variant="label" color={BrandSurface.muted}>
                {timer.isFinished ? 'Final weight' : 'Pour to'}
              </AppText>
              <View style={styles.targetRow}>
                <AppText variant="h1" color={BrandSurface.text} style={styles.target}>
                  {formatWeight(timer.isFinished ? draft.coffeeDoseG * draft.ratio : stageTarget)}
                </AppText>
                <AppText variant="body" color={BrandSurface.muted}>
                  g
                </AppText>
              </View>
            </View>
            <View style={styles.stageTimerBox}>
              <AppText variant="label" color={BrandSurface.muted}>
                {timer.nextStage ? 'Next in' : 'Remaining'}
              </AppText>
              <AppText variant="mono" color={BrandSurface.text} style={styles.stageTimer}>
                {formatDuration(timer.stageRemainingS)}
              </AppText>
            </View>
          </View>

          <AppText variant="small" color={BrandSurface.muted} style={styles.instruction}>
            {timer.isFinished
              ? 'Drawdown finished. Swirl the carafe, let the cup cool a little, then save your notes.'
              : instruction}
          </AppText>

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
                          : 'rgba(255, 252, 247, 0.16)',
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.railLabels}>
            <AppText variant="caption" color={BrandSurface.faint}>
              {stages.length > 0 ? formatDuration(stages[0].startS) : '0:00'}
            </AppText>
            <AppText variant="caption" color={BrandSurface.faint}>
              {formatDuration(timer.totalDurationS)}
            </AppText>
          </View>
        </View>

        {timer.isFinished ? (
          <View style={styles.completeCard}>
            <Ionicons name="checkmark-circle" size={22} color={BrandSurface.accent} />
            <View style={styles.flex}>
              <AppText variant="bodyStrong" color={BrandSurface.text}>
                Brew complete
              </AppText>
              <AppText variant="caption" color={BrandSurface.muted}>
                {formatDuration(timer.elapsedS || timer.totalDurationS)} ·{' '}
                {formatWeight(draft.coffeeDoseG * draft.ratio, true)} water ·{' '}
                {formatWeight(draft.coffeeDoseG, true)} coffee
              </AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        {timer.isFinished ? (
          <>
            <Button
              label="Save to journal"
              icon="bookmark-outline"
              variant="gold"
              size="lg"
              fullWidth
              onPress={() => setSheetOpen(true)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Discard this brew"
              onPress={exit}
              style={({ pressed }) => [styles.textButton, { opacity: pressed ? 0.6 : 1 }]}>
              <AppText variant="caption" color={BrandSurface.muted}>
                Discard brew
              </AppText>
            </Pressable>
          </>
        ) : (
          <>
            <Button
              label={
                timer.status === 'idle'
                  ? 'Start brewing'
                  : timer.isRunning
                    ? 'Pause'
                    : 'Resume'
              }
              icon={timer.status === 'idle' ? 'play' : timer.isRunning ? 'pause' : 'play'}
              variant="gold"
              size="lg"
              fullWidth
              onPress={timer.status === 'idle' ? timer.start : timer.toggle}
            />
            <View style={styles.secondaryRow}>
              <Button
                label="Skip stage"
                icon="play-skip-forward"
                variant="ghost"
                disabled={timer.status === 'idle'}
                onPress={timer.skipStage}
                style={styles.flex}
              />
              <Button
                label="Reset"
                icon="refresh"
                variant="ghost"
                disabled={timer.status === 'idle'}
                onPress={timer.reset}
                style={styles.flex}
              />
            </View>
            {timer.status !== 'idle' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Finish brew now"
                onPress={timer.finish}
                style={({ pressed }) => [styles.textButton, { opacity: pressed ? 0.6 : 1 }]}>
                <AppText variant="caption" color={BrandSurface.muted}>
                  Finish brew
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
        title="Save this brew"
        subtitle="Add the details you will want next time."
        footer={
          picker === null ? (
            <Button label="Save to journal" onPress={saveSession} loading={saving} size="lg" fullWidth />
          ) : undefined
        }>
        {picker === null ? (
          <View style={styles.form}>
            <SelectField
              label="Coffee"
              value={bean?.name ?? 'No coffee selected'}
              icon="cafe-outline"
              onPress={() => setPicker('bean')}
            />
            <SelectField
              label="Grinder"
              value={grinder?.name ?? 'No grinder selected'}
              icon="disc-outline"
              onPress={() => setPicker('grinder')}
            />
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
            <View style={styles.ratingBlock}>
              {RATING_CATEGORIES.map((category) => (
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
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Sweetness, body, what to change next time"
              multiline
              maxLength={600}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => setPicker(null)}
              style={({ pressed }) => [styles.pickerBack, { opacity: pressed ? 0.6 : 1 }]}>
              <Ionicons name="chevron-back" size={16} color={theme.textMuted} />
              <AppText variant="small" tone="muted">
                Back
              </AppText>
            </Pressable>
            {picker === 'bean' ? (
              <>
                <PickerOption
                  label="No coffee"
                  detail="Save without attaching a bag"
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
                    detail={[item.process, item.roastLevel].filter(Boolean).join(' · ')}
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
                  label="No grinder"
                  detail="Skip the grind record"
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
                    detail={`${item.clicksPerRotation} clicks/rotation`}
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
          backgroundColor: selected ? theme.primarySoft : 'transparent',
          borderColor: selected ? theme.borderStrong : theme.border,
          opacity: pressed ? 0.7 : 1,
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
      {selected ? <Ionicons name="checkmark-circle" size={18} color={theme.gold} /> : null}
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, flexGrow: 1, justifyContent: 'center' },
  ringWrap: { alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  ringLabel: { marginTop: Spacing.xs },
  stageCard: {
    backgroundColor: BrandSurface.bgDeep,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  stageTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  targetRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  target: { fontSize: 40, lineHeight: 46 },
  stageTimerBox: { alignItems: 'flex-end', gap: 2 },
  stageTimer: { fontSize: 20 },
  instruction: { lineHeight: 20 },
  rail: { flexDirection: 'row', gap: 4, marginTop: Spacing.xs },
  railSegment: { flex: 1, height: 4, borderRadius: 2 },
  railLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  completeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: BrandSurface.line,
  },
  controls: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  secondaryRow: { flexDirection: 'row', gap: Spacing.sm },
  textButton: { alignItems: 'center', paddingVertical: Spacing.sm },
  form: { gap: Spacing.md },
  ratingBlock: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  pickerBack: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: Spacing.xs },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  flex: { flex: 1 },
});
