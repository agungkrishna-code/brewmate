import type { BrewRecipeSummary } from '@/types';
import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, formatRatio, formatWeight } from '@/utils/formatting';
import { Ionicons } from '../common/icon';
import { Badge } from '../common/section';
import { AppText } from '../common/text';

interface RecipeCardProps {
  recipe: BrewRecipeSummary;
  onPress: () => void;
  /** Horizontal layout for a short list on the dashboard. */
  compact?: boolean;
}

export function RecipeCard({ recipe, onPress, compact }: RecipeCardProps) {
  const theme = useTheme();
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
          <Badge label="Recipe" />
          {recipe.isFavorite ? (
            <Ionicons name="star" size={13} color={theme.gold} />
          ) : null}
        </View>
        <AppText variant="h3" numberOfLines={2} style={styles.compactTitle}>
          {recipe.name}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatWeight(recipe.coffeeDoseG, true)} · {formatRatio(recipe.ratio)}
        </AppText>
        <AppText variant="caption" tone="faint">
          {formatDuration(recipe.targetTimeS)} · {formatWeight(totalWater, true)} water
        </AppText>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${recipe.name} recipe`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      <View style={[styles.accent, { backgroundColor: recipe.isFavorite ? theme.gold : theme.primarySoft }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="h3" numberOfLines={1} style={styles.flex}>
            {recipe.name}
          </AppText>
          {recipe.isStarter ? <Badge label="Starter" /> : null}
        </View>
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          {recipe.description ?? 'No description yet.'}
        </AppText>
        <View style={styles.metaRow}>
          <AppText variant="caption" tone="faint">
            {formatWeight(recipe.coffeeDoseG, true)} · {formatRatio(recipe.ratio)} ·{' '}
            {formatWeight(totalWater, true)}
          </AppText>
          <AppText variant="caption" tone="faint">
            {formatDuration(recipe.targetTimeS)}
          </AppText>
        </View>
      </View>
      <View style={styles.trailing}>
        {recipe.isFavorite ? (
          <Ionicons name="star" size={14} color={theme.gold} />
        ) : (
          <Ionicons name="chevron-forward" size={15} color={theme.textFaint} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  accent: { width: 4 },
  body: { flex: 1, padding: Spacing.md, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  trailing: { paddingRight: Spacing.md, justifyContent: 'center' },
  compact: {
    width: 172,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: 3,
  },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  compactTitle: { fontSize: 15, lineHeight: 20 },
  flex: { flex: 1 },
});
