import { Button } from '@/components/common/button';
import { ErrorState, LoadingState } from '@/components/common/empty-state';
import { AppIcon } from '@/components/common/icon';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { BottomSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { getRatingCategories } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-database';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { listGrinders } from '@/services/grinders';
import { listSessions } from '@/services/journal';
import type { BrewSessionDetail } from '@/types';
import {
  formatDate,
  formatDuration,
  formatRatio,
  formatRating,
  formatTemperature,
  formatWeight,
} from '@/utils/formatting';
import { formatSetting } from '@/utils/grinder';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Slot = 'a' | 'b';

export default function CompareScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const { lang, t } = useTranslation();
  const ratingCategories = getRatingCategories(lang);
  const { data, loading, error, reload } = useFocusedQuery(async (db) => {
    const [sessions, grinders] = await Promise.all([listSessions(db, {}), listGrinders(db)]);
    return { sessions, grinders };
  });

  const sessions = useMemo(() => data?.sessions ?? [], [data]);
  const grinders = useMemo(() => data?.grinders ?? [], [data]);

  const [pickedA, setPickedA] = useState<string | null>(null);
  const [pickedB, setPickedB] = useState<string | null>(null);
  const [picker, setPicker] = useState<Slot | null>(null);

  const aId = pickedA ?? sessions[0]?.id ?? null;
  const bId = pickedB ?? sessions[1]?.id ?? null;

  const sessionA = sessions.find((session) => session.id === aId) ?? null;
  const sessionB = sessions.find((session) => session.id === bId) ?? null;

  const grindLabel = (session: BrewSessionDetail | null): string => {
    if (!session) return '–';
    if (session.grindSetting == null) return t.common.notSet;
    const grinder = grinders.find((item) => item.id === session.grinderProfileId);
    return grinder
      ? formatSetting(grinder, session.grindSetting, lang)
      : String(session.grindSetting);
  };

  const slotCard = (slot: Slot, session: BrewSessionDetail | null) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.journal.chooseBrewA11y(slot.toUpperCase())}
      onPress={() => setPicker(slot)}
      onPressIn={() => haptics.fire('selection')}
      style={({ pressed }) => [
        styles.slot,
        {
          backgroundColor: theme.surface,
          borderColor: session ? theme.borderStrong : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={styles.slotHeader}>
        <AppText variant="label" tone="faint">
          {t.journal.brewLabel(slot.toUpperCase())}
        </AppText>
        <View
          style={[
            styles.swapBadge,
            { backgroundColor: theme.surfaceSunken, borderColor: theme.border },
          ]}>
          <AppIcon name="compare" size={14} color={theme.text} />
        </View>
      </View>
      <AppText variant="bodyStrong" numberOfLines={2}>
        {session?.beanNameSnapshot ?? session?.recipeNameSnapshot ?? t.journal.chooseBrew}
      </AppText>
      {session ? (
        <>
          <AppText variant="caption" tone="muted">
            {formatDate(session.brewedAt, lang)}
          </AppText>
          <AppText variant="caption" tone="faint" tabular>
            {formatWeight(session.coffeeDoseG, true)} · {formatRatio(session.ratio)} ·{' '}
            {formatDuration(session.totalTimeS)}
          </AppText>
        </>
      ) : (
        <AppText variant="caption" tone="faint">
          {t.journal.tapToSelect}
        </AppText>
      )}
    </Pressable>
  );

  const compareRow = (
    label: string,
    a: string,
    b: string,
    delta?: number | null,
    last = false
  ) => (
    <View
      key={label}
      style={[
        styles.compareRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}>
      <AppText variant="small" tone="muted" style={styles.compareLabel}>
        {label}
      </AppText>
      <AppText variant="metricSmall" tabular style={styles.compareValue}>
        {a}
      </AppText>
      <AppText variant="metricSmall" tabular style={styles.compareValue}>
        {b}
      </AppText>
      <AppText
        variant="caption"
        tabular
        tone={delta == null || delta === 0 ? 'faint' : delta > 0 ? 'accent' : 'muted'}
        style={styles.compareDelta}>
        {delta == null
          ? ''
          : delta === 0
            ? '='
            : delta > 0
              ? `+${formatRating(delta)}`
              : formatRating(delta)}
      </AppText>
    </View>
  );

  const ratingDelta = (a: number | null | undefined, b: number | null | undefined) => {
    if (a == null || b == null) return null;
    return Math.round((b - a) * 10) / 10;
  };

  return (
    <StackScreen title={t.journal.compareTitle} subtitle={t.journal.compareSubtitle}>
      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingState label={t.journal.loadingSingle} />
      ) : (
        <>
          <View style={styles.slots}>
            {slotCard('a', sessionA)}
            {slotCard('b', sessionB)}
          </View>

          {sessionA && sessionB ? (
            <>
              <View style={styles.section}>
                <SectionHeader title={t.journal.parameters} subtitle={t.journal.parametersSub} />
                <View
                  style={[
                    styles.table,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}>
                  <View
                    style={[
                      styles.compareRow,
                      { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                    ]}>
                    <AppText variant="fieldLabel" tone="faint" style={styles.compareLabel}>
                      {t.journal.metric}
                    </AppText>
                    <AppText variant="fieldLabel" tone="faint" style={styles.compareValue}>
                      A
                    </AppText>
                    <AppText variant="fieldLabel" tone="faint" style={styles.compareValue}>
                      B
                    </AppText>
                    <AppText variant="fieldLabel" tone="faint" style={styles.compareDelta}>
                      Δ
                    </AppText>
                  </View>
                  {compareRow(
                    t.common.dose,
                    formatWeight(sessionA.coffeeDoseG, true),
                    formatWeight(sessionB.coffeeDoseG, true),
                    Math.round((sessionB.coffeeDoseG - sessionA.coffeeDoseG) * 10) / 10
                  )}
                  {compareRow(
                    t.common.water,
                    formatWeight(sessionA.totalWaterG, true),
                    formatWeight(sessionB.totalWaterG, true),
                    Math.round((sessionB.totalWaterG - sessionA.totalWaterG) * 10) / 10
                  )}
                  {compareRow(t.common.ratio, formatRatio(sessionA.ratio), formatRatio(sessionB.ratio))}
                  {compareRow(
                    t.common.temp,
                    formatTemperature(sessionA.waterTempC),
                    formatTemperature(sessionB.waterTempC),
                    Math.round(sessionB.waterTempC - sessionA.waterTempC)
                  )}
                  {compareRow(t.common.grind, grindLabel(sessionA), grindLabel(sessionB))}
                  {compareRow(
                    t.common.time,
                    formatDuration(sessionA.totalTimeS),
                    formatDuration(sessionB.totalTimeS),
                    sessionB.totalTimeS - sessionA.totalTimeS,
                    true
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <SectionHeader title={t.journal.cupProfile} subtitle={t.journal.cupProfileDiffSub} />
                <View
                  style={[
                    styles.table,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}>
                  {ratingCategories.map((category) => (
                    <View
                      key={category.key}
                      style={[
                        styles.compareRow,
                        { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                      ]}>
                      <AppText variant="small" tone="muted" style={styles.compareLabel}>
                        {category.label}
                      </AppText>
                      <AppText variant="metricSmall" tabular style={styles.compareValue}>
                        {sessionA.ratings?.[category.key] ?? '–'}
                      </AppText>
                      <AppText variant="metricSmall" tabular style={styles.compareValue}>
                        {sessionB.ratings?.[category.key] ?? '–'}
                      </AppText>
                      <AppText
                        variant="caption"
                        tabular
                        tone={
                          ratingDelta(
                            sessionA.ratings?.[category.key],
                            sessionB.ratings?.[category.key]
                          ) == null
                            ? 'faint'
                            : 'accent'
                        }
                        style={styles.compareDelta}>
                        {(() => {
                          const delta = ratingDelta(
                            sessionA.ratings?.[category.key],
                            sessionB.ratings?.[category.key]
                          );
                          if (delta == null) return '';
                          if (delta === 0) return '=';
                          return delta > 0 ? `+${delta}` : String(delta);
                        })()}
                      </AppText>
                    </View>
                  ))}
                  {compareRow(
                    t.journal.average,
                    sessionA.averageRating != null ? formatRating(sessionA.averageRating) : '–',
                    sessionB.averageRating != null ? formatRating(sessionB.averageRating) : '–',
                    ratingDelta(sessionA.averageRating, sessionB.averageRating),
                    true
                  )}
                </View>
              </View>

              {sessionA.notes || sessionB.notes ? (
                <View style={styles.section}>
                  <SectionHeader title={t.journal.notes} />
                  <View style={styles.notesRow}>
                    <View
                      style={[
                        styles.notesCard,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}>
                      <AppText variant="label" tone="faint">
                        {t.journal.brewLabel('A')}
                      </AppText>
                      <AppText variant="small" tone={sessionA.notes ? 'default' : 'faint'}>
                        {sessionA.notes ?? t.journal.noNotes}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.notesCard,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}>
                      <AppText variant="label" tone="faint">
                        {t.journal.brewLabel('B')}
                      </AppText>
                      <AppText variant="small" tone={sessionB.notes ? 'default' : 'faint'}>
                        {sessionB.notes ?? t.journal.noNotes}
                      </AppText>
                    </View>
                  </View>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.section}>
              <AppText variant="small" tone="muted">
                {sessions.length < 2 ? t.journal.needTwoBrews : t.journal.pickTwoBrews}
              </AppText>
              <Button
                label={t.journal.backToJournalBtn}
                variant="secondary"
                onPress={() => router.back()}
                style={styles.backButton}
              />
            </View>
          )}
        </>
      )}

      <BottomSheet
        visible={picker != null}
        onClose={() => setPicker(null)}
        title={t.journal.chooseBrewSheetTitle(picker?.toUpperCase() ?? '')}
        subtitle={t.journal.chooseBrewSheetSub}>
        <View style={styles.optionList}>
          {sessions.map((session) => {
            const selected = picker === 'a' ? session.id === aId : session.id === bId;
            return (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  if (picker === 'a') setPickedA(session.id);
                  else setPickedB(session.id);
                  setPicker(null);
                }}
                onPressIn={() => haptics.fire('selection')}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: selected ? theme.accentSoft : theme.surface,
                    borderColor: selected ? theme.accent : theme.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {session.beanNameSnapshot ?? session.recipeNameSnapshot ?? t.journal.brewFallback}
                  </AppText>
                  <AppText variant="caption" tone="muted" tabular>
                    {formatDate(session.brewedAt, lang)}
                    {session.averageRating != null
                      ? ` · ${formatRating(session.averageRating)} / 5`
                      : ''}
                  </AppText>
                </View>
                {selected ? <AppIcon name="check" size={18} color={theme.accent} /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  slots: { flexDirection: 'row', gap: Spacing.md },
  slot: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 2,
    minHeight: 118,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  swapBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: Spacing.xxl },
  table: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
  },
  compareLabel: { flex: 1 },
  compareValue: { width: 74, textAlign: 'right' },
  compareDelta: { width: 42, textAlign: 'right' },
  notesRow: { flexDirection: 'row', gap: Spacing.md },
  notesCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
    minHeight: 100,
  },
  backButton: { marginTop: Spacing.lg, alignSelf: 'flex-start' },
  optionList: { gap: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  flex: { flex: 1 },
});
