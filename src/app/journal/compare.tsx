import { Button, IconButton } from '@/components/common/button';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { BottomSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { RATING_CATEGORIES } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useQuery } from '@/hooks/use-database';
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
  const { data } = useQuery(async (db) => {
    const [sessions, grinders] = await Promise.all([listSessions(db, {}), listGrinders(db)]);
    return { sessions, grinders };
  });

  const sessions = useMemo(() => data?.sessions ?? [], [data]);
  const grinders = useMemo(() => data?.grinders ?? [], [data]);

  const [pickedA, setPickedA] = useState<string | null>(null);
  const [pickedB, setPickedB] = useState<string | null>(null);
  const [picker, setPicker] = useState<Slot | null>(null);

  // Default to the two most recent brews until the user picks their own.
  const aId = pickedA ?? sessions[0]?.id ?? null;
  const bId = pickedB ?? sessions[1]?.id ?? null;

  const sessionA = sessions.find((session) => session.id === aId) ?? null;
  const sessionB = sessions.find((session) => session.id === bId) ?? null;

  const grindLabel = (session: BrewSessionDetail | null): string => {
    if (!session) return '—';
    if (session.grindSetting == null) return 'Not set';
    const grinder = grinders.find((item) => item.id === session.grinderProfileId);
    return grinder
      ? formatSetting(grinder, session.grindSetting)
      : String(session.grindSetting);
  };

  const slotCard = (slot: Slot, session: BrewSessionDetail | null) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Choose brew ${slot.toUpperCase()}`}
      onPress={() => setPicker(slot)}
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
          Brew {slot.toUpperCase()}
        </AppText>
        <IconButton
          icon="swap-horizontal"
          label={`Change brew ${slot.toUpperCase()}`}
          size={28}
          onPress={() => setPicker(slot)}
        />
      </View>
      <AppText variant="bodyStrong" numberOfLines={2}>
        {session?.beanNameSnapshot ?? session?.recipeNameSnapshot ?? 'Choose a brew'}
      </AppText>
      {session ? (
        <>
          <AppText variant="caption" tone="muted">
            {formatDate(session.brewedAt)}
          </AppText>
          <AppText variant="caption" tone="faint">
            {formatWeight(session.coffeeDoseG, true)} · {formatRatio(session.ratio)} ·{' '}
            {formatDuration(session.totalTimeS)}
          </AppText>
        </>
      ) : (
        <AppText variant="caption" tone="faint">
          Tap to select
        </AppText>
      )}
    </Pressable>
  );

  const compareRow = (label: string, a: string, b: string, delta?: number | null) => (
    <View key={label} style={[styles.compareRow, { borderBottomColor: theme.border }]}>
      <AppText variant="small" tone="muted" style={styles.compareLabel}>
        {label}
      </AppText>
      <AppText variant="small" style={styles.compareValue}>
        {a}
      </AppText>
      <AppText variant="small" style={styles.compareValue}>
        {b}
      </AppText>
      <AppText
        variant="caption"
        tone={delta == null || delta === 0 ? 'faint' : delta > 0 ? 'gold' : 'muted'}
        style={styles.compareDelta}>
        {delta == null ? '' : delta === 0 ? '=' : delta > 0 ? `+${formatRating(delta)}` : formatRating(delta)}
      </AppText>
    </View>
  );

  const ratingDelta = (a: number | null | undefined, b: number | null | undefined) => {
    if (a == null || b == null) return null;
    return Math.round((b - a) * 10) / 10;
  };

  return (
    <StackScreen title="Compare brews" subtitle="Two cups, side by side">
      <View style={styles.slots}>
        {slotCard('a', sessionA)}
        {slotCard('b', sessionB)}
      </View>

      {sessionA && sessionB ? (
        <>
          <View style={styles.section}>
            <SectionHeader title="Parameters" subtitle="A / B / difference" />
            <View style={[styles.table, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.compareRow, { borderBottomColor: theme.border }]}>
                <AppText variant="label" tone="faint" style={styles.compareLabel}>
                  Coffee
                </AppText>
                <AppText variant="label" tone="faint" style={styles.compareValue}>
                  A
                </AppText>
                <AppText variant="label" tone="faint" style={styles.compareValue}>
                  B
                </AppText>
                <View style={styles.compareDelta} />
              </View>
              {compareRow(
                'Dose',
                formatWeight(sessionA.coffeeDoseG, true),
                formatWeight(sessionB.coffeeDoseG, true),
                Math.round((sessionB.coffeeDoseG - sessionA.coffeeDoseG) * 10) / 10
              )}
              {compareRow(
                'Water',
                formatWeight(sessionA.totalWaterG, true),
                formatWeight(sessionB.totalWaterG, true),
                Math.round((sessionB.totalWaterG - sessionA.totalWaterG) * 10) / 10
              )}
              {compareRow('Ratio', formatRatio(sessionA.ratio), formatRatio(sessionB.ratio))}
              {compareRow(
                'Temp',
                formatTemperature(sessionA.waterTempC),
                formatTemperature(sessionB.waterTempC),
                Math.round(sessionB.waterTempC - sessionA.waterTempC)
              )}
              {compareRow('Grind', grindLabel(sessionA), grindLabel(sessionB))}
              {compareRow(
                'Time',
                formatDuration(sessionA.totalTimeS),
                formatDuration(sessionB.totalTimeS),
                sessionB.totalTimeS - sessionA.totalTimeS
              )}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Cup profile" subtitle="Diff is B minus A" />
            <View style={[styles.table, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {RATING_CATEGORIES.map((category) => (
                <View
                  key={category.key}
                  style={[styles.compareRow, { borderBottomColor: theme.border }]}>
                  <AppText variant="small" tone="muted" style={styles.compareLabel}>
                    {category.label}
                  </AppText>
                  <AppText variant="small" style={styles.compareValue}>
                    {sessionA.ratings?.[category.key] ?? '—'}
                  </AppText>
                  <AppText variant="small" style={styles.compareValue}>
                    {sessionB.ratings?.[category.key] ?? '—'}
                  </AppText>
                  <AppText
                    variant="caption"
                    tone={
                      ratingDelta(sessionA.ratings?.[category.key], sessionB.ratings?.[category.key]) ==
                      null
                        ? 'faint'
                        : 'gold'
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
                'Average',
                sessionA.averageRating != null ? formatRating(sessionA.averageRating) : '—',
                sessionB.averageRating != null ? formatRating(sessionB.averageRating) : '—',
                ratingDelta(sessionA.averageRating, sessionB.averageRating)
              )}
            </View>
          </View>

          {sessionA.notes || sessionB.notes ? (
            <View style={styles.section}>
              <SectionHeader title="Notes" />
              <View style={styles.notesRow}>
                <View style={[styles.notesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <AppText variant="label" tone="faint">
                    Brew A
                  </AppText>
                  <AppText variant="small" tone={sessionA.notes ? 'default' : 'faint'}>
                    {sessionA.notes ?? 'No notes'}
                  </AppText>
                </View>
                <View style={[styles.notesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <AppText variant="label" tone="faint">
                    Brew B
                  </AppText>
                  <AppText variant="small" tone={sessionB.notes ? 'default' : 'faint'}>
                    {sessionB.notes ?? 'No notes'}
                  </AppText>
                </View>
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.section}>
          <AppText variant="small" tone="muted">
            {sessions.length < 2
              ? 'Log at least two brews to compare them.'
              : 'Pick two brews above to see the differences.'}
          </AppText>
          <Button
            label="Back to journal"
            variant="secondary"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      )}

      <BottomSheet
        visible={picker != null}
        onClose={() => setPicker(null)}
        title={`Choose brew ${picker?.toUpperCase() ?? ''}`}
        subtitle="Rated brews make the comparison more useful.">
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
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: selected ? theme.primarySoft : theme.surface,
                    borderColor: selected ? theme.borderStrong : theme.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {session.beanNameSnapshot ?? session.recipeNameSnapshot ?? 'Brew'}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {formatDate(session.brewedAt)}
                    {session.averageRating != null
                      ? ` · ${formatRating(session.averageRating)} / 5`
                      : ''}
                  </AppText>
                </View>
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
    minHeight: 120,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  section: { marginTop: Spacing.xxl },
  table: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  compareLabel: { flex: 1 },
  compareValue: { width: 74, textAlign: 'right' },
  compareDelta: { width: 40, textAlign: 'right' },
  notesRow: { flexDirection: 'row', gap: Spacing.md },
  notesCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.xs,
    minHeight: 100,
  },
  backButton: { marginTop: Spacing.lg, alignSelf: 'flex-start' },
  optionList: { gap: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  flex: { flex: 1 },
});
