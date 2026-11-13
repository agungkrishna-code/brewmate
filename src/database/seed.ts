/** Seed data: the two built-in grinders and the editable starter recipes. */

import { BUILTIN_GRINDER_IDS, STARTER_RECIPES } from '@/constants/defaults';
import type { GrinderProfile } from '@/types';
import type { SQLiteDatabase } from 'expo-sqlite';

const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

export const BUILTIN_GRINDERS: GrinderProfile[] = [
  {
    id: BUILTIN_GRINDER_IDS.s5Pro,
    name: 'Chestnut S5 Pro',
    brand: 'TIMEMORE',
    model: 'timemore-s5-pro',
    clicksPerRotation: 90,
    settingUnit: 'rotations',
    micronsPerClick: 15,
    macroStepsPerRotation: null,
    referenceMin: 5.0,
    referenceMax: 8.0,
    referenceNote:
      "Manufacturer's published pour-over starting reference: 5.0–8.0 on the dial. Treat it as a starting window, then taste and adjust.",
    preferredMin: null,
    preferredMax: null,
    isBuiltin: true,
    notes: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: BUILTIN_GRINDER_IDS.c5Pro,
    name: 'Chestnut C5 Pro',
    brand: 'TIMEMORE',
    model: 'timemore-c5-pro',
    clicksPerRotation: 48,
    settingUnit: 'clicks',
    micronsPerClick: 31,
    macroStepsPerRotation: 16,
    referenceMin: null,
    referenceMax: null,
    referenceNote:
      'TIMEMORE does not publish a pour-over range for this model. It has 48 clicks per rotation across 16 macro steps, so record your own working range.',
    preferredMin: null,
    preferredMax: null,
    isBuiltin: true,
    notes: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

const STARTER_IDS: Record<string, string> = {
  'Classic 4-Pour': 'recipe-starter-classic-4-pour',
  'Bright & Sweet': 'recipe-starter-bright-and-sweet',
  'Slow Single Pour': 'recipe-starter-slow-single-pour',
};

/** Inserts the two core grinder profiles when they are missing. Idempotent. */
export async function ensureBuiltinGrinders(db: SQLiteDatabase): Promise<void> {
  for (const grinder of BUILTIN_GRINDERS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO grinder_profiles (
        id, name, brand, model, clicks_per_rotation, setting_unit, microns_per_click,
        macro_steps_per_rotation, reference_min, reference_max, reference_note,
        preferred_min, preferred_max, is_builtin, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        grinder.id,
        grinder.name,
        grinder.brand,
        grinder.model,
        grinder.clicksPerRotation,
        grinder.settingUnit,
        grinder.micronsPerClick,
        grinder.macroStepsPerRotation,
        grinder.referenceMin,
        grinder.referenceMax,
        grinder.referenceNote,
        grinder.preferredMin,
        grinder.preferredMax,
        1,
        grinder.notes,
        grinder.createdAt,
        grinder.updatedAt,
      ]
    );
  }
}

/** Seeds starter recipes once, on database creation. */
export async function seedStarterRecipes(db: SQLiteDatabase): Promise<void> {
  for (const recipe of STARTER_RECIPES) {
    const id = STARTER_IDS[recipe.name] ?? `recipe-starter-${recipe.name.toLowerCase().replace(/\s+/g, '-')}`;
    await db.runAsync(
      `INSERT OR IGNORE INTO brew_recipes (
        id, name, description, coffee_dose_g, ratio, total_water_g, water_temp_c, bloom_multiplier,
        bloom_duration_s, grinder_profile_id, grind_setting, target_time_s, notes,
        is_favorite, is_starter, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        recipe.name,
        recipe.description,
        recipe.coffeeDoseG,
        recipe.ratio,
        recipe.totalWaterG,
        recipe.waterTempC,
        recipe.bloomMultiplier,
        recipe.bloomDurationS,
        recipe.grinderProfileId,
        recipe.grindSetting,
        recipe.targetTimeS,
        recipe.notes,
        0,
        1,
        recipe.createdAt,
        recipe.updatedAt,
      ]
    );

    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM brew_pour_steps WHERE recipe_id = ?',
      [id]
    );
    if ((existing?.count ?? 0) > 0) continue;

    for (const step of recipe.steps) {
      await db.runAsync(
        `INSERT INTO brew_pour_steps (id, recipe_id, step_order, label, kind, target_water_g, duration_s)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `${id}-step-${step.stepOrder}`,
          id,
          step.stepOrder,
          step.label,
          step.kind,
          step.targetWaterG,
          step.durationS,
        ]
      );
    }
  }
}
