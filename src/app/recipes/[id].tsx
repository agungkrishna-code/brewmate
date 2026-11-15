import { Facts } from '@/components/brewing/facts';
import { StageList } from '@/components/brewing/stage-list';
import { BrandCard, BrandLabel } from '@/components/common/brand-card';
import { Button, IconButton } from '@/components/common/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { Badge, DataRow, SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { getDisclaimers, localizeStarterRecipe } from '@/constants/defaults';
import { BrandSurface, Radius, Spacing } from '@/constants/theme';
import { useBrewDraft } from '@/contexts/brew-draft-context';
import { useDatabase, useFocusedQuery } from '@/hooks/use-database';
import { useTranslation } from '@/hooks/use-language';
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
  const { lang, t } = useTranslation();
  const disclaimers = getDisclaimers(lang);
  const { beginBrew } = useBrewDraft();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = typeof id === 'string' ? id : '';

  const { data, loading, error, reload } = useFocusedQuery(
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
      const newId = await duplicateRecipe(db, data.recipe.id, t.recipes.copySuffix);
      if (newId) router.push(`/recipes/${newId}`);
    } finally {
      setBusy(false);
    }
  }, [data, db, t.recipes.copySuffix]);

  const confirmDelete = useCallback(() => {
    if (!data) return;
    Alert.alert(
      t.recipes.deleteTitle,
      t.recipes.deleteMsg(data.recipe.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            await deleteRecipe(db, data.recipe.id);
            router.back();
          },
        },
      ]
    );
  }, [data, db, t]);

  if (loading && !data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <LoadingState label={t.recipes.detailLoading} />
        </View>
      </Screen>
    );
  }

  if (error && !data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <EmptyState
            icon="alert-circle"
            title={t.recipes.notFoundTitle}
            description={t.recipes.notFoundDesc}
            actionLabel={t.recipes.backToRecipes}
            onAction={() => router.replace('/recipes')}
          />
        </View>
      </Screen>
    );
  }

  const recipe = localizeStarterRecipe(data.recipe, lang);
  const { grinder } = data;
  const timeline = buildTimeline(recipe.steps);
  const totalWater = recipe.totalWaterG;

  return (
    <Screen
      footer={
        <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <Button
            label={t.recipes.startBrewing}
            icon="play"
            variant="accent"
            size="lg"
            onPress={startBrew}
            fullWidth
          />
        </View>
      }>
      <View style={styles.topBar}>
        <IconButton icon="chevron-left" label={t.common.back} onPress={() => router.back()} />
        <View style={styles.flex} />
        <IconButton
          icon="star"
          color={recipe.isFavorite ? theme.accent : theme.textMuted}
          label={recipe.isFavorite ? t.recipes.removeFavA11y : t.recipes.addFavA11y}
          onPress={toggleFavorite}
        />
        <IconButton
          icon="edit"
          label={t.recipes.editA11y}
          onPress={() => router.push(`/recipes/edit?id=${recipe.id}`)}
        />
      </View>

      <View style={styles.titleBlock}>
        {recipe.isStarter || recipe.isFavorite ? (
          <View style={styles.badgeRow}>
            {recipe.isStarter ? <Badge label={t.recipes.starterBadge} tone="accent" /> : null}
            {recipe.isFavorite ? <Badge label={t.recipes.favouriteBadge} /> : null}
          </View>
        ) : null}
        <AppText variant="display">{recipe.name}</AppText>
        {recipe.description ? (
          <AppText variant="small" tone="muted" style={styles.description}>
            {recipe.description}
          </AppText>
        ) : null}
      </View>

      <BrandCard style={styles.hero}>
        <BrandLabel>{t.recipes.brewPlan}</BrandLabel>
        <AppText variant="metricHero" color={BrandSurface.text}>
          {formatWeight(totalWater, true)}
        </AppText>
        <AppText variant="small" color={BrandSurface.muted} tabular>
          {t.recipes.planSummary(
            formatWeight(recipe.coffeeDoseG, true),
            formatRatio(recipe.ratio),
            formatDuration(recipe.targetTimeS || timeline[timeline.length - 1]?.endS || 0)
          )}
        </AppText>
        <View style={[styles.divider, { backgroundColor: BrandSurface.line }]} />
        <Facts
          tone="brand"
          items={[
            { label: t.common.dose, value: formatWeight(recipe.coffeeDoseG), unit: 'g' },
            { label: t.common.water, value: formatWeight(totalWater), unit: 'g' },
            { label: t.common.ratio, value: formatRatio(recipe.ratio) },
            { label: t.common.temp, value: String(Math.round(recipe.waterTempC)), unit: '°C' },
          ]}
        />
      </BrandCard>

      <View style={styles.section}>
        <SectionHeader
          title={t.recipes.schedule}
          subtitle={t.recipes.scheduleSub(
            timeline.length,
            formatWeight(recipe.coffeeDoseG * recipe.bloomMultiplier, true),
            recipe.bloomMultiplier
          )}
        />
        <StageList stages={timeline} />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.recipes.equipment} />
        <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <DataRow label={t.recipes.grinder} value={grinder?.name ?? t.common.notSet} emphasis={Boolean(grinder)} />
          <DataRow
            label={t.recipes.grindSetting}
            tabular
            value={
              grinder && recipe.grindSetting != null
                ? formatSetting(grinder, recipe.grindSetting, lang)
                : t.common.notSet
            }
            emphasis={recipe.grindSetting != null}
          />
          {grinder && recipe.grindSetting != null ? (
            <DataRow
              label={t.recipes.clickMaths}
              tabular
              value={settingDetail(grinder, recipe.grindSetting, lang)}
            />
          ) : null}
          <DataRow label={t.recipes.waterTemp} tabular value={formatTemperature(recipe.waterTempC)} />
          <DataRow label={t.recipes.targetBrewTime} tabular last value={formatDuration(recipe.targetTimeS)} />
        </View>
      </View>

      {recipe.notes ? (
        <View style={styles.section}>
          <SectionHeader title={t.recipes.notes} />
          <View
            style={[
              styles.notesCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            <AppText variant="body">{recipe.notes}</AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={t.recipes.manage} />
        <View style={styles.manageRow}>
          <Button
            label={t.recipes.duplicate}
            icon="copy"
            variant="secondary"
            onPress={duplicate}
            loading={busy}
            style={styles.flex}
          />
          <Button
            label={t.common.delete}
            icon="trash"
            variant="danger"
            onPress={confirmDelete}
            style={styles.flex}
          />
        </View>
      </View>

      <AppText variant="caption" tone="faint" align="center" style={styles.disclaimer}>
        {recipe.isStarter ? disclaimers.starterRecipes : t.common.savedLocally}
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
  titleBlock: { paddingTop: Spacing.lg, gap: Spacing.xs },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: 2 },
  description: { marginTop: 2 },
  hero: { marginTop: Spacing.xl, gap: Spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.md },
  section: { marginTop: Spacing.xxl },
  detailCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  notesCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  manageRow: { flexDirection: 'row', gap: Spacing.sm },
  disclaimer: { marginTop: Spacing.xl },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
