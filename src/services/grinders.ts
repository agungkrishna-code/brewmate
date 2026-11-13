/** Grinder profiles and saved grind settings. */

import type {
  GrinderDraft,
  GrinderModel,
  GrinderProfile,
  GrinderSettingUnit,
  GrindSettingDetail,
} from '@/types';
import { createGrindSettingId, createGrinderId } from '@/utils/id';
import type { SQLiteDatabase } from 'expo-sqlite';

interface GrinderRow {
  id: string;
  name: string;
  brand: string;
  model: GrinderModel;
  clicks_per_rotation: number;
  setting_unit: GrinderSettingUnit;
  microns_per_click: number;
  macro_steps_per_rotation: number | null;
  reference_min: number | null;
  reference_max: number | null;
  reference_note: string | null;
  preferred_min: number | null;
  preferred_max: number | null;
  is_builtin: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapGrinder(row: GrinderRow): GrinderProfile {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    clicksPerRotation: row.clicks_per_rotation,
    settingUnit: row.setting_unit,
    micronsPerClick: row.microns_per_click,
    macroStepsPerRotation: row.macro_steps_per_rotation,
    referenceMin: row.reference_min,
    referenceMax: row.reference_max,
    referenceNote: row.reference_note,
    preferredMin: row.preferred_min,
    preferredMax: row.preferred_max,
    isBuiltin: row.is_builtin === 1,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const GRINDER_SELECT = `
  SELECT id, name, brand, model, clicks_per_rotation, setting_unit, microns_per_click,
         macro_steps_per_rotation, reference_min, reference_max, reference_note,
         preferred_min, preferred_max, is_builtin, notes, created_at, updated_at
  FROM grinder_profiles
`;

export async function listGrinders(db: SQLiteDatabase): Promise<GrinderProfile[]> {
  const rows = await db.getAllAsync<GrinderRow>(
    `${GRINDER_SELECT} ORDER BY is_builtin DESC, name COLLATE NOCASE ASC`
  );
  return rows.map(mapGrinder);
}

export async function getGrinder(
  db: SQLiteDatabase,
  id: string
): Promise<GrinderProfile | null> {
  const row = await db.getFirstAsync<GrinderRow>(`${GRINDER_SELECT} WHERE id = ?`, [id]);
  return row ? mapGrinder(row) : null;
}

export async function createGrinder(db: SQLiteDatabase, draft: GrinderDraft): Promise<string> {
  const id = createGrinderId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO grinder_profiles (
      id, name, brand, model, clicks_per_rotation, setting_unit, microns_per_click,
      macro_steps_per_rotation, reference_min, reference_max, reference_note,
      preferred_min, preferred_max, is_builtin, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [
      id,
      draft.name.trim(),
      draft.brand.trim() || 'Custom',
      draft.model,
      draft.clicksPerRotation,
      draft.settingUnit,
      draft.micronsPerClick,
      draft.macroStepsPerRotation,
      draft.referenceMin,
      draft.referenceMax,
      draft.referenceNote?.trim() || null,
      draft.preferredMin,
      draft.preferredMax,
      draft.notes?.trim() || null,
      now,
      now,
    ]
  );
  return id;
}

/**
 * Updates a profile. Built-in grinders keep their published hardware constants
 * and reference range; only the user's own range and notes are editable.
 */
export async function updateGrinder(
  db: SQLiteDatabase,
  id: string,
  draft: GrinderDraft
): Promise<void> {
  const existing = await getGrinder(db, id);
  if (!existing) throw new Error('Grinder not found.');
  const now = new Date().toISOString();

  if (existing.isBuiltin) {
    await db.runAsync(
      `UPDATE grinder_profiles
         SET preferred_min = ?, preferred_max = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [draft.preferredMin, draft.preferredMax, draft.notes?.trim() || null, now, id]
    );
    return;
  }

  await db.runAsync(
    `UPDATE grinder_profiles
       SET name = ?, brand = ?, model = ?, clicks_per_rotation = ?, setting_unit = ?,
           microns_per_click = ?, macro_steps_per_rotation = ?, reference_min = ?,
           reference_max = ?, reference_note = ?, preferred_min = ?, preferred_max = ?,
           notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      draft.name.trim(),
      draft.brand.trim() || 'Custom',
      draft.model,
      draft.clicksPerRotation,
      draft.settingUnit,
      draft.micronsPerClick,
      draft.macroStepsPerRotation,
      draft.referenceMin,
      draft.referenceMax,
      draft.referenceNote?.trim() || null,
      draft.preferredMin,
      draft.preferredMax,
      draft.notes?.trim() || null,
      now,
      id,
    ]
  );
}

export async function deleteGrinder(db: SQLiteDatabase, id: string): Promise<void> {
  const existing = await getGrinder(db, id);
  if (!existing) return;
  if (existing.isBuiltin) throw new Error('Built-in grinders cannot be deleted.');
  await db.runAsync('DELETE FROM grinder_profiles WHERE id = ?', [id]);
}

/* ------------------------------------------------------------------ */
/* Saved grind settings                                                */
/* ------------------------------------------------------------------ */

interface GrindSettingRow {
  id: string;
  grinder_profile_id: string;
  coffee_bean_id: string | null;
  recipe_id: string | null;
  setting_value: number;
  clicks: number | null;
  notes: string | null;
  created_at: string;
  grinder_name: string;
  bean_name: string | null;
  recipe_name: string | null;
}

export async function listGrindSettings(
  db: SQLiteDatabase,
  grinderProfileId?: string
): Promise<GrindSettingDetail[]> {
  const params: (string | number)[] = [];
  let where = '';
  if (grinderProfileId) {
    where = 'WHERE gs.grinder_profile_id = ?';
    params.push(grinderProfileId);
  }

  const rows = await db.getAllAsync<GrindSettingRow>(
    `SELECT gs.id, gs.grinder_profile_id, gs.coffee_bean_id, gs.recipe_id, gs.setting_value,
            gs.clicks, gs.notes, gs.created_at,
            gp.name AS grinder_name,
            cb.name AS bean_name,
            br.name AS recipe_name
       FROM grind_settings gs
       JOIN grinder_profiles gp ON gp.id = gs.grinder_profile_id
       LEFT JOIN coffee_beans cb ON cb.id = gs.coffee_bean_id
       LEFT JOIN brew_recipes br ON br.id = gs.recipe_id
       ${where}
      ORDER BY gs.created_at DESC`,
    params
  );

  if (rows.length === 0) return [];

  // Latest rated session per (grinder, setting, bean) for the tasting column.
  const sessions = await db.getAllAsync<{
    grinder_profile_id: string | null;
    grind_setting: number | null;
    coffee_bean_id: string | null;
    brewed_at: string;
    rating: number | null;
  }>(
    `SELECT s.grinder_profile_id, s.grind_setting, s.coffee_bean_id, s.brewed_at,
            ROUND(
              (COALESCE(r.acidity, 0) + COALESCE(r.sweetness, 0) + COALESCE(r.bitterness, 0) +
               COALESCE(r.body, 0) + COALESCE(r.clarity, 0) + COALESCE(r.aftertaste, 0)) * 1.0 /
              NULLIF((r.acidity IS NOT NULL) + (r.sweetness IS NOT NULL) + (r.bitterness IS NOT NULL) +
                     (r.body IS NOT NULL) + (r.clarity IS NOT NULL) + (r.aftertaste IS NOT NULL), 0)
            , 2) AS rating
       FROM brew_sessions s
       LEFT JOIN brew_session_ratings r ON r.session_id = s.id
      WHERE s.grind_setting IS NOT NULL
      ORDER BY s.brewed_at DESC`
  );

  const ratingByKey = new Map<string, { rating: number | null; brewedAt: string }>();
  for (const session of sessions) {
    if (session.grinder_profile_id == null || session.grind_setting == null) continue;
    const key = `${session.grinder_profile_id}|${session.grind_setting}|${session.coffee_bean_id ?? ''}`;
    if (!ratingByKey.has(key)) {
      ratingByKey.set(key, { rating: session.rating, brewedAt: session.brewed_at });
    }
  }

  return rows.map((row) => {
    const exact = ratingByKey.get(
      `${row.grinder_profile_id}|${row.setting_value}|${row.coffee_bean_id ?? ''}`
    );
    let match = exact;
    if (!match && row.coffee_bean_id != null) {
      const prefix = `${row.grinder_profile_id}|${row.setting_value}|`;
      match = Array.from(ratingByKey.entries()).find(([key]) => key.startsWith(prefix))?.[1];
    }

    return {
      id: row.id,
      grinderProfileId: row.grinder_profile_id,
      coffeeBeanId: row.coffee_bean_id,
      recipeId: row.recipe_id,
      settingValue: row.setting_value,
      clicks: row.clicks,
      notes: row.notes,
      createdAt: row.created_at,
      grinderName: row.grinder_name,
      beanName: row.bean_name,
      recipeName: row.recipe_name,
      lastRating: match?.rating ?? null,
      lastBrewedAt: match?.brewedAt ?? null,
    };
  });
}

export interface SaveGrindSettingInput {
  grinderProfileId: string;
  coffeeBeanId: string | null;
  recipeId: string | null;
  settingValue: number;
  clicks: number | null;
  notes: string | null;
}

export async function saveGrindSetting(
  db: SQLiteDatabase,
  input: SaveGrindSettingInput
): Promise<string> {
  const id = createGrindSettingId();
  await db.runAsync(
    `INSERT INTO grind_settings (
       id, grinder_profile_id, coffee_bean_id, recipe_id, setting_value, clicks, notes, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.grinderProfileId,
      input.coffeeBeanId,
      input.recipeId,
      input.settingValue,
      input.clicks,
      input.notes?.trim() || null,
      new Date().toISOString(),
    ]
  );
  return id;
}

export async function deleteGrindSetting(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM grind_settings WHERE id = ?', [id]);
}
