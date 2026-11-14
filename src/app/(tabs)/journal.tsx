import { IconButton } from '@/components/common/button';
import { Chip, ChipRow } from '@/components/common/chip';
import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { OptionSheet } from '@/components/common/sheet';
import { StatTile } from '@/components/common/stat';
import { AppText } from '@/components/common/text';
import { SessionCard } from '@/components/journal/session-card';
import { Radius, Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { listBeans } from '@/services/beans';
import { listGrinders } from '@/services/grinders';
import { getBrewStats, listSessions } from '@/services/journal';
import { formatDate, formatRating } from '@/utils/formatting';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function JournalScreen() {
  const theme = useTheme();
  const [grinderFilter, setGrinderFilter] = useState<string | null>(null);
  const [beanFilter, setBeanFilter] = useState<string | null>(null);
  const [grinderSheet, setGrinderSheet] = useState(false);
  const [beanSheet, setBeanSheet] = useState(false);

  const { data } = useFocusedQuery(async (db) => {
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
          <AppText variant="display">Journal</AppText>
          <AppText variant="small" tone="muted" style={styles.subtitle}>
            {stats?.lastBrewedAt
              ? `Last brewed ${formatDate(stats.lastBrewedAt)}`
              : 'Every cup, remembered.'}
          </AppText>
        </View>
        <IconButton
          icon="git-compare-outline"
          label="Compare two brews"
          onPress={() => router.push('/journal/compare')}
        />
      </View>

      <View style={styles.statsRow}>
        <StatTile value={String(stats?.sessionCount ?? 0)} label="Brews" />
        <StatTile
          value={stats?.averageRating != null ? formatRating(stats.averageRating) : '–'}
          label="Average cup"
        />
        <StatTile
          value={stats?.favouriteBean ? String(stats.favouriteBean.count) : '–'}
          label={stats?.favouriteBean ? stats.favouriteBean.name : 'Top coffee'}
        />
      </View>

      <View style={styles.filters}>
        <ChipRow>
          <Chip
            label={activeGrinder ? activeGrinder.name : 'All grinders'}
            icon="disc-outline"
            selected={Boolean(grinderFilter)}
            onPress={() => setGrinderSheet(true)}
          />
          <Chip
            label={activeBean ? activeBean.name : 'All coffees'}
            icon="cafe-outline"
            selected={Boolean(beanFilter)}
            onPress={() => setBeanSheet(true)}
          />
          {hasFilters ? (
            <Chip
              label="Clear"
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
          title={hasFilters ? 'Filtered brews' : 'Brewing history'}
          subtitle={`${filtered.length} ${filtered.length === 1 ? 'session' : 'sessions'}`}
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
          icon="journal-outline"
          title={hasFilters ? 'No brews match' : 'Your journal is empty'}
          description={
            hasFilters
              ? 'Try clearing the filters to see the rest of your history.'
              : 'Finish a brew and save it to record dose, grind, timing and taste.'
          }
          actionLabel={hasFilters ? 'Clear filters' : 'Start brewing'}
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

      <View style={styles.section}>
        <SectionHeader
          title="Reading your cup"
          actionLabel="Guide"
          onAction={() => router.push('/guide/taste-troubleshooting')}
        />
        <View style={[styles.tipCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TipRow
            label="Sour and thin"
            text="Usually under-extracted. Grind finer next time and keep the pour steady."
          />
          <TipRow
            label="Bitter and drying"
            text="Usually over-extracted. Grind coarser, or pour lower and gentler."
          />
          <TipRow
            label="Weak but balanced"
            text="That is strength, not extraction. Tighten the ratio before touching the grind."
          />
        </View>
      </View>

      <OptionSheet
        visible={grinderSheet}
        onClose={() => setGrinderSheet(false)}
        title="Filter by grinder"
        options={[
          { label: 'All grinders', value: 'all' },
          ...grinders.map((grinder) => ({ label: grinder.name, value: grinder.id })),
        ]}
        selected={grinderFilter ?? 'all'}
        onSelect={(value) => setGrinderFilter(value === 'all' ? null : value)}
      />
      <OptionSheet
        visible={beanSheet}
        onClose={() => setBeanSheet(false)}
        title="Filter by coffee"
        options={[
          { label: 'All coffees', value: 'all' },
          ...beans.map((bean) => ({
            label: bean.name,
            value: bean.id,
            detail: [bean.process, bean.roastLevel].join(' · '),
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
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  filters: { marginTop: Spacing.lg },
  listHeader: { marginTop: Spacing.xl },
  list: { gap: Spacing.sm },
  section: { marginTop: Spacing.xxl },
  tipCard: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tipRow: { gap: 2 },
  flex: { flex: 1 },
});

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
