/**
 * Versioned schema migrations.
 *
 * `PRAGMA user_version` records the applied version. Each migration runs inside
 * a transaction and must be safe to re-run halfway through a failed launch
 * (hence `IF NOT EXISTS` / `INSERT OR IGNORE`).
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { SCHEMA_V1 } from './schema';
import { ensureBuiltinGrinders, seedStarterRecipes } from './seed';

export interface Migration {
  version: number;
  label: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    label: 'Initial schema, built-in grinders and starter recipes',
    up: async (db) => {
      await db.execAsync(SCHEMA_V1);
      await ensureBuiltinGrinders(db);
      await seedStarterRecipes(db);
    },
  },
];

export const LATEST_VERSION = MIGRATIONS.reduce(
  (highest, migration) => Math.max(highest, migration.version),
  0
);

export async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

export async function migrate(db: SQLiteDatabase): Promise<{ from: number; to: number }> {
  const from = await getSchemaVersion(db);
  let current = from;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await migration.up(db);
    });
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    current = migration.version;
  }

  return { from, to: current };
}
