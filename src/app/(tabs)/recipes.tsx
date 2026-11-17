import { IconButton } from '@/components/common/button';
import { Chip, ChipRow } from '@/components/common/chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/empty-state';
import { AppIcon } from '@/components/common/icon';
import { Screen } from '@/components/common/screen';
import { AppText } from '@/components/common/text';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { getDisclaimers } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-database';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { listRecipeSummaries } from '@/services/recipes';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Filter = 'all' | 'favorites' | 'starters';

export default function RecipesScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const { lang, t } = useTranslation();
  const disclaimers = getDisclaimers(lang);
  const [filter, setFilter] = useState<Filter>('all');
  const { data, loading, error, reload } = useFocusedQuery(async (db) => listRecipeSummaries(db));
  const recipes = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    if (filter === 'favorites') return recipes.filter((recipe) => recipe.isFavorite);
    if (filter === 'starters') return recipes.filter((recipe) => recipe.isStarter);
    return recipes;
  }, [filter, recipes]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <AppText variant="display">{t.recipes.title}</AppText>
          <AppText variant="small" tone="muted" tabular style={styles.subtitle}>
            {recipes.length === 0
              ? t.recipes.emptySubtitle
              : t.recipes.countSubtitle(recipes.length)}
          </AppText>
        </View>
        <IconButton
          icon="plus"
          label={t.recipes.newRecipe}
          variant="accent"
          onPress={() => router.push('/recipes/new')}
        />
      </View>

      <View style={styles.filters}>
        <ChipRow>
          <Chip
            label={t.recipes.filterAll(recipes.length)}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <Chip
            label={t.recipes.filterFavourites}
            icon="star"
            selected={filter === 'favorites'}
            onPress={() => setFilter('favorites')}
          />
          <Chip
            label={t.recipes.filterStarters}
            icon="compass"
            selected={filter === 'starters'}
            onPress={() => setFilter('starters')}
          />
        </ChipRow>
      </View>

      {error && !data ? (
        <View style={styles.stateBox}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      ) : loading && !data ? (
        <LoadingState label={t.recipes.loading} />
      ) : filtered.length > 0 ? (
        <View style={styles.list}>
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onPress={() => router.push(`/recipes/${recipe.id}`)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.stateBox}>
          <EmptyState
            icon="book-open"
            title={filter === 'all' ? t.recipes.emptyAllTitle : t.recipes.emptyFilterTitle}
            description={
              filter === 'favorites'
                ? t.recipes.emptyFavDesc
                : t.recipes.emptyAllDesc
            }
            actionLabel={t.recipes.newRecipe}
            onAction={() => router.push('/recipes/new')}
          />
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.recipes.starterGuideA11y}
        onPress={() => router.push('/guide/v60-basics')}
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
          <AppText variant="bodyStrong">{t.recipes.starterGuideTitle}</AppText>
          <AppText variant="caption" tone="muted">
            {t.recipes.starterGuideSub}
          </AppText>
        </View>
        <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
      </Pressable>

      <AppText variant="caption" tone="faint" align="center" style={styles.disclaimer}>
        {disclaimers.starterRecipes}
      </AppText>
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
  filters: { marginTop: Spacing.xl },
  list: { gap: Spacing.sm, marginTop: Spacing.lg },
  stateBox: { marginTop: Spacing.lg },
  guideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  disclaimer: { marginTop: Spacing.lg },
  flex: { flex: 1 },
});
