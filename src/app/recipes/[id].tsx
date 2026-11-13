import { Facts } from '@/components/brewing/facts';
import { StageList } from '@/components/brewing/stage-list';
import { BrandCard, BrandLabel } from '@/components/common/brand-card';
import { Button, IconButton } from '@/components/common/button';
import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { Badge, DataRow, SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { DISCLAIMERS } from '@/constants/defaults';
import { BrandSurface, Radius, Spacing } from '@/constants/theme';
import { useBrewDraft } from '@/contexts/brew-draft-context';
import { useDatabase, useFocusedQuery } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { buildTimeline, brewDraftFromRecipe } from '@/services/brewing/timeline';
import { deleteRecipe, duplicateRecipe, getRecipe, setRecipeFavorite } from '@/services/recipes';
import { getGrinder } from '@/services/grinders';
import { formatDuration, formatRatio, formatTemperature, formatWeight } from '@/utils/formatting';
import { formatSetting, settingDetail } from '@/utils/grinder';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function RecipeDetailScreen() {
  const theme = useTheme();
  const db = useDatabase();
  const { beginBrew } = useBrewDraft();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = typeof id === 'string' ? id : '';

  const { data, loading, reload } = useFocusedQuery(
    async (database) => {
      const recipe = recipeId ? await getRecipe(database, recipeId) : null;
      const grinder = recipe?.grinderProfileId
        ? await getGrinder(database, recipe.grinderProfileId)
        : null;
      return recipe ? { recipe, grinder } : null;
    },
    recipeId
  );

  const [busy, setBusy] = useState(false);

  const toggleFavorite = useCallback(async () => {
    if (!data) return;
    await setRecipeFavorite(db, data.recipe.id, !data.recipe.isFavorite);
    reload();
  }, [data, db, reload]);

  const startBrew = useCallback(() => {
    if (!data) return;
    beginBrew(brewDraftFromRecipe(data.recipe));
    router.push('/brewing/timer');
  }, [beginBrew, data]);

  const duplicate = useCallback(async () => {
    if (!data) return;
    setBusy(true);
    try {
      const newId = await duplicateRecipe(db, data.recipe.id);
      if (newId) router.push(`/recipes/${newId}`);
    } finally {
      setBusy(false);
    }
  }, [data, db]);

  const confirmDelete = useCallback(() => {
    if (!data) return;
    Alert.alert(
      'Delete recipe?',
      `"${data.recipe.name}" will be removed. Brew sessions logged with it keep their own snapshot.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRecipe(db, data.recipe.id);
            router.back();
          },
        },
      ]
    );
  }, [data, db]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
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
        <View style={styles.loading}>
          <EmptyState
            icon="alert-circle-outline"
            title="Recipe not found"
            description="This recipe may have been deleted."
            actionLabel="Back to recipes"
            onAction={() => router.replace('/recipes')}
          />
        </View>
      </Screen>
    );
  }

  const { recipe, grinder } = data;
  const timeline = buildTimeline(recipe.steps);
  const totalWater = recipe.totalWaterG;

  return (
    <Screen
      footer={
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            label="Start brewing"
            icon="play"
            size="lg"
            onPress={startBrew}
            fullWidth
          />
        </View>
      }>
      <View style={styles.topBar}>
        <IconButton icon="chevron-back" label="Go back" onPress={() => router.back()} />
        <View style={styles.flex} />
        <IconButton
          icon={recipe.isFavorite ? 'star' : 'star-outline'}
          label={recipe.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
          onPress={toggleFavorite}
        />
        <IconButton
          icon="create-outline"
          label="Edit recipe"
          onPress={() => router.push(`/recipes/edit?id=${recipe.id}`)}
        />
      </View>

      <View style={styles.titleBlock}>
        <View style={styles.badgeRow}>
          {recipe.isStarter ? <Badge label="Starter recipe" tone="gold" /> : null}
          {recipe.isFavorite ? <Badge label="Favourite" /> : null}
        </View>
        <AppText variant="display">{recipe.name}</AppText>
        {recipe.description ? (
          <AppText variant="small" tone="muted" style={styles.description}>
            {recipe.description}
          </AppText>
        ) : null}
      </View>

      <BrandCard style={styles.hero}>
        <BrandLabel>Brew plan</BrandLabel>
        <AppText variant="h1" color={BrandSurface.text}>
          {formatWeight(totalWater, true)} water
        </AppText>
        <AppText variant="small" color={BrandSurface.muted}>
          {formatWeight(recipe.coffeeDoseG, true)} coffee · {formatRatio(recipe.ratio)} ·{' '}
          {formatDuration(recipe.targetTimeS || timeline[timeline.length - 1]?.endS || 0)}
        </AppText>
        <View style={[styles.divider, { backgroundColor: BrandSurface.line }]} />
        <Facts
          tone="brand"
          items={[
            { label: 'Dose', value: formatWeight(recipe.coffeeDoseG), unit: 'g' },
            { label: 'Water', value: formatWeight(totalWater), unit: 'g' },
            { label: 'Ratio', value: formatRatio(recipe.ratio) },
            { label: 'Temp', value: String(Math.round(recipe.waterTempC)), unit: '°C' },
          ]}
        />
      </BrandCard>

      <View style={styles.section}>
        <SectionHeader
          title="Schedule"
          subtitle={`${timeline.length} stages · bloom ${formatWeight(
            recipe.coffeeDoseG * recipe.bloomMultiplier,
            true
          )} at ${recipe.bloomMultiplier}×`}
        />
        <StageList stages={timeline} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Equipment" />
        <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <DataRow label="Grinder" value={grinder?.name ?? 'Not set'} emphasis={Boolean(grinder)} />
          <DataRow
            label="Grind setting"
            value={
              grinder && recipe.grindSetting != null
                ? formatSetting(grinder, recipe.grindSetting)
                : 'Not set'
            }
            emphasis={recipe.grindSetting != null}
          />
          {grinder && recipe.grindSetting != null ? (
            <DataRow label="Click maths" value={settingDetail(grinder, recipe.grindSetting)} />
          ) : null}
          <DataRow label="Water temperature" value={formatTemperature(recipe.waterTempC)} />
          <DataRow label="Target brew time" value={formatDuration(recipe.targetTimeS)} />
        </View>
      </View>

      {recipe.notes ? (
        <View style={styles.section}>
          <SectionHeader title="Notes" />
          <View style={[styles.notesCard, { backgroundColor: theme.goldSoft }]}>
            <AppText variant="body">{recipe.notes}</AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Manage" />
        <View style={styles.manageRow}>
          <Button
            label="Duplicate"
            icon="copy-outline"
            variant="secondary"
            onPress={duplicate}
            loading={busy}
            style={styles.flex}
          />
          <Button
            label="Delete"
            icon="trash-outline"
            variant="danger"
            onPress={confirmDelete}
            style={styles.flex}
          />
        </View>
      </View>

      <AppText variant="caption" tone="faint" align="center" style={styles.disclaimer}>
        {recipe.isStarter ? DISCLAIMERS.starterRecipes : 'Saved locally on this device only.'}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingTop: Spacing.xxxl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  titleBlock: { paddingTop: Spacing.lg, gap: Spacing.sm },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs },
  description: { marginTop: 2 },
  hero: { marginTop: Spacing.xl, gap: Spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.md },
  section: { marginTop: Spacing.xxl },
  detailCard: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
  },
  notesCard: { borderRadius: Radius.md, padding: Spacing.lg },
  manageRow: { flexDirection: 'row', gap: Spacing.sm },
  disclaimer: { marginTop: Spacing.xl },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
