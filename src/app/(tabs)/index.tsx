import { BeanRow } from '@/components/beans/bean-row';
import { Facts } from '@/components/brewing/facts';
import { BrandCard, BrandLabel } from '@/components/common/brand-card';
import { Button, IconButton } from '@/components/common/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/empty-state';
import { AppIcon } from '@/components/common/icon';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { MetricStrip } from '@/components/common/stat';
import { AppText } from '@/components/common/text';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { BrandSurface, Radius, Spacing } from '@/constants/theme';
import { useBrewDraft } from '@/contexts/brew-draft-context';
import { useFocusedQuery } from '@/hooks/use-database';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { recentBeans } from '@/services/beans';
import { brewDraftFromRecipe, defaultBrewDraft } from '@/services/brewing/timeline';
import { getBrewStats } from '@/services/journal';
import { getLastUsedRecipe, listFavoriteRecipes, countFavoriteRecipes } from '@/services/recipes';
import { formatRatio, formatRating, formatWeight, greeting } from '@/utils/formatting';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const theme = useTheme();
  const { lang, t } = useTranslation();
  const { beginBrew } = useBrewDraft();

  const { data, loading, error, reload } = useFocusedQuery(async (db) => {
    const [favorites, favouriteCount, beans, stats, lastRecipe] = await Promise.all([
      listFavoriteRecipes(db, 4),
      countFavoriteRecipes(db),
      recentBeans(db, 3),
      getBrewStats(db),
      getLastUsedRecipe(db),
    ]);
    return { favorites, favouriteCount, beans, stats, lastRecipe };
  });

  const greetingText = useMemo(() => greeting(new Date(), lang), [lang]);
  const stats = data?.stats;
  const lastRecipe = data?.lastRecipe ?? null;
  // The hero renders before the first query resolves; without this the button
  // would start the default plan instead of the user's last-used recipe.
  const planNotReady = loading && !data;

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
            {t.home.brandHeader}
          </AppText>
          <AppText variant="display" style={styles.greeting}>
            {greetingText}
          </AppText>
        </View>
        <IconButton
          icon="settings"
          label={t.home.settingsLabel}
          onPress={() => router.push('/settings')}
        />
      </View>

      <AppText variant="small" tone="muted" style={styles.tagline}>
        {t.home.tagline}
      </AppText>

      <BrandCard style={styles.hero}>
        <BrandLabel>{lastRecipe ? t.home.lastUsedRecipe : t.home.readyToBrew}</BrandLabel>
        <AppText variant="h1" color={BrandSurface.text} style={styles.heroTitle}>
          {lastRecipe?.name ?? t.home.defaultHeroTitle}
        </AppText>
        <AppText variant="small" color={BrandSurface.muted} tabular style={styles.heroSubtitle}>
          {lastRecipe
            ? t.home.heroSubtitle(
                formatWeight(lastRecipe.coffeeDoseG, true),
                formatRatio(lastRecipe.ratio),
                formatWeight(lastRecipe.totalWaterG, true)
              )
            : t.home.defaultHeroSubtitle}
        </AppText>

        <View style={[styles.heroDivider, { backgroundColor: BrandSurface.line }]} />

        <Facts
          tone="brand"
          items={[
            { label: t.common.dose, value: formatWeight(lastRecipe?.coffeeDoseG ?? 15), unit: 'g' },
            {
              label: t.common.water,
              value: formatWeight(lastRecipe?.totalWaterG ?? 240),
              unit: 'g',
            },
            { label: t.common.ratio, value: formatRatio(lastRecipe?.ratio ?? 16) },
            { label: t.common.temp, value: String(Math.round(lastRecipe?.waterTempC ?? 92)), unit: '°C' },
          ]}
        />

        <Button
          label={t.home.startBrewing}
          icon="play"
          variant="accent"
          size="lg"
          fullWidth
          disabled={planNotReady}
          onPress={startBrew}
          style={styles.heroButton}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.home.adjustPlanA11y}
          onPress={() => router.push('/brew')}
          style={({ pressed }) => [styles.heroLink, { opacity: pressed ? 0.65 : 1 }]}>
          <AppText variant="small" color={BrandSurface.muted}>
            {t.home.adjustPlan}
          </AppText>
          <AppIcon name="arrow-right" size={14} color={BrandSurface.accent} />
        </Pressable>
      </BrandCard>

      {error && !data ? (
        <View style={styles.section}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      ) : loading && !data ? (
        <LoadingState label={t.home.loadingBar} />
      ) : (
        <>
          <MetricStrip
            style={styles.statsStrip}
            items={[
              { value: String(stats?.sessionCount ?? 0), label: t.home.brewsLogged },
              { value: String(data?.favouriteCount ?? 0), label: t.home.favourites },
              {
                value: stats?.averageRating != null ? formatRating(stats.averageRating) : '–',
                label: t.home.averageCup,
              },
            ]}
          />

          <View style={styles.section}>
            <SectionHeader
              title={t.home.pinnedRecipes}
              subtitle={t.home.pinnedSubtitle}
              actionLabel={t.home.allRecipes}
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
                icon="star"
                title={t.home.noPinnedTitle}
                description={t.home.noPinnedDesc}
                actionLabel={t.home.browse}
                onAction={() => router.push('/recipes')}
              />
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title={t.home.recentCoffees}
              subtitle={t.home.recentSubtitle}
              actionLabel={t.home.allCoffees}
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
                icon="coffee"
                title={t.home.noCoffeesTitle}
                description={t.home.noCoffeesDesc}
                actionLabel={t.home.addBag}
                onAction={() => router.push('/beans/new')}
              />
            )}
          </View>
        </>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.home.brewGuideA11y}
        onPress={() => router.push('/guide')}
        style={({ pressed }) => [
          styles.guideRow,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <View style={[styles.guideIcon, { backgroundColor: theme.accentSoft }]}>
          <AppIcon name="book-open" size={18} color={theme.accent} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{t.home.brewGuideTitle}</AppText>
          <AppText variant="caption" tone="muted">
            {t.home.brewGuideSubtitle}
          </AppText>
        </View>
        <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
      </Pressable>

      <AppText variant="caption" tone="faint" align="center" style={styles.footerNote}>
        {t.home.footerNote}
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
    minHeight: 40,
    marginTop: Spacing.xs,
  },
  statsStrip: { marginTop: Spacing.lg },
  section: { marginTop: Spacing.xxl },
  horizontalList: { gap: Spacing.md, paddingRight: Spacing.lg },
  list: { gap: Spacing.sm },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  guideIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: { marginTop: Spacing.xl },
  flex: { flex: 1 },
});
