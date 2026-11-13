/** Database entry point shared by the whole app. */

import type { SQLiteDatabase } from 'expo-sqlite';

import { migrate } from './migrations';
import { ensureBuiltinGrinders } from './seed';

export const DATABASE_NAME = 'brewmate.db';

/**
 * Runs on every app launch via `SQLiteProvider.onInit`.
 * - WAL keeps writes fast and survives process death.
 * - Foreign keys must be enabled per connection.
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await migrate(db);
  // The two TIMEMORE profiles are part of the core experience; make sure they
  // exist even if an older database was created before they were seeded.
  await ensureBuiltinGrinders(db);
}

export type { SQLiteDatabase };
