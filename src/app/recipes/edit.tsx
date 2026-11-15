import { EmptyState, ErrorState, LoadingState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { Spacing } from '@/constants/theme';
import { useQuery } from '@/hooks/use-database';
import { useTranslation } from '@/hooks/use-language';
import { getRecipe } from '@/services/recipes';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function EditRecipeScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = typeof id === 'string' ? id : '';

  const { data, loading, error, reload } = useQuery(
    async (db) => (recipeId ? getRecipe(db, recipeId) : null),
    recipeId
  );

  if (loading) {
    return (
      <Screen>
        <View style={{ paddingTop: Spacing.xxxl }}>
          <LoadingState label={t.recipes.detailLoading} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={{ paddingTop: Spacing.xxxl }}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <View style={{ paddingTop: Spacing.xxxl }}>
          <EmptyState
            icon="alert-circle"
            title={t.recipes.notFoundTitle}
            description={t.recipes.editNotFoundDesc}
            actionLabel={t.recipes.backToRecipes}
            onAction={() => router.replace('/recipes')}
          />
        </View>
      </Screen>
    );
  }

  return <RecipeForm initialRecipe={data} />;
}
