/** Recipe library with nested pour steps. */

import type { BrewRecipe, BrewRecipeSummary, PourStep, RecipeDraft, StepKind } from '@/types';
import { createId } from '@/utils/id';
import { stepsDuration } from '@/services/brewing/timeline';
import type { SQLiteDatabase } from 'expo-sqlite';

interface RecipeRow {
  id: string;
  name: string;
  description: string | null;
  coffee_dose_g: number;
  ratio: number;
  total_water_g: number;
  water_temp_c: number;
  bloom_multiplier: number;
  bloom_duration_s: number;
  grinder_profile_id: string | null;
  grind_setting: number | null;
  target_time_s: number;
  notes: string | null;
  is_favorite: number;
  is_starter: number;
  created_at: string;
  updated_at: string;
  step_count?: number;
  brew_count?: number;
  grinder_name?: string | null;
}

interface StepRow {
  id: string;
  recipe_id: string;
  step_order: number;
  label: string;
  kind: StepKind;
  target_water_g: number;
  duration_s: number;
}

function mapRecipe(row: RecipeRow, steps: PourStep[]): BrewRecipe {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    coffeeDoseG: row.coffee_dose_g,
    ratio: row.ratio,
    totalWaterG: row.total_water_g,
    waterTempC: row.water_temp_c,
    bloomMultiplier: row.bloom_multiplier,
    bloomDurationS: row.bloom_duration_s,
    grinderProfileId: row.grinder_profile_id,
    grindSetting: row.grind_setting,
    targetTimeS: row.target_time_s,
    notes: row.notes,
    isFavorite: row.is_favorite === 1,
    isStarter: row.is_starter === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    steps,
  };
}

function mapStep(row: StepRow): PourStep {
  return {
    id: row.id,
    stepOrder: row.step_order,
    label: row.label,
    kind: row.kind,
    targetWaterG: row.target_water_g,
    durationS: row.duration_s,
  };
}

const RECIPE_COLUMNS = `
  r.id, r.name, r.description, r.coffee_dose_g, r.ratio, r.total_water_g, r.water_temp_c,
  r.bloom_multiplier, r.bloom_duration_s, r.grinder_profile_id, r.grind_setting,
  r.target_time_s, r.notes, r.is_favorite, r.is_starter, r.created_at, r.updated_at
`;

export async function listRecipeSummaries(db: SQLiteDatabase): Promise<BrewRecipeSummary[]> {
  const rows = await db.getAllAsync<RecipeRow>(
    `SELECT ${RECIPE_COLUMNS},
            (SELECT COUNT(*) FROM brew_pour_steps s WHERE s.recipe_id = r.id) AS step_count,
            (SELECT COUNT(*) FROM brew_sessions b WHERE b.recipe_id = r.id) AS brew_count,
            g.name AS grinder_name
       FROM brew_recipes r
       LEFT JOIN grinder_profiles g ON g.id = r.grinder_profile_id
      ORDER BY r.is_favorite DESC, r.name COLLATE NOCASE ASC`
  );

  return rows.map((row) => ({
    ...mapRecipe(row, []),
    stepCount: row.step_count ?? 0,
    brewCount: row.brew_count ?? 0,
    grinderName: row.grinder_name ?? null,
  }));
}

export async function listRecipes(db: SQLiteDatabase): Promise<BrewRecipe[]> {
  const rows = await db.getAllAsync<RecipeRow>(
    `SELECT ${RECIPE_COLUMNS} FROM brew_recipes r
      ORDER BY r.is_favorite DESC, r.name COLLATE NOCASE ASC`
  );
  const stepRows = await db.getAllAsync<StepRow>(
    'SELECT * FROM brew_pour_steps ORDER BY recipe_id, step_order ASC'
  );
  const grouped = new Map<string, PourStep[]>();
  for (const step of stepRows) {
    const list = grouped.get(step.recipe_id) ?? [];
    list.push(mapStep(step));
    grouped.set(step.recipe_id, list);
  }
  return rows.map((row) => mapRecipe(row, grouped.get(row.id) ?? []));
}

export async function getRecipe(db: SQLiteDatabase, id: string): Promise<BrewRecipe | null> {
  const row = await db.getFirstAsync<RecipeRow>(
    `SELECT ${RECIPE_COLUMNS} FROM brew_recipes r WHERE r.id = ?`,
    [id]
  );
  if (!row) return null;
  const stepRows = await db.getAllAsync<StepRow>(
    'SELECT * FROM brew_pour_steps WHERE recipe_id = ? ORDER BY step_order ASC',
    [id]
  );
  return mapRecipe(row, stepRows.map(mapStep));
}

export async function listFavoriteRecipes(
  db: SQLiteDatabase,
  limit = 4
): Promise<BrewRecipeSummary[]> {
  const all = await listRecipeSummaries(db);
  return all.filter((recipe) => recipe.isFavorite).slice(0, limit);
}

/** The recipe behind the most recent brew, falling back to the newest recipe. */
export async function getLastUsedRecipe(db: SQLiteDatabase): Promise<BrewRecipe | null> {
  const usage = await db.getFirstAsync<{ recipe_id: string }>(
    `SELECT b.recipe_id FROM brew_sessions b
      WHERE b.recipe_id IS NOT NULL
      ORDER BY b.brewed_at DESC LIMIT 1`
  );
  if (usage?.recipe_id) {
    const recipe = await getRecipe(db, usage.recipe_id);
    if (recipe) return recipe;
  }
  const newest = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM brew_recipes ORDER BY updated_at DESC LIMIT 1'
  );
  return newest ? getRecipe(db, newest.id) : null;
}

async function replaceSteps(db: SQLiteDatabase, recipeId: string, steps: PourStep[]) {  await db.runAsync('DELETE FROM brew_pour_steps WHERE recipe_id = ?', [recipeId]);
  const ordered = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
  for (let index = 0; index < ordered.length; index += 1) {
    const step = ordered[index];
    await db.runAsync(
      `INSERT INTO brew_pour_steps (id, recipe_id, step_order, label, kind, target_water_g, duration_s)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        createId('step-'),
        recipeId,
        index,
        step.label.trim() || `Stage ${index + 1}`,
        step.kind,
        step.targetWaterG,
        Math.max(1, Math.round(step.durationS)),
      ]
    );
  }
}

/** Exact water total: the last step is the source of truth. */
function totalWaterFromDraft(draft: RecipeDraft): number {
  const last = draft.steps[draft.steps.length - 1];
  if (last) return last.targetWaterG;
  return Math.round(draft.coffeeDoseG * draft.ratio * 10) / 10;
}

export async function createRecipe(db: SQLiteDatabase, draft: RecipeDraft): Promise<string> {
  const id = createId('recipe-');
  const now = new Date().toISOString();
  const targetTimeS = stepsDuration(draft.steps);
  const totalWaterG = totalWaterFromDraft(draft);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO brew_recipes (
        id, name, description, coffee_dose_g, ratio, total_water_g, water_temp_c,
        bloom_multiplier, bloom_duration_s, grinder_profile_id, grind_setting,
        target_time_s, notes, is_favorite, is_starter, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        draft.name.trim(),
        draft.description.trim() || null,
        draft.coffeeDoseG,
        draft.ratio,
        totalWaterG,
        draft.waterTempC,
        draft.bloomMultiplier,
        Math.round(draft.bloomDurationS),
        draft.grinderProfileId,
        draft.grindSetting,
        targetTimeS,
        draft.notes.trim() || null,
        draft.isFavorite ? 1 : 0,
        now,
        now,
      ]
    );
    await replaceSteps(db, id, draft.steps);
  });

  return id;
}

export async function updateRecipe(
  db: SQLiteDatabase,
  id: string,
  draft: RecipeDraft
): Promise<void> {
  const targetTimeS = stepsDuration(draft.steps);
  const totalWaterG = totalWaterFromDraft(draft);
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE brew_recipes
          SET name = ?, description = ?, coffee_dose_g = ?, ratio = ?, total_water_g = ?,
              water_temp_c = ?, bloom_multiplier = ?, bloom_duration_s = ?,
              grinder_profile_id = ?, grind_setting = ?, target_time_s = ?, notes = ?,
              is_favorite = ?, updated_at = ?
        WHERE id = ?`,
      [
        draft.name.trim(),
        draft.description.trim() || null,
        draft.coffeeDoseG,
        draft.ratio,
        totalWaterG,
        draft.waterTempC,
        draft.bloomMultiplier,
        Math.round(draft.bloomDurationS),
        draft.grinderProfileId,
        draft.grindSetting,
        targetTimeS,
        draft.notes.trim() || null,
        draft.isFavorite ? 1 : 0,
        new Date().toISOString(),
        id,
      ]
    );
    await replaceSteps(db, id, draft.steps);
  });
}

export async function duplicateRecipe(db: SQLiteDatabase, id: string): Promise<string | null> {
  const source = await getRecipe(db, id);
  if (!source) return null;
  return createRecipe(db, {
    name: `${source.name} (copy)`,
    description: source.description ?? '',
    coffeeDoseG: source.coffeeDoseG,
    ratio: source.ratio,
    waterTempC: source.waterTempC,
    bloomMultiplier: source.bloomMultiplier,
    bloomDurationS: source.bloomDurationS,
    grinderProfileId: source.grinderProfileId,
    grindSetting: source.grindSetting,
    notes: source.notes ?? '',
    isFavorite: false,
    steps: source.steps,
  });
}

export async function deleteRecipe(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM brew_recipes WHERE id = ?', [id]);
}

export async function setRecipeFavorite(
  db: SQLiteDatabase,
  id: string,
  favorite: boolean
): Promise<void> {
  await db.runAsync('UPDATE brew_recipes SET is_favorite = ?, updated_at = ? WHERE id = ?', [
    favorite ? 1 : 0,
    new Date().toISOString(),
    id,
  ]);
}

export function recipeToDraft(recipe: BrewRecipe): RecipeDraft {
  return {
    name: recipe.name,
    description: recipe.description ?? '',
    coffeeDoseG: recipe.coffeeDoseG,
    ratio: recipe.ratio,
    waterTempC: recipe.waterTempC,
    bloomMultiplier: recipe.bloomMultiplier,
    bloomDurationS: recipe.bloomDurationS,
    grinderProfileId: recipe.grinderProfileId,
    grindSetting: recipe.grindSetting,
    notes: recipe.notes ?? '',
    isFavorite: recipe.isFavorite,
    steps: recipe.steps,
  };
}
