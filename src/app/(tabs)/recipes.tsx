import { Button, IconButton } from '@/components/common/button';
import { Chip, ChipRow } from '@/components/common/chip';
import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { DISCLAIMERS } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { listRecipeSummaries } from '@/services/recipes';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

type Filter = 'all' | 'favorites' | 'starters';

export default function RecipesScreen() {
  const theme = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const { data } = useFocusedQuery(async (db) => listRecipeSummaries(db));
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
          <AppText variant="display">Recipes</AppText>
          <AppText variant="small" tone="muted" style={styles.subtitle}>
            {recipes.length === 0
              ? 'Save a plan once, brew it forever.'
              : `${recipes.length} recipe${recipes.length === 1 ? '' : 's'} in your library`}
          </AppText>
        </View>
        <IconButton
          icon="add"
          label="New recipe"
          variant="inverse"
          onPress={() => router.push('/recipes/new')}
        />
      </View>

      <View style={styles.filters}>
        <ChipRow>
          <Chip
            label={`All ${recipes.length}`}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <Chip
            label="Favourites"
            icon="star-outline"
            selected={filter === 'favorites'}
            onPress={() => setFilter('favorites')}
          />
          <Chip
            label="Starters"
            icon="leaf-outline"
            selected={filter === 'starters'}
            onPress={() => setFilter('starters')}
          />
        </ChipRow>
      </View>

      {filtered.length > 0 ? (
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
        <EmptyState
          icon="book-outline"
          title={filter === 'all' ? 'No recipes yet' : 'Nothing here yet'}
          description={
            filter === 'favorites'
              ? 'Tap the star on any recipe to pin it to your favourites.'
              : 'Create a recipe to keep your dose, ratio and pour schedule in one place.'
          }
          actionLabel="New recipe"
          onAction={() => router.push('/recipes/new')}
        />
      )}

      <View style={styles.section}>
        <SectionHeader
          title="Using a starter"
          actionLabel="Guide"
          onAction={() => router.push('/guide/v60-basics')}
        />
        <View style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="small">
            Brew a starter once without changing it. That is your baseline. Then adjust the
            grind, one click at a time, until the sweetness and finish suit the coffee in the
            bag.
          </AppText>
          <AppText variant="caption" tone="muted">
            Bright & Sweet suits floral light roasts and smaller cups. Classic 4-Pour is the
            balanced reference. Slow Single Pour is built for a larger, gentler brew.
          </AppText>
        </View>
      </View>

      <AppText variant="caption" tone="faint" align="center" style={styles.disclaimer}>
        {DISCLAIMERS.starterRecipes}
      </AppText>

      {recipes.length > 0 ? (
        <Button
          label="Create a recipe"
          icon="add"
          variant="secondary"
          onPress={() => router.push('/recipes/new')}
          style={styles.bottomButton}
        />
      ) : null}
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
  section: { marginTop: Spacing.xxl },
  noteCard: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  disclaimer: { marginTop: Spacing.xl },
  bottomButton: { marginTop: Spacing.lg },
  flex: { flex: 1 },
});
