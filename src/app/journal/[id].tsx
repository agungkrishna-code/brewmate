import { Facts } from '@/components/brewing/facts';
import { BrandCard, BrandLabel } from '@/components/common/brand-card';
import { Button, IconButton } from '@/components/common/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/empty-state';
import { TextField } from '@/components/common/field';
import { StarRating, RatingBar } from '@/components/common/rating';
import { Screen } from '@/components/common/screen';
import { DataRow, SectionHeader } from '@/components/common/section';
import { BottomSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { EMPTY_RATINGS, getRatingCategories, localizeStepLabel } from '@/constants/defaults';
import { BrandSurface, Radius, Spacing } from '@/constants/theme';
import { useBrewDraft } from '@/contexts/brew-draft-context';
import { useDatabase, useFocusedQuery } from '@/hooks/use-database';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { buildTimeline } from '@/services/brewing/timeline';
import { calculateBrew } from '@/services/calculator/v60';
import { deleteSession, getSession, updateSessionReview } from '@/services/journal';
import { getGrinder } from '@/services/grinders';
import type { BrewRatings, BrewSessionDetail } from '@/types';
import {
  formatDateTime,
  formatDuration,
  formatRatio,
  formatRating,
  formatTemperature,
  formatWeight,
} from '@/utils/formatting';
import { formatSetting } from '@/utils/grinder';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function SessionDetailScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const db = useDatabase();
  const { lang, t } = useTranslation();
  const ratingCategories = getRatingCategories(lang);
  const { beginBrew } = useBrewDraft();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = typeof id === 'string' ? id : '';

  const { data, loading, error, reload } = useFocusedQuery(
    async (database) => {
      const session = sessionId ? await getSession(database, sessionId) : null;
      if (!session) return null;
      const grinder = session.grinderProfileId
        ? await getGrinder(database, session.grinderProfileId)
        : null;
      return { session, grinder };
    },
    sessionId
  );

  const [sheetOpen, setSheetOpen] = useState(false);

  const confirmDelete = useCallback(() => {
    if (!data) return;
    Alert.alert(t.journal.deleteTitle, t.journal.deleteMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          haptics.fire('heavy');
          await deleteSession(db, data.session.id);
          router.back();
        },
      },
    ]);
  }, [data, db, haptics, t]);

  const brewAgain = useCallback(() => {
    if (!data) return;
    const { session } = data;
    const bloomMultiplier =
      session.bloomWaterG != null && session.coffeeDoseG > 0
        ? Math.round((session.bloomWaterG / session.coffeeDoseG) * 100) / 100
        : 3;
    const bloomDurationS = session.steps[0]?.durationS ?? 45;
    const steps =
      session.steps.length > 0
        ? session.steps
        : calculateBrew({
            doseG: session.coffeeDoseG,
            ratio: session.ratio,
            bloomMultiplier,
            bloomDurationS,
            pourCount: 3,
            drawdownDurationS: 45,
          }).steps;
    beginBrew({
      recipeId: session.recipeId,
      recipeName: session.recipeNameSnapshot ?? t.journal.rebrewName,
      coffeeDoseG: session.coffeeDoseG,
      ratio: session.ratio,
      waterTempC: session.waterTempC,
      bloomMultiplier,
      bloomDurationS,
      steps,
      grinderProfileId: session.grinderProfileId,
      grindSetting: session.grindSetting,
      coffeeBeanId: session.coffeeBeanId,
      notes: '',
      source: 'recipe',
    });
    router.push('/brewing/timer');
  }, [beginBrew, data, t.journal.rebrewName]);

  if (loading && !data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <LoadingState label={t.journal.loadingSingle} />
        </View>
      </Screen>
    );
  }

  if (error && !data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <EmptyState
            icon="alert-circle"
            title={t.journal.notFoundTitle}
            description={t.journal.notFoundDesc}
            actionLabel={t.journal.backToJournal}
            onAction={() => router.replace('/journal')}
          />
        </View>
      </Screen>
    );
  }

  const { session, grinder } = data;
  const timeline = buildTimeline(
    session.steps.map((step) => ({
      stepOrder: step.stepOrder,
      label: step.label,
      kind: step.kind,
      targetWaterG: step.targetWaterG,
      durationS: step.durationS,
    }))
  );
  const title = session.beanNameSnapshot ?? session.recipeNameSnapshot ?? t.journal.defaultSessionTitle;
  const average =
    session.ratings != null
      ? Object.values(session.ratings).filter((value): value is number => value != null)
      : [];
  const averageValue =
    average.length > 0 ? average.reduce((total, value) => total + value, 0) / average.length : null;

  return (
    <Screen
      footer={
        <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <Button
            label={t.journal.brewAgain}
            icon="repeat"
            variant="accent"
            size="lg"
            onPress={brewAgain}
            fullWidth
          />
        </View>
      }>
      <View style={styles.topBar}>
        <IconButton icon="chevron-left" label={t.common.back} onPress={() => router.back()} />
        <View style={styles.flex} />
        <IconButton icon="trash" label={t.journal.deleteSessionA11y} onPress={confirmDelete} />
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="caption" tone="faint" tabular>
          {formatDateTime(session.brewedAt, lang)}
        </AppText>
        <AppText variant="display">{title}</AppText>
        {session.beanNameSnapshot && session.recipeNameSnapshot ? (
          <AppText variant="small" tone="muted">
            {t.journal.brewedWith(session.recipeNameSnapshot)}
          </AppText>
        ) : null}
      </View>

      <BrandCard style={styles.hero}>
        <BrandLabel>{t.journal.tastingScore}</BrandLabel>
        <View style={styles.heroScoreRow}>
          <AppText variant="metricHero" color={BrandSurface.text}>
            {averageValue != null ? formatRating(averageValue) : t.journal.notRated}
          </AppText>
          {averageValue != null ? (
            <AppText variant="small" color={BrandSurface.muted} tabular>
              / 5
            </AppText>
          ) : null}
        </View>
        <View style={[styles.divider, { backgroundColor: BrandSurface.line }]} />
        <Facts
          tone="brand"
          items={[
            { label: t.common.dose, value: formatWeight(session.coffeeDoseG), unit: 'g' },
            { label: t.common.water, value: formatWeight(session.totalWaterG), unit: 'g' },
            { label: t.common.ratio, value: formatRatio(session.ratio) },
            { label: t.common.time, value: formatDuration(session.totalTimeS) },
          ]}
        />
      </BrandCard>

      <View style={styles.section}>
        <SectionHeader
          title={t.journal.cupProfile}
          actionLabel={t.common.edit}
          onAction={() => setSheetOpen(true)}
        />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {ratingCategories.map((category) => (
            <RatingBar
              key={category.key}
              label={category.label}
              value={session.ratings?.[category.key] ?? null}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.journal.brewDetails} />
        <View
          style={[
            styles.detailsCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <DataRow label={t.journal.coffee} value={session.beanNameSnapshot ?? t.common.notRecorded} />
          <DataRow
            label={t.journal.grinder}
            tabular
            value={
              session.grinderNameSnapshot && grinder
                ? `${session.grinderNameSnapshot} · ${
                    session.grindSetting != null
                      ? formatSetting(grinder, session.grindSetting, lang)
                      : t.journal.noSetting
                  }`
                : (session.grinderNameSnapshot ?? t.common.notRecorded)
            }
          />
          <DataRow label={t.journal.waterTemp} tabular value={formatTemperature(session.waterTempC)} />
          <DataRow
            label={t.journal.bloomWater}
            tabular
            value={session.bloomWaterG != null ? formatWeight(session.bloomWaterG, true) : '–'}
          />
          <DataRow label={t.journal.totalBrewTime} tabular value={formatDuration(session.totalTimeS)} />
          <DataRow label={t.journal.stages} tabular last value={String(timeline.length)} />
        </View>
      </View>

      {timeline.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={t.journal.stageBreakdown} />
          <View
            style={[
              styles.stepsCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            {timeline.map((stage, index) => {
              const isLast = index === timeline.length - 1;
              return (
                <View
                  key={`${stage.label}-${index}`}
                  style={[
                    styles.stepRow,
                    !isLast && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                    },
                  ]}>
                  <AppText variant="mono" tone="faint" style={styles.stepTime}>
                    {formatDuration(stage.startS)}
                  </AppText>
                  <AppText variant="small" style={styles.flex}>
                    {localizeStepLabel(stage.label, stage.kind, lang)}
                  </AppText>
                  <AppText variant="metricSmall" tone="muted" tabular>
                    {formatWeight(stage.targetWaterG, true)}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {session.notes ? (
        <View style={styles.section}>
          <SectionHeader title={t.journal.notes} />
          <View
            style={[
              styles.notes,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            <AppText variant="body">{session.notes}</AppText>
          </View>
        </View>
      ) : null}

      {sheetOpen ? (
        <ReviewSheet
          session={session}
          onClose={() => setSheetOpen(false)}
          onSaved={() => {
            setSheetOpen(false);
            reload();
          }}
        />
      ) : null}
    </Screen>
  );
}

function ReviewSheet({
  session,
  onClose,
  onSaved,
}: {
  session: BrewSessionDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const db = useDatabase();
  const theme = useTheme();
  const haptics = useHaptics();
  const { lang, t } = useTranslation();
  const ratingCategories = getRatingCategories(lang);
  const [ratings, setRatings] = useState<BrewRatings>(session.ratings ?? EMPTY_RATINGS);
  const [notes, setNotes] = useState(session.notes ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateSessionReview(db, session.id, notes, ratings);
      haptics.success();
      onSaved();
    } catch (caught) {
      haptics.error();
      Alert.alert(
        t.journal.reviewSaveErr,
        caught instanceof Error ? caught.message : t.timer.tryAgain
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={t.journal.reviewTitle}
      subtitle={t.journal.reviewSub}
      footer={
        <Button
          label={t.journal.saveReview}
          variant="accent"
          onPress={save}
          loading={saving}
          size="lg"
          fullWidth
          // Result feedback comes from the save handler.
          haptic="none"
        />
      }>
      <View style={styles.ratingRows}>
        {ratingCategories.map((category) => (
          <View key={category.key} style={[styles.ratingRow, { borderBottomColor: theme.border }]}>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{category.label}</AppText>
              <AppText variant="caption" tone="faint">
                {category.hint}
              </AppText>
            </View>
            <StarRating
              value={ratings[category.key]}
              onChange={(value) =>
                setRatings((current) => ({
                  ...current,
                  [category.key]: value === 0 ? null : value,
                }))
              }
              clearable
              size={22}
            />
          </View>
        ))}
      </View>
      <View style={styles.sheetField}>
        <TextField
          label={t.journal.whatStoodOut}
          value={notes}
          onChangeText={setNotes}
          placeholder={t.journal.reviewNotesPlaceholder}
          multiline
          maxLength={600}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  loading: { paddingTop: Spacing.xxxl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  titleBlock: { paddingTop: Spacing.lg, gap: Spacing.xs },
  hero: { marginTop: Spacing.xl, gap: Spacing.xs },
  heroScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.md },
  section: { marginTop: Spacing.xxl },
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  detailsCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  stepsCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  stepTime: { width: 46, fontSize: 13 },
  notes: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  ratingRows: { gap: Spacing.sm },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetField: { marginTop: Spacing.lg },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
