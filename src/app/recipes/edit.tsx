import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { AppText } from '@/components/common/text';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { Spacing } from '@/constants/theme';
import { useQuery } from '@/hooks/use-database';
import { getRecipe } from '@/services/recipes';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = typeof id === 'string' ? id : '';

  const { data, loading } = useQuery(
    async (db) => (recipeId ? getRecipe(db, recipeId) : null),
    recipeId
  );

  if (loading) {
    return (
      <Screen>
        <View style={{ paddingTop: Spacing.xxxl }}>
          <AppText variant="small" tone="muted">
            Loading recipe…
          </AppText>
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <View style={{ paddingTop: Spacing.xxxl }}>
          <EmptyState
            icon="alert-circle-outline"
            title="Recipe not found"
            description="It may have been deleted. Head back to the library to pick another one."
            actionLabel="Back to recipes"
            onAction={() => router.replace('/recipes')}
          />
        </View>
      </Screen>
    );
  }

  return <RecipeForm initialRecipe={data} />;
}
