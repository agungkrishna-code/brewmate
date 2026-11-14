import { BeanRow } from '@/components/beans/bean-row';
import { Facts } from '@/components/brewing/facts';
import { BrandCard, BrandLabel } from '@/components/common/brand-card';
import { Button, IconButton } from '@/components/common/button';
import { EmptyState } from '@/components/common/empty-state';
import { Ionicons } from '@/components/common/icon';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { StatTile } from '@/components/common/stat';
import { AppText } from '@/components/common/text';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { BrandSurface, Radius, Spacing } from '@/constants/theme';
import { useBrewDraft } from '@/contexts/brew-draft-context';
import { useFocusedQuery } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { recentBeans } from '@/services/beans';
import { brewDraftFromRecipe, defaultBrewDraft } from '@/services/brewing/timeline';
import { listGrinders } from '@/services/grinders';
import { getBrewStats } from '@/services/journal';
import { getLastUsedRecipe, listFavoriteRecipes } from '@/services/recipes';
import { formatRatio, formatRating, formatWeight, greeting } from '@/utils/formatting';
import { preferredRangeLabel, referenceRangeLabel } from '@/utils/grinder';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const theme = useTheme();
  const { beginBrew } = useBrewDraft();

  const { data } = useFocusedQuery(async (db) => {
    const [favorites, beans, stats, grinders, lastRecipe] = await Promise.all([
      listFavoriteRecipes(db, 4),
      recentBeans(db, 3),
      getBrewStats(db),
      listGrinders(db),
      getLastUsedRecipe(db),
    ]);
    return { favorites, beans, stats, grinders, lastRecipe };
  });

  const greetingText = useMemo(() => greeting(), []);
  const stats = data?.stats;
  const lastRecipe = data?.lastRecipe ?? null;

  const startBrew = () => {
    if (lastRecipe) {
      beginBrew(brewDraftFromRecipe(lastRecipe));
    } else {
      beginBrew(defaultBrewDraft());
    }
    router.push('/brewing/timer');
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <View style={styles.flex}>
          <AppText variant="label" tone="faint">
            Brewmate · V60
          </AppText>
          <AppText variant="display" style={styles.greeting}>
            {greetingText}
          </AppText>
        </View>
        <IconButton
          icon="settings-outline"
          label="Settings"
          onPress={() => router.push('/settings')}
        />
      </View>

      <AppText variant="small" tone="muted" style={styles.tagline}>
        Let&apos;s make a cup worth slowing down for.
      </AppText>

      <BrandCard style={styles.hero}>
        <BrandLabel>{lastRecipe ? 'Last used recipe' : 'Your first brew'}</BrandLabel>
        <AppText variant="h1" color={BrandSurface.text} style={styles.heroTitle}>
          {lastRecipe?.name ?? 'Ready when you are'}
        </AppText>
        <AppText variant="small" color={BrandSurface.muted} style={styles.heroSubtitle}>
          {lastRecipe
            ? `${formatWeight(lastRecipe.coffeeDoseG, true)} coffee · ${formatRatio(
                lastRecipe.ratio
              )} · ${formatWeight(lastRecipe.totalWaterG, true)} water`
            : 'A simple 15 g V60, three pours and a clean finish.'}
        </AppText>

        <View style={[styles.heroDivider, { backgroundColor: BrandSurface.line }]} />

        <Facts
          tone="brand"
          items={[
            { label: 'Dose', value: formatWeight(lastRecipe?.coffeeDoseG ?? 15), unit: 'g' },
            {
              label: 'Water',
              value: formatWeight(lastRecipe?.totalWaterG ?? 240),
              unit: 'g',
            },
            { label: 'Ratio', value: formatRatio(lastRecipe?.ratio ?? 16) },
            { label: 'Temp', value: String(Math.round(lastRecipe?.waterTempC ?? 92)), unit: '°C' },
          ]}
        />

        <Button
          label="Start brewing"
          icon="play"
          variant="gold"
          size="lg"
          fullWidth
          onPress={startBrew}
          style={styles.heroButton}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the brewing calculator"
          onPress={() => router.push('/brew')}
          style={({ pressed }) => [styles.heroLink, { opacity: pressed ? 0.6 : 1 }]}>
          <AppText variant="caption" color={BrandSurface.muted}>
            Adjust dose, ratio and pours first
          </AppText>
          <Ionicons name="arrow-forward" size={13} color={BrandSurface.accent} />
        </Pressable>
      </BrandCard>

      <View style={styles.statsRow}>
        <StatTile value={String(stats?.sessionCount ?? 0)} label="Brews logged" />
        <StatTile value={String(data?.favorites.length ?? 0)} label="Favourite recipes" />
        <StatTile
          value={stats?.averageRating != null ? formatRating(stats.averageRating) : '–'}
          label="Average cup"
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Favourite recipes"
          subtitle="Your pinned starting points"
          actionLabel="All recipes"
          onAction={() => router.push('/recipes')}
        />
        {data && data.favorites.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}>
            {data.favorites.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                compact
                onPress={() => router.push(`/recipes/${recipe.id}`)}
              />
            ))}
          </ScrollView>
        ) : (
          <EmptyState
            compact
            icon="star-outline"
            title="No favourites yet"
            description="Star a recipe and it will wait for you here."
            actionLabel="Browse recipes"
            onAction={() => router.push('/recipes')}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Recent coffees"
          subtitle="Beans you have brewed lately"
          actionLabel="All coffees"
          onAction={() => router.push('/beans')}
        />
        {data && data.beans.length > 0 ? (
          <View style={styles.list}>
            {data.beans.map((bean) => (
              <BeanRow
                key={bean.id}
                bean={bean}
                onPress={() => router.push(`/beans/${bean.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            compact
            icon="cafe-outline"
            title="No coffees yet"
            description="Register a bag to keep its origin, roast date and tasting notes."
            actionLabel="Add a coffee"
            onAction={() => router.push('/beans/new')}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Your grinders"
          subtitle="Settings stay separate per model"
          actionLabel="Open grinder"
          onAction={() => router.push('/grinder')}
        />
        <View style={styles.list}>
          {(data?.grinders ?? []).map((grinder) => (
            <Pressable
              key={grinder.id}
              accessibilityRole="button"
              accessibilityLabel={`${grinder.name} settings`}
              onPress={() => router.push(`/grinders/${grinder.id}`)}
              style={({ pressed }) => [
                styles.grinderRow,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <View style={[styles.grinderIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="disc-outline" size={18} color={theme.primary} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{grinder.name}</AppText>
                <AppText variant="caption" tone="muted">
                  {preferredRangeLabel(grinder) ?? referenceRangeLabel(grinder) ?? 'Set your range'}
                </AppText>
              </View>
              <AppText variant="caption" tone="faint">
                {grinder.settingUnit === 'rotations' ? 'dial' : 'clicks'}
              </AppText>
              <Ionicons name="chevron-forward" size={15} color={theme.textFaint} />
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open the brew guide"
        onPress={() => router.push('/guide')}
        style={({ pressed }) => [
          styles.guideCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <View style={[styles.guideIcon, { backgroundColor: theme.goldSoft }]}>
          <Ionicons name="book-outline" size={18} color={theme.gold} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">Brew guide</AppText>
          <AppText variant="caption" tone="muted">
            V60 basics, dial-in, water, taste and beans
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={15} color={theme.textFaint} />
      </Pressable>

      <AppText variant="caption" tone="faint" align="center" style={styles.footerNote}>
        Offline by design · everything stays on this device
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  greeting: { marginTop: Spacing.xs },
  tagline: { marginTop: Spacing.xs },
  hero: { marginTop: Spacing.xl, gap: Spacing.xs },
  heroTitle: { marginTop: Spacing.xs },
  heroSubtitle: { marginTop: 2 },
  heroDivider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.lg },
  heroButton: { marginTop: Spacing.lg },
  heroLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.md,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  section: { marginTop: Spacing.xxl },
  horizontalList: { gap: Spacing.md, paddingRight: Spacing.lg },
  list: { gap: Spacing.sm },
  grinderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  grinderIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  guideIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: { marginTop: Spacing.xxl },
  flex: { flex: 1 },
});
