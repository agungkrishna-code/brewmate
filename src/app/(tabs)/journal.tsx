import { IconButton } from '@/components/common/button';
import { Chip, ChipRow } from '@/components/common/chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/empty-state';
import { AppIcon } from '@/components/common/icon';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { OptionSheet } from '@/components/common/sheet';
import { MetricStrip } from '@/components/common/stat';
import { AppText } from '@/components/common/text';
import { SessionCard } from '@/components/journal/session-card';
import { localizeProcessMethod, localizeRoastLevel } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-database';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { listBeans } from '@/services/beans';
import { listGrinders } from '@/services/grinders';
import { getBrewStats, listSessions } from '@/services/journal';
import { formatDate, formatRating } from '@/utils/formatting';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function JournalScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const { lang, t } = useTranslation();
  const [grinderFilter, setGrinderFilter] = useState<string | null>(null);
  const [beanFilter, setBeanFilter] = useState<string | null>(null);
  const [grinderSheet, setGrinderSheet] = useState(false);
  const [beanSheet, setBeanSheet] = useState(false);

  const { data, loading, error, reload } = useFocusedQuery(async (db) => {
    const [sessions, stats, grinders, beans] = await Promise.all([
      listSessions(db, {}),
      getBrewStats(db),
      listGrinders(db),
      listBeans(db),
    ]);
    return { sessions, stats, grinders, beans };
  });

  const sessions = useMemo(() => data?.sessions ?? [], [data]);
  const stats = data?.stats;
  const grinders = useMemo(() => data?.grinders ?? [], [data]);
  const beans = useMemo(() => data?.beans ?? [], [data]);

  const filtered = useMemo(
    () =>
      sessions.filter(
        (session) =>
          (!grinderFilter || session.grinderProfileId === grinderFilter) &&
          (!beanFilter || session.coffeeBeanId === beanFilter)
      ),
    [beanFilter, grinderFilter, sessions]
  );

  const activeGrinder = grinders.find((grinder) => grinder.id === grinderFilter);
  const activeBean = beans.find((bean) => bean.id === beanFilter);
  const hasFilters = Boolean(grinderFilter || beanFilter);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <AppText variant="display">{t.journal.title}</AppText>
          <AppText variant="small" tone="muted" style={styles.subtitle}>
            {stats?.lastBrewedAt
              ? t.journal.lastBrewed(formatDate(stats.lastBrewedAt, lang))
              : t.journal.emptySubtitle}
          </AppText>
        </View>
        <IconButton
          icon="compare"
          label={t.journal.compareA11y}
          onPress={() => router.push('/journal/compare')}
        />
      </View>

      {error && !data ? (
        <View style={styles.section}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      ) : loading && !data ? (
        <LoadingState label={t.journal.loading} />
      ) : (
        <>
          <MetricStrip
            style={styles.statsStrip}
            items={[
              { value: String(stats?.sessionCount ?? 0), label: t.journal.brews },
              {
                value: stats?.averageRating != null ? formatRating(stats.averageRating) : '–',
                label: t.journal.averageCup,
              },
              {
                value: stats?.favouriteBean ? String(stats.favouriteBean.count) : '–',
                label: stats?.favouriteBean ? stats.favouriteBean.name : t.journal.topCoffee,
              },
            ]}
          />

          <View style={styles.filters}>
            <ChipRow>
              <Chip
                label={activeGrinder ? activeGrinder.name : t.journal.allGrinders}
                icon="disc"
                selected={Boolean(grinderFilter)}
                onPress={() => setGrinderSheet(true)}
              />
              <Chip
                label={activeBean ? activeBean.name : t.journal.allCoffees}
                icon="coffee"
                selected={Boolean(beanFilter)}
                onPress={() => setBeanSheet(true)}
              />
              {hasFilters ? (
                <Chip
                  label={t.common.clear}
                  icon="close"
                  onPress={() => {
                    setGrinderFilter(null);
                    setBeanFilter(null);
                  }}
                />
              ) : null}
            </ChipRow>
          </View>

          <View style={styles.listHeader}>
            <SectionHeader
              title={hasFilters ? t.journal.filteredBrews : t.journal.brewingHistory}
              subtitle={t.journal.sessionCount(filtered.length)}
            />
          </View>

          {filtered.length > 0 ? (
            <View style={styles.list}>
              {filtered.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => router.push(`/journal/${session.id}`)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="notebook-pen"
              title={hasFilters ? t.journal.noMatchTitle : t.journal.emptyTitle}
              description={
                hasFilters ? t.journal.noMatchDesc : t.journal.emptyDesc
              }
              actionLabel={hasFilters ? t.journal.clearFilters : t.journal.startBrewing}
              onAction={() => {
                if (hasFilters) {
                  setGrinderFilter(null);
                  setBeanFilter(null);
                } else {
                  router.push('/brew');
                }
              }}
            />
          )}
        </>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.journal.guideA11y}
        onPress={() => router.push('/guide/taste-troubleshooting')}
        onPressIn={() => haptics.fire('selection')}
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
          <AppText variant="bodyStrong">{t.journal.guideTitle}</AppText>
          <AppText variant="caption" tone="muted">
            {t.journal.guideSub}
          </AppText>
        </View>
        <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
      </Pressable>

      <OptionSheet
        visible={grinderSheet}
        onClose={() => setGrinderSheet(false)}
        title={t.journal.filterByGrinder}
        options={[
          { label: t.journal.allGrinders, value: 'all' },
          ...grinders.map((grinder) => ({ label: grinder.name, value: grinder.id })),
        ]}
        selected={grinderFilter ?? 'all'}
        onSelect={(value) => setGrinderFilter(value === 'all' ? null : value)}
      />
      <OptionSheet
        visible={beanSheet}
        onClose={() => setBeanSheet(false)}
        title={t.journal.filterByCoffee}
        options={[
          { label: t.journal.allCoffees, value: 'all' },
          ...beans.map((bean) => ({
            label: bean.name,
            value: bean.id,
            detail: [
              localizeProcessMethod(bean.process, lang),
              localizeRoastLevel(bean.roastLevel, lang),
            ].join(' · '),
          })),
        ]}
        selected={beanFilter ?? 'all'}
        onSelect={(value) => setBeanFilter(value === 'all' ? null : value)}
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
  statsStrip: { marginTop: Spacing.xl },
  filters: { marginTop: Spacing.lg },
  listHeader: { marginTop: Spacing.xl },
  list: { gap: Spacing.sm },
  section: { marginTop: Spacing.xxl },
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
