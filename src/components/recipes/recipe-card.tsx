import type { BrewRecipeSummary } from '@/types';
import { Pressable, StyleSheet, View } from 'react-native';
import { localizeStarterRecipe } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, formatRatio, formatWeight } from '@/utils/formatting';
import { AppIcon } from '../common/icon';
import { Badge } from '../common/section';
import { AppText } from '../common/text';

interface RecipeCardProps {
  recipe: BrewRecipeSummary;
  onPress: () => void;
  /** Horizontal layout for a short list on the dashboard. */
  compact?: boolean;
}

export function RecipeCard({ recipe: rawRecipe, onPress, compact }: RecipeCardProps) {
  const theme = useTheme();
  const { lang, t } = useTranslation();
  const recipe = localizeStarterRecipe(rawRecipe, lang);
  const totalWater = recipe.totalWaterG;

  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recipe.name}
        onPress={onPress}
        style={({ pressed }) => [
          styles.compact,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <View style={styles.compactTop}>
          <AppText variant="caption" tone="faint" tabular>
            {formatRatio(recipe.ratio)}
          </AppText>
          {recipe.isFavorite ? (
            <AppIcon name="star" size={13} color={theme.accent} filled />
          ) : null}
        </View>
        <AppText variant="h3" numberOfLines={2} style={styles.compactTitle}>
          {recipe.name}
        </AppText>
        <AppText variant="caption" tone="muted" tabular>
          {formatWeight(recipe.coffeeDoseG, true)} → {formatWeight(totalWater, true)}
        </AppText>
        <AppText variant="caption" tone="faint" tabular>
          {formatDuration(recipe.targetTimeS)}
        </AppText>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.recipes.cardA11y(recipe.name)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="h3" numberOfLines={1} style={styles.flex}>
            {recipe.name}
          </AppText>
          {recipe.isStarter ? <Badge label={t.recipes.starterBadge} /> : null}
        </View>
        {recipe.description ? (
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {recipe.description}
          </AppText>
        ) : null}
        <View style={styles.metaRow}>
          <AppText variant="caption" tone="faint" tabular>
            {formatWeight(recipe.coffeeDoseG, true)} · {formatRatio(recipe.ratio)} ·{' '}
            {formatWeight(totalWater, true)}
          </AppText>
          <AppText variant="caption" tone="faint" tabular>
            {formatDuration(recipe.targetTimeS)}
          </AppText>
        </View>
      </View>
      <View style={styles.trailing}>
        {recipe.isFavorite ? (
          <AppIcon name="star" size={14} color={theme.accent} filled />
        ) : (
          <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  trailing: { justifyContent: 'center' },
  compact: {
    width: 168,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 4,
  },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  compactTitle: { fontSize: 15, lineHeight: 20 },
  flex: { flex: 1 },
});
