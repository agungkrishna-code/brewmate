/** Coffee bean records and their brewing statistics. */

import type { CoffeeBean, CoffeeBeanDraft, CoffeeBeanWithStats, ProcessMethod, RoastLevel } from '@/types';
import { createBeanId } from '@/utils/id';
import type { SQLiteDatabase } from 'expo-sqlite';

interface BeanRow {
  id: string;
  name: string;
  origin: string | null;
  country: string | null;
  region: string | null;
  farm: string | null;
  variety: string | null;
  process: ProcessMethod;
  roast_level: RoastLevel;
  roast_date: string | null;
  tasting_notes: string | null;
  notes: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
  session_count: number;
  last_brewed_at: string | null;
}

function mapBean(row: BeanRow): CoffeeBeanWithStats {
  return {
    id: row.id,
    name: row.name,
    origin: row.origin,
    country: row.country,
    region: row.region,
    farm: row.farm,
    variety: row.variety,
    process: row.process,
    roastLevel: row.roast_level,
    roastDate: row.roast_date,
    tastingNotes: row.tasting_notes,
    notes: row.notes,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sessionCount: row.session_count ?? 0,
    lastBrewedAt: row.last_brewed_at ?? null,
    averageRating: null,
  };
}

const BEAN_SELECT = `
  SELECT b.id, b.name, b.origin, b.country, b.region, b.farm, b.variety, b.process,
         b.roast_level, b.roast_date, b.tasting_notes, b.notes, b.is_archived,
         b.created_at, b.updated_at,
         (SELECT COUNT(*) FROM brew_sessions s WHERE s.coffee_bean_id = b.id) AS session_count,
         (SELECT MAX(s.brewed_at) FROM brew_sessions s WHERE s.coffee_bean_id = b.id) AS last_brewed_at
    FROM coffee_beans b
`;

async function averageRatingsByBean(db: SQLiteDatabase): Promise<Map<string, number>> {
  const rows = await db.getAllAsync<{ bean_id: string; rating_sum: number; rating_count: number }>(
    `SELECT s.coffee_bean_id AS bean_id,
            SUM(COALESCE(r.acidity, 0) + COALESCE(r.sweetness, 0) + COALESCE(r.bitterness, 0) +
                COALESCE(r.body, 0) + COALESCE(r.clarity, 0) + COALESCE(r.aftertaste, 0)) AS rating_sum,
            SUM((r.acidity IS NOT NULL) + (r.sweetness IS NOT NULL) + (r.bitterness IS NOT NULL) +
                (r.body IS NOT NULL) + (r.clarity IS NOT NULL) + (r.aftertaste IS NOT NULL)) AS rating_count
       FROM brew_sessions s
       JOIN brew_session_ratings r ON r.session_id = s.id
      WHERE s.coffee_bean_id IS NOT NULL
      GROUP BY s.coffee_bean_id`
  );
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.rating_count > 0) {
      map.set(row.bean_id, Math.round((row.rating_sum / row.rating_count) * 10) / 10);
    }
  }
  return map;
}

export async function listBeans(
  db: SQLiteDatabase,
  options: { includeArchived?: boolean } = {}
): Promise<CoffeeBeanWithStats[]> {
  const where = options.includeArchived ? '' : 'WHERE b.is_archived = 0';
  const rows = await db.getAllAsync<BeanRow>(
    `${BEAN_SELECT} ${where} ORDER BY b.name COLLATE NOCASE ASC`
  );
  const ratings = await averageRatingsByBean(db);
  return rows.map((row) => ({ ...mapBean(row), averageRating: ratings.get(row.id) ?? null }));
}

export async function getBean(db: SQLiteDatabase, id: string): Promise<CoffeeBeanWithStats | null> {
  const row = await db.getFirstAsync<BeanRow>(`${BEAN_SELECT} WHERE b.id = ?`, [id]);
  if (!row) return null;
  const ratings = await averageRatingsByBean(db);
  return { ...mapBean(row), averageRating: ratings.get(row.id) ?? null };
}

export async function recentBeans(db: SQLiteDatabase, limit = 3): Promise<CoffeeBeanWithStats[]> {
  const beans = await listBeans(db);
  return beans
    .filter((bean) => bean.lastBrewedAt)
    .sort((a, b) => (a.lastBrewedAt! < b.lastBrewedAt! ? 1 : -1))
    .slice(0, limit);
}

function draftColumns(draft: CoffeeBeanDraft) {
  return [
    draft.name.trim(),
    draft.origin.trim() || null,
    draft.country.trim() || null,
    draft.region.trim() || null,
    draft.farm.trim() || null,
    draft.variety.trim() || null,
    draft.process,
    draft.roastLevel,
    draft.roastDate,
    draft.tastingNotes.trim() || null,
    draft.notes.trim() || null,
  ];
}

export async function createBean(db: SQLiteDatabase, draft: CoffeeBeanDraft): Promise<string> {
  const id = createBeanId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO coffee_beans (
       id, name, origin, country, region, farm, variety, process, roast_level, roast_date,
       tasting_notes, notes, is_archived, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, ...draftColumns(draft), now, now]
  );
  return id;
}

export async function updateBean(
  db: SQLiteDatabase,
  id: string,
  draft: CoffeeBeanDraft
): Promise<void> {
  await db.runAsync(
    `UPDATE coffee_beans
        SET name = ?, origin = ?, country = ?, region = ?, farm = ?, variety = ?, process = ?,
            roast_level = ?, roast_date = ?, tasting_notes = ?, notes = ?, updated_at = ?
      WHERE id = ?`,
    [...draftColumns(draft), new Date().toISOString(), id]
  );
}

export async function setBeanArchived(
  db: SQLiteDatabase,
  id: string,
  archived: boolean
): Promise<void> {
  await db.runAsync('UPDATE coffee_beans SET is_archived = ?, updated_at = ? WHERE id = ?', [
    archived ? 1 : 0,
    new Date().toISOString(),
    id,
  ]);
}

export async function deleteBean(db: SQLiteDatabase, id: string): Promise<void> {
  // Brew sessions keep their bean name snapshot, so history stays readable.
  await db.runAsync('DELETE FROM coffee_beans WHERE id = ?', [id]);
}

export function beanToDraft(bean: CoffeeBean): CoffeeBeanDraft {
  return {
    name: bean.name,
    origin: bean.origin ?? '',
    country: bean.country ?? '',
    region: bean.region ?? '',
    farm: bean.farm ?? '',
    variety: bean.variety ?? '',
    process: bean.process,
    roastLevel: bean.roastLevel,
    roastDate: bean.roastDate,
    tastingNotes: bean.tastingNotes ?? '',
    notes: bean.notes ?? '',
  };
}
