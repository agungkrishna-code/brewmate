import { Facts } from '@/components/brewing/facts';
import { BrandCard, BrandLabel } from '@/components/common/brand-card';
import { Button, IconButton } from '@/components/common/button';
import { EmptyState } from '@/components/common/empty-state';
import { TextField } from '@/components/common/field';
import { StarRating, RatingBar } from '@/components/common/rating';
import { Screen } from '@/components/common/screen';
import { DataRow, SectionHeader } from '@/components/common/section';
import { BottomSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { RATING_CATEGORIES, EMPTY_RATINGS } from '@/constants/defaults';
import { BrandSurface, Radius, Spacing } from '@/constants/theme';
import { useBrewDraft } from '@/contexts/brew-draft-context';
import { useDatabase, useQuery } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { buildTimeline } from '@/services/brewing/timeline';
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
  const db = useDatabase();
  const { beginBrew } = useBrewDraft();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = typeof id === 'string' ? id : '';

  const { data, reload } = useQuery(
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
    Alert.alert('Delete this brew?', 'The session will be removed from your journal.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(db, data.session.id);
          router.back();
        },
      },
    ]);
  }, [data, db]);

  const brewAgain = useCallback(() => {
    if (!data) return;
    const { session } = data;
    beginBrew({
      recipeId: session.recipeId,
      recipeName: session.recipeNameSnapshot ?? 'Re-brew',
      coffeeDoseG: session.coffeeDoseG,
      ratio: session.ratio,
      waterTempC: session.waterTempC,
      bloomMultiplier:
        session.bloomWaterG != null && session.coffeeDoseG > 0
          ? Math.round((session.bloomWaterG / session.coffeeDoseG) * 100) / 100
          : 3,
      bloomDurationS: session.steps[0]?.durationS ?? 45,
      steps: session.steps,
      grinderProfileId: session.grinderProfileId,
      grindSetting: session.grindSetting,
      coffeeBeanId: session.coffeeBeanId,
      notes: '',
      source: 'recipe',
    });
    router.push('/brewing/timer');
  }, [beginBrew, data]);

  if (!data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <EmptyState
            icon="alert-circle-outline"
            title="Brew not found"
            description="This session may have been deleted."
            actionLabel="Back to the journal"
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
  const title = session.beanNameSnapshot ?? session.recipeNameSnapshot ?? 'Brew session';
  const average =
    session.ratings != null
      ? Object.values(session.ratings).filter((value): value is number => value != null)
      : [];
  const averageValue =
    average.length > 0 ? average.reduce((total, value) => total + value, 0) / average.length : null;

  return (
    <Screen
      footer={
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button label="Brew this again" icon="repeat" size="lg" onPress={brewAgain} fullWidth />
        </View>
      }>
      <View style={styles.topBar}>
        <IconButton icon="chevron-back" label="Go back" onPress={() => router.back()} />
        <View style={styles.flex} />
        <IconButton icon="trash-outline" label="Delete session" onPress={confirmDelete} />
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="label" tone="faint">
          {formatDateTime(session.brewedAt)}
        </AppText>
        <AppText variant="display">{title}</AppText>
        {session.beanNameSnapshot && session.recipeNameSnapshot ? (
          <AppText variant="small" tone="muted">
            Brewed with {session.recipeNameSnapshot}
          </AppText>
        ) : null}
      </View>

      <BrandCard style={styles.hero}>
        <BrandLabel>Tasting score</BrandLabel>
        <View style={styles.heroScoreRow}>
          <AppText variant="h1" color={BrandSurface.text}>
            {averageValue != null ? formatRating(averageValue) : 'Not rated'}
          </AppText>
          {averageValue != null ? (
            <AppText variant="small" color={BrandSurface.muted}>
              / 5
            </AppText>
          ) : null}
        </View>
        <View style={[styles.divider, { backgroundColor: BrandSurface.line }]} />
        <Facts
          tone="brand"
          items={[
            { label: 'Dose', value: formatWeight(session.coffeeDoseG), unit: 'g' },
            { label: 'Water', value: formatWeight(session.totalWaterG), unit: 'g' },
            { label: 'Ratio', value: formatRatio(session.ratio) },
            { label: 'Time', value: formatDuration(session.totalTimeS) },
          ]}
        />
      </BrandCard>

      <View style={styles.section}>
        <SectionHeader
          title="Cup profile"
          actionLabel="Edit"
          onAction={() => setSheetOpen(true)}
        />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {RATING_CATEGORIES.map((category) => (
            <RatingBar
              key={category.key}
              label={category.label}
              value={session.ratings?.[category.key] ?? null}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Brew details" />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <DataRow label="Coffee" value={session.beanNameSnapshot ?? 'Not recorded'} />
          <DataRow
            label="Grinder"
            value={
              session.grinderNameSnapshot && grinder
                ? `${session.grinderNameSnapshot} · ${
                    session.grindSetting != null
                      ? formatSetting(grinder, session.grindSetting)
                      : 'no setting'
                  }`
                : (session.grinderNameSnapshot ?? 'Not recorded')
            }
          />
          <DataRow label="Water temperature" value={formatTemperature(session.waterTempC)} />
          <DataRow
            label="Bloom water"
            value={session.bloomWaterG != null ? formatWeight(session.bloomWaterG, true) : '—'}
          />
          <DataRow label="Total brew time" value={formatDuration(session.totalTimeS)} />
          <DataRow label="Stages" value={String(timeline.length)} />
        </View>
      </View>

      {timeline.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Stage breakdown" />
          <View style={styles.steps}>
            {timeline.map((stage, index) => (
              <View
                key={`${stage.label}-${index}`}
                style={[styles.stepRow, { borderBottomColor: theme.border }]}>
                <AppText variant="small" tone="faint" style={styles.stepTime}>
                  {formatDuration(stage.startS)}
                </AppText>
                <AppText variant="small" style={styles.flex}>
                  {stage.label}
                </AppText>
                <AppText variant="small" tone="muted">
                  {formatWeight(stage.targetWaterG, true)}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {session.notes ? (
        <View style={styles.section}>
          <SectionHeader title="Notes" />
          <View style={[styles.notes, { backgroundColor: theme.goldSoft }]}>
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

/**
 * Mounted only while the sheet is open, so the form always starts from the
 * saved review without an effect syncing state.
 */
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
  const [ratings, setRatings] = useState<BrewRatings>(session.ratings ?? EMPTY_RATINGS);
  const [notes, setNotes] = useState(session.notes ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateSessionReview(db, session.id, notes, ratings);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Tasting notes"
      subtitle="Rate what you actually tasted, 1 to 5."
      footer={<Button label="Save review" onPress={save} loading={saving} size="lg" fullWidth />}>
      <View style={styles.ratingRows}>
        {RATING_CATEGORIES.map((category) => (
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
          label="What stood out?"
          value={notes}
          onChangeText={setNotes}
          placeholder="Sweetness, finish, what to change next time"
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
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  steps: { gap: 0 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepTime: { width: 40 },
  notes: { borderRadius: Radius.md, padding: Spacing.lg },
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
