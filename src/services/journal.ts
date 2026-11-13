/** Brew journal: sessions, their stages, ratings and statistics. */

import type {
  BrewRatings,
  BrewSessionDetail,
  BrewSessionDraft,
  BrewSessionStep,
  BrewStats,
  SessionFilter,
  StepKind,
} from '@/types';
import { RATING_AVG, RATING_COUNT, RATING_SUM } from '@/utils/sql';
import { createId } from '@/utils/id';
import { RATING_KEYS } from '@/constants/defaults';
import type { SQLiteDatabase } from 'expo-sqlite';

interface SessionRow {
  id: string;
  brewed_at: string;
  coffee_bean_id: string | null;
  bean_name_snapshot: string | null;
  recipe_id: string | null;
  recipe_name_snapshot: string | null;
  grinder_profile_id: string | null;
  grinder_name_snapshot: string | null;
  grind_setting: number | null;
  coffee_dose_g: number;
  ratio: number;
  water_temp_c: number;
  total_water_g: number;
  bloom_water_g: number | null;
  total_time_s: number;
  notes: string | null;
  created_at: string;
  acidity: number | null;
  sweetness: number | null;
  bitterness: number | null;
  body: number | null;
  clarity: number | null;
  aftertaste: number | null;
  average_rating: number | null;
}

interface SessionStepRow {
  id: string;
  session_id: string;
  step_order: number;
  label: string;
  kind: StepKind;
  target_water_g: number;
  duration_s: number;
}

function ratingsFromRow(row: SessionRow): BrewRatings {
  return {
    acidity: row.acidity,
    sweetness: row.sweetness,
    bitterness: row.bitterness,
    body: row.body,
    clarity: row.clarity,
    aftertaste: row.aftertaste,
  };
}

function hasAnyRating(ratings: BrewRatings): boolean {
  return RATING_KEYS.some((key) => ratings[key] != null);
}

function mapSession(row: SessionRow): BrewSessionDetail {
  const ratings = ratingsFromRow(row);
  return {
    id: row.id,
    brewedAt: row.brewed_at,
    coffeeBeanId: row.coffee_bean_id,
    beanNameSnapshot: row.bean_name_snapshot,
    recipeId: row.recipe_id,
    recipeNameSnapshot: row.recipe_name_snapshot,
    grinderProfileId: row.grinder_profile_id,
    grinderNameSnapshot: row.grinder_name_snapshot,
    grindSetting: row.grind_setting,
    coffeeDoseG: row.coffee_dose_g,
    ratio: row.ratio,
    waterTempC: row.water_temp_c,
    totalWaterG: row.total_water_g,
    bloomWaterG: row.bloom_water_g,
    totalTimeS: row.total_time_s,
    notes: row.notes,
    createdAt: row.created_at,
    steps: [],
    ratings: hasAnyRating(ratings) ? ratings : null,
    averageRating: row.average_rating,
  };
}

const SESSION_SELECT = `
  SELECT s.id, s.brewed_at, s.coffee_bean_id, s.bean_name_snapshot, s.recipe_id,
         s.recipe_name_snapshot, s.grinder_profile_id, s.grinder_name_snapshot,
         s.grind_setting, s.coffee_dose_g, s.ratio, s.water_temp_c, s.total_water_g,
         s.bloom_water_g, s.total_time_s, s.notes, s.created_at,
         r.acidity, r.sweetness, r.bitterness, r.body, r.clarity, r.aftertaste,
         ${RATING_AVG} AS average_rating
    FROM brew_sessions s
    LEFT JOIN brew_session_ratings r ON r.session_id = s.id
`;

export async function listSessions(
  db: SQLiteDatabase,
  filter: SessionFilter = {}
): Promise<BrewSessionDetail[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filter.grinderProfileId) {
    clauses.push('s.grinder_profile_id = ?');
    params.push(filter.grinderProfileId);
  }
  if (filter.coffeeBeanId) {
    clauses.push('s.coffee_bean_id = ?');
    params.push(filter.coffeeBeanId);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.getAllAsync<SessionRow>(
    `${SESSION_SELECT} ${where} ORDER BY s.brewed_at DESC, s.created_at DESC`,
    params
  );
  return rows.map(mapSession);
}

export async function getSession(
  db: SQLiteDatabase,
  id: string
): Promise<BrewSessionDetail | null> {
  const row = await db.getFirstAsync<SessionRow>(`${SESSION_SELECT} WHERE s.id = ?`, [id]);
  if (!row) return null;
  const session = mapSession(row);
  const stepRows = await db.getAllAsync<SessionStepRow>(
    'SELECT * FROM brew_session_steps WHERE session_id = ? ORDER BY step_order ASC',
    [id]
  );
  session.steps = stepRows.map<BrewSessionStep>((step) => ({
    id: step.id,
    sessionId: step.session_id,
    stepOrder: step.step_order,
    label: step.label,
    kind: step.kind,
    targetWaterG: step.target_water_g,
    durationS: step.duration_s,
  }));
  return session;
}

async function snapshotName(
  db: SQLiteDatabase,
  table: 'coffee_beans' | 'brew_recipes' | 'grinder_profiles',
  id: string | null
): Promise<string | null> {
  if (!id) return null;
  const row = await db.getFirstAsync<{ name: string }>(`SELECT name FROM ${table} WHERE id = ?`, [
    id,
  ]);
  return row?.name ?? null;
}

export async function createSession(
  db: SQLiteDatabase,
  draft: BrewSessionDraft
): Promise<string> {
  const id = createId('session-');
  const now = new Date().toISOString();
  const [beanName, recipeName, grinderName] = await Promise.all([
    snapshotName(db, 'coffee_beans', draft.coffeeBeanId),
    snapshotName(db, 'brew_recipes', draft.recipeId),
    snapshotName(db, 'grinder_profiles', draft.grinderProfileId),
  ]);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO brew_sessions (
        id, brewed_at, coffee_bean_id, bean_name_snapshot, recipe_id, recipe_name_snapshot,
        grinder_profile_id, grinder_name_snapshot, grind_setting, coffee_dose_g, ratio,
        water_temp_c, total_water_g, bloom_water_g, total_time_s, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        draft.brewedAt,
        draft.coffeeBeanId,
        beanName,
        draft.recipeId,
        recipeName,
        draft.grinderProfileId,
        grinderName,
        draft.grindSetting,
        draft.coffeeDoseG,
        draft.ratio,
        draft.waterTempC,
        draft.totalWaterG,
        draft.bloomWaterG,
        Math.round(draft.totalTimeS),
        draft.notes.trim() || null,
        now,
      ]
    );

    for (let index = 0; index < draft.steps.length; index += 1) {
      const step = draft.steps[index];
      await db.runAsync(
        `INSERT INTO brew_session_steps (id, session_id, step_order, label, kind, target_water_g, duration_s)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          createId('sstep-'),
          id,
          index,
          step.label,
          step.kind,
          step.targetWaterG,
          Math.round(step.durationS),
        ]
      );
    }

    if (hasAnyRating(draft.ratings)) {
      await db.runAsync(
        `INSERT INTO brew_session_ratings (session_id, acidity, sweetness, bitterness, body, clarity, aftertaste)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          draft.ratings.acidity,
          draft.ratings.sweetness,
          draft.ratings.bitterness,
          draft.ratings.body,
          draft.ratings.clarity,
          draft.ratings.aftertaste,
        ]
      );
    }
  });

  return id;
}

export async function updateSessionReview(
  db: SQLiteDatabase,
  id: string,
  notes: string,
  ratings: BrewRatings
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE brew_sessions SET notes = ? WHERE id = ?', [
      notes.trim() || null,
      id,
    ]);
    const existing = await db.getFirstAsync<{ session_id: string }>(
      'SELECT session_id FROM brew_session_ratings WHERE session_id = ?',
      [id]
    );
    if (!hasAnyRating(ratings)) {
      if (existing) {
        await db.runAsync('DELETE FROM brew_session_ratings WHERE session_id = ?', [id]);
      }
      return;
    }
    const values = [
      ratings.acidity,
      ratings.sweetness,
      ratings.bitterness,
      ratings.body,
      ratings.clarity,
      ratings.aftertaste,
    ] as const;
    if (existing) {
      await db.runAsync(
        `UPDATE brew_session_ratings
            SET acidity = ?, sweetness = ?, bitterness = ?, body = ?, clarity = ?, aftertaste = ?
          WHERE session_id = ?`,
        [...values, id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO brew_session_ratings (acidity, sweetness, bitterness, body, clarity, aftertaste, session_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [...values, id]
      );
    }
  });
}

export async function deleteSession(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM brew_sessions WHERE id = ?', [id]);
}

export async function getBrewStats(db: SQLiteDatabase): Promise<BrewStats> {
  const totals = await db.getFirstAsync<{
    count: number;
    coffee: number | null;
    water: number | null;
    last: string | null;
  }>(
    `SELECT COUNT(*) AS count,
            SUM(coffee_dose_g) AS coffee,
            SUM(total_water_g) AS water,
            MAX(brewed_at) AS last
       FROM brew_sessions`
  );

  const ratings = await db.getFirstAsync<{ sum: number | null; count: number | null }>(
    `SELECT SUM(${RATING_SUM}) AS sum, SUM(${RATING_COUNT}) AS count
       FROM brew_session_ratings r`
  );

  const favouriteBean = await db.getFirstAsync<{ name: string; count: number }>(
    `SELECT bean_name_snapshot AS name, COUNT(*) AS count
       FROM brew_sessions
      WHERE bean_name_snapshot IS NOT NULL
      GROUP BY COALESCE(coffee_bean_id, bean_name_snapshot)
      ORDER BY COUNT(*) DESC, name COLLATE NOCASE ASC
      LIMIT 1`
  );

  const favouriteGrinder = await db.getFirstAsync<{ name: string; count: number }>(
    `SELECT grinder_name_snapshot AS name, COUNT(*) AS count
       FROM brew_sessions
      WHERE grinder_name_snapshot IS NOT NULL
      GROUP BY COALESCE(grinder_profile_id, grinder_name_snapshot)
      ORDER BY COUNT(*) DESC, name COLLATE NOCASE ASC
      LIMIT 1`
  );

  const best = await db.getFirstAsync<{
    id: string;
    label: string;
    rating: number;
    brewed_at: string;
  }>(
    `SELECT s.id AS id,
            COALESCE(s.bean_name_snapshot, s.recipe_name_snapshot, 'Brew') AS label,
            ${RATING_AVG} AS rating,
            s.brewed_at AS brewed_at
       FROM brew_sessions s
       JOIN brew_session_ratings r ON r.session_id = s.id
      GROUP BY s.id
     HAVING rating IS NOT NULL
      ORDER BY rating DESC, s.brewed_at DESC
      LIMIT 1`
  );

  const ratingCount = ratings?.count ?? 0;
  const ratingSum = ratings?.sum ?? 0;

  return {
    sessionCount: totals?.count ?? 0,
    averageRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    ratedCount: ratingCount,
    totalCoffeeG: Math.round((totals?.coffee ?? 0) * 10) / 10,
    totalWaterG: Math.round((totals?.water ?? 0) * 10) / 10,
    favouriteBean: favouriteBean ?? null,
    favouriteGrinder: favouriteGrinder ?? null,
    bestSession:
      best && best.rating != null
        ? { id: best.id, label: best.label, rating: best.rating, brewedAt: best.brewed_at }
        : null,
    lastBrewedAt: totals?.last ?? null,
  };
}

/** Small aggregate used on the Home dashboard. */
