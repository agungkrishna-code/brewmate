import { RecipeForm, type RecipePrefill } from '@/components/recipes/recipe-form';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

export default function NewRecipeScreen() {
  const { prefill } = useLocalSearchParams<{ prefill?: string }>();

  const parsed = useMemo<RecipePrefill | null>(() => {
    if (!prefill) return null;
    try {
      const candidate = JSON.parse(prefill) as RecipePrefill;
      if (!Array.isArray(candidate.steps)) return null;
      return candidate;
    } catch {
      return null;
    }
  }, [prefill]);

  return <RecipeForm prefill={parsed} />;
}
